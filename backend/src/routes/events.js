const express = require('express');
const { Event, Showtime, Venue, SeatCategory, Seat, SeatStatus, User } = require('../models');
const { authenticate, authorize } = require('../middleware/auth');
const { searchMovies, getMovieDetails, discoverMovies, findAndEnrichMovie } = require('../services/tmdb');
const { discoverShows, getShowDetails } = require('../services/ticketmaster');
const { Op } = require('sequelize');

const router = express.Router();

/**
 * GET /api/events/ticketmaster/discover
 * Public: Discover live concerts, theatre shows, and comedy from Ticketmaster
 */
router.get('/ticketmaster/discover', async (req, res, next) => {
  try {
    const { classificationName, keyword, city, countryCode, size, page } = req.query;
    const data = await discoverShows({
      classificationName: classificationName || 'music',
      keyword: keyword || '',
      city: city || '',
      countryCode: countryCode || '',
      size: size ? parseInt(size, 10) : 20,
      page: page ? parseInt(page, 10) : 0,
    });
    res.json(data);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/events/ticketmaster/show/:id
 * Public: Get specific show details from Ticketmaster
 */
router.get('/ticketmaster/show/:id', async (req, res, next) => {
  try {
    const details = await getShowDetails(req.params.id);
    if (!details) {
      return res.status(404).json({ error: 'Show not found on Ticketmaster' });
    }
    res.json({ show: details });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/events/ticketmaster/sync-and-book
 * Public: Dynamically creates or finds a bookable concert event in our database from Ticketmaster data
 */
router.post('/ticketmaster/sync-and-book', async (req, res, next) => {
  try {
    const showData = req.body;
    if (!showData || !showData.title) {
      return res.status(400).json({ error: 'Show data with title is required' });
    }

    const organiser = await User.findOne({ where: { role: 'organiser' } }) || await User.findOne();
    if (!organiser) {
      return res.status(500).json({ error: 'Organiser account not available' });
    }

    // 1. Check if event already exists
    let event = await Event.findOne({
      where: {
        title: showData.title,
      },
    });

    if (!event) {
      // 2. Find or create a Concert Venue for this tour
      const venueName = showData.venue?.name
        ? `${showData.venue.name} & Concert Arena`
        : 'Jio World Grand Theatre & Concert Auditorium — BKC';
      
      const venueAddress = showData.venue?.address
        ? `${showData.venue.address}, ${showData.venue.city || ''} ${showData.venue.state || ''}`
        : 'G Block, Bandra Kurla Complex, Bandra East, Mumbai, Maharashtra';

      let venue = await Venue.findOne({ where: { name: venueName } });
      if (!venue) {
        venue = await Venue.create({
          name: venueName,
          address: venueAddress,
          totalRows: 10,
          totalCols: 28,
        });

        // Add 3-tier concert categories
        const catDefs = [
          { name: 'Upper Gallery', color: '#38bdf8', rowStart: 1, rowEnd: 3, price: 950 },
          { name: 'Grand Tier Balcony', color: '#1ed760', rowStart: 4, rowEnd: 7, price: 1800 },
          { name: 'Royal VIP Stalls', color: '#ffa42b', rowStart: 8, rowEnd: 10, price: 3500 },
        ];

        for (const c of catDefs) {
          await SeatCategory.create({
            venueId: venue.id,
            name: c.name,
            color: c.color,
            rowStart: c.rowStart,
            rowEnd: c.rowEnd,
          });
        }

        // Generate seats
        const cats = await SeatCategory.findAll({ where: { venueId: venue.id } });
        const seats = [];
        for (let r = 1; r <= venue.totalRows; r++) {
          const rowLetter = String.fromCharCode(64 + r);
          const cat = cats.find((c) => r >= c.rowStart && r <= c.rowEnd) || cats[0];
          for (let col = 1; col <= venue.totalCols; col++) {
            seats.push({
              venueId: venue.id,
              categoryId: cat.id,
              row: r,
              col,
              label: `${rowLetter}${col}`,
            });
          }
        }
        await Seat.bulkCreate(seats);
      }

      // 3. Create Event in DB
      const categories = await SeatCategory.findAll({ where: { venueId: venue.id } });
      const pricingMap = {};
      categories.forEach((cat) => {
        pricingMap[cat.id] = cat.name.includes('VIP') || cat.name.includes('Royal') ? 3500 : cat.name.includes('Grand') ? 1800 : 950;
      });

      event = await Event.create({
        organiserId: organiser.id,
        venueId: venue.id,
        title: showData.title,
        description: showData.description || `${showData.title} live in performance tour.`,
        type: 'concert',
        imageUrl: showData.imageUrl || showData.backdropUrl || 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=780&q=80',
        backdropUrl: showData.backdropUrl || showData.imageUrl || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1600&q=80',
        duration: '2h 30m',
        genre: showData.genre || 'Live Concert • Arena Tour',
        rating: 'UA 13+',
        ageRating: 'UA 13+',
        imdbRating: '8.8',
        language: 'Live Concert Audio in Dolby Atmos 360°',
        tagline: 'Experience the live world tour in full arena acoustics.',
        cast: [
          { name: showData.title.split(/[:—–-]/)[0].trim(), role: 'Main Headliner Performer', avatarUrl: showData.imageUrl },
        ],
      });

      // 4. Create 7 days of live showtime slots
      const today = new Date();
      const slots = [
        { dayOffset: 0, hour: 19, min: 30, format: 'DOLBY ATMOS 360°', screen: 'ARENA STAGE 1' },
        { dayOffset: 1, hour: 20, min: 0, format: 'DOLBY ATMOS 360°', screen: 'ARENA STAGE 1' },
        { dayOffset: 2, hour: 19, min: 30, format: 'DOLBY ATMOS 360°', screen: 'ARENA STAGE 1' },
        { dayOffset: 3, hour: 20, min: 30, format: 'DOLBY ATMOS 360°', screen: 'ARENA STAGE 1' },
        { dayOffset: 4, hour: 19, min: 30, format: 'DOLBY ATMOS 360°', screen: 'ARENA STAGE 1' },
        { dayOffset: 5, hour: 20, min: 0, format: 'DOLBY ATMOS 360°', screen: 'ARENA STAGE 1' },
      ];

      const venueSeats = await Seat.findAll({ where: { venueId: venue.id } });

      for (const slot of slots) {
        const showDate = new Date(today);
        showDate.setDate(today.getDate() + slot.dayOffset);
        showDate.setHours(slot.hour, slot.min, 0, 0);

        const st = await Showtime.create({
          eventId: event.id,
          venueId: venue.id,
          dateTime: showDate,
          pricing: pricingMap,
          format: slot.format,
          language: 'LIVE IN DOLBY ATMOS',
          screen: slot.screen,
        });

        const statuses = venueSeats.map((s) => ({
          showtimeId: st.id,
          seatId: s.id,
          status: 'available',
        }));
        await SeatStatus.bulkCreate(statuses);
      }
    }

    res.json({
      message: 'Concert event ready for booking',
      eventId: event.id,
      event,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/events/tmdb/search
 * Public / Organiser: Search TMDB movies live
 */
router.get('/tmdb/search', async (req, res, next) => {
  try {
    const { query, page } = req.query;
    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }
    const data = await searchMovies(query, page ? parseInt(page, 10) : 1);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/events/tmdb/discover
 * Public: Discover movies in real-time from TMDB (Bollywood, Hollywood, Anime, Genres, Sort)
 */
router.get('/tmdb/discover', async (req, res, next) => {
  try {
    const { industry, genre, sortBy, search, page } = req.query;
    const data = await discoverMovies({
      industry: industry || 'all',
      genre: genre || 'all',
      sortBy: sortBy || 'popularity.desc',
      search: search || '',
      page: page ? parseInt(page, 10) : 1,
    });
    res.json(data);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/events/tmdb/movie/:id
 * Public / Organiser: Get comprehensive TMDB movie details
 */
router.get('/tmdb/movie/:id', async (req, res, next) => {
  try {
    const details = await getMovieDetails(req.params.id);
    res.json(details);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/events/tmdb/sync-and-book
 * Public: Dynamically creates or finds a bookable cinema event from TMDB movie data
 */
router.post('/tmdb/sync-and-book', async (req, res, next) => {
  try {
    const movieData = req.body;
    if (!movieData || (!movieData.title && !movieData.tmdbId)) {
      return res.status(400).json({ error: 'Movie title or tmdbId is required' });
    }

    const organiser = (await User.findOne({ where: { role: 'organiser' } })) || (await User.findOne());
    if (!organiser) {
      return res.status(500).json({ error: 'Organiser account not available' });
    }

    // 1. Check if event already exists
    const cleanTitle = (movieData.title || '').replace(/[:—–-].*$/i, '').trim();
    let event = await Event.findOne({
      where: {
        title: { [Op.iLike]: `%${cleanTitle}%` },
      },
    });

    if (!event) {
      // Fetch full TMDB details if tmdbId or title
      let enriched = {};
      if (movieData.tmdbId || movieData.id) {
        try {
          enriched = await getMovieDetails(movieData.tmdbId || movieData.id);
        } catch (e) {}
      }
      if (!enriched.title && movieData.title) {
        try {
          const found = await findAndEnrichMovie(movieData.title);
          if (found) enriched = found;
        } catch (e) {}
      }

      // Find or create standard IMAX / Dolby Cinema Venue
      let venue = (await Venue.findOne({ where: { name: { [Op.iLike]: '%IMAX%' } } })) || (await Venue.findOne());
      if (!venue) {
        venue = await Venue.create({
          name: 'PVR INOX IMAX 70mm Laser Auditorium — Phoenix Palladium',
          address: '462, Senapati Bapat Marg, Lower Parel, Mumbai, Maharashtra 400013',
          totalRows: 8,
          totalCols: 14,
        });

        const catDefs = [
          { name: 'Classic Seats', color: '#38bdf8', rowStart: 1, rowEnd: 3, price: 320 },
          { name: 'Prime Club', color: '#1ed760', rowStart: 4, rowEnd: 6, price: 550 },
          { name: 'VIP Recliner Lounges', color: '#ffa42b', rowStart: 7, rowEnd: 8, price: 890 },
        ];

        for (const c of catDefs) {
          await SeatCategory.create({
            venueId: venue.id,
            name: c.name,
            color: c.color,
            rowStart: c.rowStart,
            rowEnd: c.rowEnd,
          });
        }

        const cats = await SeatCategory.findAll({ where: { venueId: venue.id } });
        const seats = [];
        for (let r = 1; r <= venue.totalRows; r++) {
          const rowLetter = String.fromCharCode(64 + r);
          const cat = cats.find((c) => r >= c.rowStart && r <= c.rowEnd) || cats[0];
          for (let c = 1; c <= venue.totalCols; c++) {
            seats.push({
              venueId: venue.id,
              categoryId: cat.id,
              row: r,
              col: c,
              label: `${rowLetter}${c}`,
            });
          }
        }
        await Seat.bulkCreate(seats);
      }

      const venueCats = await SeatCategory.findAll({ where: { venueId: venue.id } });
      const pricing = {};
      venueCats.forEach((cat) => {
        if (cat.name.toLowerCase().includes('recliner') || cat.name.toLowerCase().includes('vip')) {
          pricing[cat.id] = 850;
        } else if (cat.name.toLowerCase().includes('prime')) {
          pricing[cat.id] = 550;
        } else {
          pricing[cat.id] = 350;
        }
      });

      // Create Movie Event
      event = await Event.create({
        organiserId: organiser.id,
        venueId: venue.id,
        title: enriched.title || movieData.title,
        description:
          enriched.description ||
          movieData.overview ||
          'Live theatrical screening with 4K Laser projection and Dolby Atmos 7.1 surround sound.',
        type: 'movie',
        imageUrl: enriched.imageUrl || movieData.posterUrl,
        backdropUrl: enriched.backdropUrl || movieData.backdropUrl,
        trailerUrl: enriched.trailerUrl || 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        director: enriched.director || 'Christopher Nolan',
        duration: enriched.duration || '2h 28m',
        genre: enriched.genre || 'Action • Adventure • Sci-Fi',
        imdbRating: enriched.imdbRating || (movieData.voteAverage ? String(movieData.voteAverage) : '8.4'),
        rating: enriched.rating || 'UA 13+',
        ageRating: enriched.ageRating || 'UA 13+ (Ages 13+)',
        releaseDate: enriched.releaseDate || (movieData.releaseYear ? `${movieData.releaseYear}-01-01` : '2026-05-15'),
        language: enriched.language || 'English • Dolby Atmos 7.1',
        tagline: enriched.tagline || 'Experience it in IMAX 70mm Laser',
        budget: enriched.budget || 200000000,
        revenue: enriched.revenue || 750000000,
        showCast: true,
        showReviews: true,
        productionCompanies: enriched.productionCompanies || ['Warner Bros. Pictures', 'Universal Pictures'],
        cast: enriched.cast && enriched.cast.length > 0 ? enriched.cast : [],
        reviews: enriched.reviews && enriched.reviews.length > 0 ? enriched.reviews : [],
        similarMovies: enriched.similarMovies && enriched.similarMovies.length > 0 ? enriched.similarMovies : [],
      });

      // Generate Today & Tomorrow Showtimes
      const now = new Date();
      const showDates = [
        new Date(now.getFullYear(), now.getMonth(), now.getDate(), 14, 30),
        new Date(now.getFullYear(), now.getMonth(), now.getDate(), 18, 45),
        new Date(now.getFullYear(), now.getMonth(), now.getDate(), 21, 30),
        new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 15, 0),
        new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 19, 0),
      ];

      const venueSeats = await Seat.findAll({ where: { venueId: venue.id } });

      for (const sDate of showDates) {
        const st = await Showtime.create({
          eventId: event.id,
          dateTime: sDate,
          pricing,
        });

        const statuses = venueSeats.map((s) => ({
          showtimeId: st.id,
          seatId: s.id,
          status: 'available',
        }));
        await SeatStatus.bulkCreate(statuses);
      }
    }

    res.json({
      message: 'Movie event ready for booking',
      eventId: event.id,
      event,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/events/tmdb/sync-all
 * Admin / Organiser: Sync and enrich all existing movie records from TMDB
 */
router.post('/tmdb/sync-all', authenticate, authorize('organiser', 'admin'), async (req, res, next) => {
  try {
    const events = await Event.findAll({ where: { type: 'movie' } });
    const updated = [];

    for (const ev of events) {
      try {
        const enriched = await findAndEnrichMovie(ev.title);
        if (enriched) {
          await ev.update({
            description: enriched.description || ev.description,
            imageUrl: enriched.imageUrl || ev.imageUrl,
            backdropUrl: enriched.backdropUrl || ev.backdropUrl,
            trailerUrl: enriched.trailerUrl || ev.trailerUrl,
            director: enriched.director || ev.director,
            duration: enriched.duration || ev.duration,
            genre: enriched.genre || ev.genre,
            imdbRating: enriched.imdbRating || ev.imdbRating,
            rating: enriched.rating || ev.rating,
            ageRating: enriched.ageRating || ev.ageRating,
            releaseDate: enriched.releaseDate || ev.releaseDate,
            language: enriched.language || ev.language,
            tagline: enriched.tagline || ev.tagline,
            budget: enriched.budget || ev.budget,
            revenue: enriched.revenue || ev.revenue,
            productionCompanies: enriched.productionCompanies || ev.productionCompanies,
            cast: enriched.cast && enriched.cast.length > 0 ? enriched.cast : ev.cast,
            reviews: enriched.reviews && enriched.reviews.length > 0 ? enriched.reviews : ev.reviews,
            similarMovies: enriched.similarMovies && enriched.similarMovies.length > 0 ? enriched.similarMovies : ev.similarMovies,
          });
          updated.push({ id: ev.id, title: ev.title, status: 'synced', tmdbId: enriched.tmdbId });
        } else {
          updated.push({ id: ev.id, title: ev.title, status: 'not_found' });
        }
      } catch (err) {
        updated.push({ id: ev.id, title: ev.title, status: 'error', error: err.message });
      }
    }

    res.json({
      message: `Successfully synced ${updated.filter(u => u.status === 'synced').length} movies from TMDB`,
      results: updated,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/events
 * Organiser only: Create a new event (with live TMDB auto-enrich)
 */
router.post('/', authenticate, authorize('organiser', 'admin'), async (req, res, next) => {
  try {
    const {
      venueId,
      title,
      description,
      type,
      imageUrl,
      backdropUrl,
      trailerUrl,
      director,
      duration,
      genre,
      imdbRating,
      rating,
      ageRating,
      releaseDate,
      language,
      cast,
      reviews,
      similarMovies,
      tagline,
      budget,
      revenue,
      productionCompanies,
      showCast,
      showReviews,
      tmdbId,
      autoEnrich,
    } = req.body;

    if (!venueId || !title || !type) {
      return res.status(400).json({ error: 'venueId, title, and type are required' });
    }

    const venue = await Venue.findByPk(venueId);
    if (!venue) {
      return res.status(404).json({ error: 'Venue not found' });
    }

    let enrichedData = {};
    if (tmdbId) {
      try {
        enrichedData = await getMovieDetails(tmdbId);
      } catch (e) {}
    } else if (type === 'movie' && (autoEnrich || !imageUrl || !cast || cast.length === 0)) {
      try {
        const found = await findAndEnrichMovie(title);
        if (found) enrichedData = found;
      } catch (e) {}
    }

    const event = await Event.create({
      organiserId: req.user.id,
      venueId,
      title: title || enrichedData.title,
      description: description || enrichedData.description,
      type,
      imageUrl: imageUrl || enrichedData.imageUrl,
      backdropUrl: backdropUrl || enrichedData.backdropUrl,
      trailerUrl: trailerUrl || enrichedData.trailerUrl,
      director: director || enrichedData.director,
      duration: duration || enrichedData.duration,
      genre: genre || enrichedData.genre,
      imdbRating: imdbRating || enrichedData.imdbRating,
      rating: rating || enrichedData.rating,
      ageRating: ageRating || enrichedData.ageRating,
      releaseDate: releaseDate || enrichedData.releaseDate,
      language: language || enrichedData.language,
      tagline: tagline || enrichedData.tagline,
      budget: budget || enrichedData.budget,
      revenue: revenue || enrichedData.revenue,
      productionCompanies: productionCompanies || (enrichedData.productionCompanies || []),
      showCast: showCast !== undefined ? showCast : true,
      showReviews: showReviews !== undefined ? showReviews : true,
      cast: cast && cast.length > 0 ? cast : (enrichedData.cast || []),
      reviews: reviews && reviews.length > 0 ? reviews : (enrichedData.reviews || []),
      similarMovies: similarMovies && similarMovies.length > 0 ? similarMovies : (enrichedData.similarMovies || []),
    });

    res.status(201).json({ event });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/events/:id/showtimes
 * Organiser only: Add a showtime to an event
 * Body: { dateTime, pricing: { categoryId: price, ... } }
 */
router.post('/:id/showtimes', authenticate, authorize('organiser', 'admin'), async (req, res, next) => {
  try {
    const event = await Event.findByPk(req.params.id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Only the organiser who created the event (or admin) can add showtimes
    if (req.user.role !== 'admin' && event.organiserId !== req.user.id) {
      return res.status(403).json({ error: 'You can only add showtimes to your own events' });
    }

    const { dateTime, pricing } = req.body;
    if (!dateTime || !pricing) {
      return res.status(400).json({ error: 'dateTime and pricing are required' });
    }

    const showtime = await Showtime.create({
      eventId: event.id,
      dateTime,
      pricing,
    });

    // Generate SeatStatus entries for all seats in the venue
    const seats = await Seat.findAll({ where: { venueId: event.venueId } });
    const seatStatuses = seats.map(seat => ({
      showtimeId: showtime.id,
      seatId: seat.id,
      status: 'available',
    }));

    await SeatStatus.bulkCreate(seatStatuses);

    res.status(201).json({
      showtime,
      seatStatusCount: seatStatuses.length,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/events
 * Public: Browse and filter events
 * Query params: type, search, industry, genre, date, page, limit
 */
router.get('/', async (req, res, next) => {
  try {
    const { type, search, industry, genre, sort, date, page = 1, limit = 24 } = req.query;
    const where = {};

    if (type && type !== 'all') {
      where.type = type;
    }

    if (industry && industry !== 'all') {
      if (industry === 'bollywood') {
        where[Op.or] = [
          { language: { [Op.iLike]: '%hindi%' } },
          { language: { [Op.iLike]: '%telugu%' } },
          { title: { [Op.iLike]: '%war%' } },
          { title: { [Op.iLike]: '%kalki%' } },
        ];
      } else if (industry === 'hollywood') {
        where[Op.or] = [
          { language: { [Op.iLike]: '%english%' } },
          { title: { [Op.iLike]: '%batman%' } },
          { title: { [Op.iLike]: '%spider%' } },
          { title: { [Op.iLike]: '%dune%' } },
          { title: { [Op.iLike]: '%oppenheimer%' } },
          { title: { [Op.iLike]: '%deadpool%' } },
        ];
      } else if (industry === 'concerts') {
        where.type = 'concert';
      }
    }

    if (search) {
      where.title = { [Op.iLike]: `%${search}%` };
    }

    if (genre && genre !== 'all') {
      where.genre = { [Op.iLike]: `%${genre}%` };
    }

    let order = [['created_at', 'DESC']];
    if (sort === 'rating') {
      order = [['imdb_rating', 'DESC']];
    } else if (sort === 'release') {
      order = [['release_date', 'DESC'], ['created_at', 'DESC']];
    }

    const include = [
      { model: Venue, as: 'venue', attributes: ['id', 'name', 'address'] },
      { model: User, as: 'organiser', attributes: ['id', 'name'] },
      {
        model: Showtime,
        as: 'showtimes',
        ...(date ? {
          where: {
            dateTime: {
              [Op.gte]: new Date(date),
              [Op.lt]: new Date(new Date(date).getTime() + 24 * 60 * 60 * 1000),
            },
          },
        } : {}),
      },
    ];

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { rows: events, count: total } = await Event.findAndCountAll({
      where,
      include,
      order,
      limit: parseInt(limit),
      offset,
      distinct: true,
    });

    res.json({
      events,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/events/:id
 * Public: Get event detail with showtimes, reviews, and similar movies
 */
router.get('/:id', async (req, res, next) => {
  try {
    const event = await Event.findByPk(req.params.id, {
      include: [
        { model: Venue, as: 'venue', include: [{ model: SeatCategory, as: 'categories' }] },
        { model: User, as: 'organiser', attributes: ['id', 'name'] },
        {
          model: Showtime,
          as: 'showtimes',
          include: [{ model: Venue, as: 'venue' }],
        },
      ],
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json({ event });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
