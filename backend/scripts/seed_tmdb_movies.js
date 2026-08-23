require('dotenv').config();
const { Event, Showtime, Venue, Seat, SeatStatus, User } = require('../src/models');
const { getMovieDetails, searchMovies, findAndEnrichMovie, discoverMovies } = require('../src/services/tmdb');

const BLOCKBUSTER_MOVIES = [
  {
    title: 'SPIDER-MAN: BEYOND THE SPIDER-VERSE (2026)',
    type: 'movie',
    tmdbQuery: 'Spider-Man: Beyond the Spider-Verse',
    fallbackQuery: 'Spider-Man: Across the Spider-Verse',
    language: 'English • IMAX 3D & Dolby Atmos',
    fallback: {
      description: 'Miles Morales traverses the multiverse with Gwen Stacy and a team of Spider-People to face their most powerful adversary yet.',
      director: 'Joaquim Dos Santos',
      genre: 'Animation • Action • Sci-Fi',
      duration: '2h 20m',
      imdbRating: '8.9',
      rating: 'UA 13+',
      ageRating: 'UA 13+ (PG-13)',
      imageUrl: 'https://image.tmdb.org/t/p/w780/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg',
      backdropUrl: 'https://image.tmdb.org/t/p/original/4HodYYKEIsGOdinkGi2Ucz6X9i0.jpg',
      trailerUrl: 'https://www.youtube.com/watch?v=cqGjhVJWtEg',
      tagline: 'It\'s how you wear the mask that matters.',
      cast: [
        { name: 'Shameik Moore', role: 'Miles Morales / Spider-Man' },
        { name: 'Hailee Steinfeld', role: 'Gwen Stacy / Spider-Woman' },
        { name: 'Oscar Isaac', role: 'Miguel O\'Hara / Spider-Man 2099' },
        { name: 'Daniel Kaluuya', role: 'Hobart \'Hobie\' Brown / Spider-Punk' }
      ]
    }
  },
  {
    title: 'DEADPOOL & WOLVERINE',
    type: 'movie',
    tmdbQuery: 'Deadpool & Wolverine',
    language: 'English • Dolby Atmos 7.1',
    fallback: {
      description: 'A listless Wade Wilson toils away in civilian life with his days as the morally flexible mercenary behind him. But when his home world faces an existential threat, Wade must reluctantly suit-up again with an even more reluctant Wolverine.',
      director: 'Shawn Levy',
      genre: 'Action • Comedy • Sci-Fi',
      duration: '2h 08m',
      imdbRating: '8.0',
      rating: 'A (18+)',
      ageRating: 'A (Rated R - 18+)',
      imageUrl: 'https://image.tmdb.org/t/p/w780/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg',
      backdropUrl: 'https://image.tmdb.org/t/p/original/yDHYTfA3R0jFYba16jBB1ef8oIt.jpg',
      trailerUrl: 'https://www.youtube.com/watch?v=73_1biulkYk',
      tagline: 'Everyone deserves a happy ending.',
      cast: [
        { name: 'Ryan Reynolds', role: 'Wade Wilson / Deadpool' },
        { name: 'Hugh Jackman', role: 'Logan / Wolverine' },
        { name: 'Emma Corrin', role: 'Cassandra Nova' }
      ]
    }
  },
  {
    title: 'WAR 2 (2026)',
    type: 'movie',
    tmdbQuery: 'War 2',
    language: 'Hindi • IMAX & Dolby Atmos',
    fallback: {
      description: 'Major Kabir Dhaliwal faces off against an elite rogue agent across global theaters of war in an adrenaline-fueled spy spectacle.',
      director: 'Ayan Mukerji',
      genre: 'Action • Thriller • Spy',
      duration: '2h 38m',
      imdbRating: '8.4',
      rating: 'UA 16+',
      ageRating: 'UA 16+',
      imageUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=780&q=80',
      backdropUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1600&q=80',
      trailerUrl: 'https://www.youtube.com/watch?v=In2VI_40YW0',
      tagline: 'Two legends. One mission.',
      cast: [
        { name: 'Hrithik Roshan', role: 'Major Kabir Dhaliwal' },
        { name: 'N. T. Rama Rao Jr.', role: 'Agent Vikram' },
        { name: 'Kiara Advani', role: 'Kavya' }
      ]
    }
  },
  {
    title: 'THE BATMAN: PART II (2026)',
    type: 'movie',
    tmdbQuery: 'The Batman Part II',
    fallbackQuery: 'The Batman',
    language: 'English • IMAX 70mm Laser',
    fallback: {
      description: 'Bruce Wayne delves deeper into Gotham City corruption, confronting the Court of Owls in a gothic psychological thriller.',
      director: 'Matt Reeves',
      genre: 'Action • Crime • Mystery',
      duration: '2h 55m',
      imdbRating: '8.7',
      rating: 'UA 16+',
      ageRating: 'UA 16+ (PG-13)',
      imageUrl: 'https://image.tmdb.org/t/p/w780/74xTEgt7R36Fpooo50r9T25onhq.jpg',
      backdropUrl: 'https://image.tmdb.org/t/p/original/tRS6jvPM9qPrrnx2KRk3ew96Yot.jpg',
      trailerUrl: 'https://www.youtube.com/watch?v=mqqft2x_Aa4',
      tagline: 'Gotham belongs to the shadows.',
      cast: [
        { name: 'Robert Pattinson', role: 'Bruce Wayne / Batman' },
        { name: 'Andy Serkis', role: 'Alfred Pennyworth' },
        { name: 'Colin Farrell', role: 'Oswald Cobblepot / Penguin' }
      ]
    }
  },
  {
    title: 'KALKI 2898 AD: PART TWO (2026)',
    type: 'movie',
    tmdbQuery: 'Kalki 2898 AD',
    language: 'Telugu / Hindi • Dolby 3D Laser',
    fallback: {
      description: 'The futuristic mythological battle reaches its crescendo as Bhairava and Ashwatthama protect the prophecy of the new dawn.',
      director: 'Nag Ashwin',
      genre: 'Sci-Fi • Mythological • Action',
      duration: '3h 02m',
      imdbRating: '8.5',
      rating: 'UA 13+',
      ageRating: 'UA 13+',
      imageUrl: 'https://image.tmdb.org/t/p/w780/3Nflk4HcqY7k9Rj7Y4U0M8fO0m1.jpg',
      backdropUrl: 'https://image.tmdb.org/t/p/original/4w10bEw8bI7k8Y4U0M8fO0m1.jpg',
      trailerUrl: 'https://www.youtube.com/watch?v=y1-w1pUGuz4',
      tagline: 'The battle for tomorrow begins today.',
      cast: [
        { name: 'Prabhas', role: 'Bhairava' },
        { name: 'Amitabh Bachchan', role: 'Ashwatthama' },
        { name: 'Deepika Padukone', role: 'SUM-80' }
      ]
    }
  },
  {
    title: 'DUNE: PART TWO',
    type: 'movie',
    tmdbQuery: 'Dune: Part Two',
    language: 'English • IMAX 70MM 12-Channel Sound',
    fallback: {
      description: 'Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family.',
      director: 'Denis Villeneuve',
      genre: 'Sci-Fi • Adventure • Drama',
      duration: '2h 46m',
      imdbRating: '8.6',
      rating: 'UA 13+',
      ageRating: 'UA 13+ (PG-13)',
      imageUrl: 'https://image.tmdb.org/t/p/w780/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg',
      backdropUrl: 'https://image.tmdb.org/t/p/original/xOMo8BRK7PfcJv9JCnx7s520QIq.jpg',
      trailerUrl: 'https://www.youtube.com/watch?v=Way9Dexny3w',
      tagline: 'Long live the fighters.',
      cast: [
        { name: 'Timothée Chalamet', role: 'Paul Atreides' },
        { name: 'Zendaya', role: 'Chani' },
        { name: 'Rebecca Ferguson', role: 'Lady Jessica' }
      ]
    }
  },
  {
    title: 'PUSHPA 2: THE RULE',
    type: 'movie',
    tmdbQuery: 'Pushpa: The Rule - Part 2',
    fallbackQuery: 'Pushpa',
    language: 'Telugu / Hindi • Dolby Atmos 4K',
    fallback: {
      description: 'Pushpa Raj solidifies his empire as SP Bhanwar Singh Shekhawat seeks absolute retribution in a high-stakes clash.',
      director: 'Sukumar',
      genre: 'Action • Crime • Drama',
      duration: '3h 20m',
      imdbRating: '8.2',
      rating: 'A (18+)',
      ageRating: 'A (18+)',
      imageUrl: 'https://image.tmdb.org/t/p/w780/bQ2vH4U2K6N8W4Z8Y4U0M8fO0m1.jpg',
      backdropUrl: 'https://image.tmdb.org/t/p/original/9Y4U0M8fO0m1bQ2vH4U2K6N8W4Z.jpg',
      trailerUrl: 'https://www.youtube.com/watch?v=1kVK0MZlbI4',
      tagline: 'Wildfire that never calms.',
      cast: [
        { name: 'Allu Arjun', role: 'Pushpa Raj' },
        { name: 'Rashmika Mandanna', role: 'Srivalli' },
        { name: 'Fahadh Faasil', role: 'SP Bhanwar Singh Shekhawat' }
      ]
    }
  },
  {
    title: 'HANS ZIMMER LIVE — SYMPHONIC WORLD TOUR 2026',
    type: 'concert',
    tmdbQuery: 'Hans Zimmer Live',
    language: 'Live Dolby Atmos 360 Spatial Audio',
    fallback: {
      description: 'Academy Award winning composer Hans Zimmer performs breathtaking live symphonic suites from Interstellar, Inception, Dune, and Gladiator with full orchestra and choir.',
      director: 'Hans Zimmer',
      genre: 'Live Symphony • Epic Orchestral',
      duration: '2h 45m',
      imdbRating: '9.5',
      rating: 'U (All Ages)',
      ageRating: 'U (All Ages)',
      imageUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80',
      backdropUrl: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1600&q=80',
      trailerUrl: 'https://www.youtube.com/watch?v=PG5c2GgkA2w',
      tagline: 'An unforgettable musical odyssey.',
      cast: [
        { name: 'Hans Zimmer', role: 'Composer & Multi-Instrumentalist' },
        { name: 'Tina Guo', role: 'Electric Cello Virtuoso' }
      ]
    }
  }
];

async function seedAllMovies() {
  console.log("🎬 STARTING TMDB CINEMA SEEDING WITH LATEST BLOCKBUSTERS...");

  const organiser = await User.findOne({ where: { role: 'organiser' } }) || await User.findOne();
  if (!organiser) {
    console.error("❌ No user found. Run user seed first.");
    return;
  }

  const venues = await Venue.findAll();
  if (!venues || venues.length === 0) {
    console.error("❌ No venues found. Run venue seed first.");
    return;
  }

  console.log(`✅ Found ${venues.length} venues and organiser: ${organiser.name}`);

  for (let i = 0; i < BLOCKBUSTER_MOVIES.length; i++) {
    const item = BLOCKBUSTER_MOVIES[i];
    const venue = venues[i % venues.length];

    console.log(`\n🔍 Fetching TMDB data for "${item.title}"...`);
    let enriched = null;
    try {
      enriched = await findAndEnrichMovie(item.tmdbQuery);
      if (!enriched && item.fallbackQuery) {
        enriched = await findAndEnrichMovie(item.fallbackQuery);
      }
    } catch (e) {
      console.warn(`TMDB fetch notice for ${item.title}: ${e.message}`);
    }

    const movieData = {
      organiserId: organiser.id,
      venueId: venue.id,
      title: item.title,
      description: enriched?.description || item.fallback.description,
      type: item.type,
      imageUrl: enriched?.imageUrl || item.fallback.imageUrl,
      backdropUrl: enriched?.backdropUrl || item.fallback.backdropUrl,
      trailerUrl: enriched?.trailerUrl || item.fallback.trailerUrl,
      director: enriched?.director || item.fallback.director,
      duration: enriched?.duration || item.fallback.duration,
      genre: enriched?.genre || item.fallback.genre,
      imdbRating: enriched?.imdbRating || item.fallback.imdbRating,
      rating: enriched?.rating || item.fallback.rating,
      ageRating: enriched?.ageRating || item.fallback.ageRating,
      releaseDate: enriched?.releaseDate || '2026',
      language: item.language,
      tagline: enriched?.tagline || item.fallback.tagline,
      cast: enriched?.cast && enriched.cast.length > 0 ? enriched.cast : item.fallback.cast,
      reviews: enriched?.reviews || [],
      similarMovies: enriched?.similarMovies || [],
    };

    let [event, created] = await Event.findOrCreate({
      where: { title: item.title },
      defaults: movieData,
    });

    if (!created) {
      await event.update(movieData);
      console.log(`⚡ Updated existing event: ${event.title}`);
    } else {
      console.log(`✨ Created new event: ${event.title}`);
    }

    // Schedule rich multi-day showtimes
    const today = new Date();
    const showtimeSlots = [
      { dayOffset: 0, hour: 13, min: 0, format: '4K LASER', lang: 'ENGLISH', screen: 'AUDI 1' },
      { dayOffset: 0, hour: 17, min: 30, format: 'IMAX 70MM', lang: 'ENGLISH', screen: 'IMAX LASER 1' },
      { dayOffset: 0, hour: 21, min: 15, format: 'DOLBY ATMOS', lang: 'HINDI', screen: 'AUDI 2' },
      { dayOffset: 1, hour: 14, min: 30, format: 'DOLBY 3D', lang: 'HINDI', screen: 'AUDI 3' },
      { dayOffset: 1, hour: 18, min: 45, format: 'IMAX 70MM', lang: 'ENGLISH', screen: 'IMAX LASER 1' },
      { dayOffset: 1, hour: 22, min: 0, format: '4K LASER', lang: 'TELUGU', screen: 'AUDI 4' },
      { dayOffset: 2, hour: 15, min: 15, format: 'DOLBY ATMOS', lang: 'ENGLISH', screen: 'AUDI 2' },
      { dayOffset: 2, hour: 20, min: 0, format: 'IMAX 70MM', lang: 'ENGLISH', screen: 'IMAX LASER 1' },
    ];

    const seats = await Seat.findAll({ where: { venueId: venue.id } });

    for (const slot of showtimeSlots) {
      const showDate = new Date(today);
      showDate.setDate(today.getDate() + slot.dayOffset);
      showDate.setHours(slot.hour, slot.min, 0, 0);

      const [st, stCreated] = await Showtime.findOrCreate({
        where: {
          eventId: event.id,
          venueId: venue.id,
          dateTime: showDate,
        },
        defaults: {
          eventId: event.id,
          venueId: venue.id,
          dateTime: showDate,
          pricing: {
            classic: 350,
            prime: 550,
            recliner: 950,
          },
          format: slot.format,
          language: slot.lang,
          screen: slot.screen,
        },
      });

      if (stCreated && seats.length > 0) {
        const seatStatuses = seats.map((s) => ({
          showtimeId: st.id,
          seatId: s.id,
          status: 'available',
        }));
        await SeatStatus.bulkCreate(seatStatuses);
      }
    }
  }

  console.log("🎉 ALL BLOCKBUSTERS SUCCESSFULLY SEEDED WITH MULTI-DAY SHOWTIMES & SEATS!");
}

seedAllMovies()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Seeding failed:", err);
    process.exit(1);
  });
