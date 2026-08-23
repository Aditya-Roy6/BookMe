require('dotenv').config();
const { Event, Showtime, Venue, SeatCategory, Seat, SeatStatus, User, sequelize } = require('../src/models');
const { findAndEnrichMovie, searchMovies, getMovieDetails } = require('../src/services/tmdb');

const TMDB_ACCESS_TOKEN = process.env.TMDB_ACCESS_TOKEN;
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

// Fetch person profile avatar from TMDB
async function fetchPersonAvatar(personName) {
  try {
    const url = new URL('https://api.themoviedb.org/3/search/person');
    url.searchParams.append('query', personName);
    const headers = { accept: 'application/json' };
    if (TMDB_ACCESS_TOKEN) {
      headers.Authorization = `Bearer ${TMDB_ACCESS_TOKEN}`;
    } else if (TMDB_API_KEY) {
      url.searchParams.append('api_key', TMDB_API_KEY);
    }
    const res = await fetch(url.toString(), { headers });
    if (res.ok) {
      const data = await res.json();
      const p = data.results?.[0];
      if (p && p.profile_path) {
        return `${TMDB_IMAGE_BASE_URL}/w185${p.profile_path}`;
      }
    }
  } catch (e) {}
  return null;
}

// Venues with fully packed rows & realistic auditorium tiers: Classic in front (Rows 1-3 near screen), VIP Recliners in back (Rows 7-8 / 8-10)
const CINEMA_VENUES = [
  {
    name: 'PVR INOX: IMAX 70MM & Dolby Cinema — Phoenix Palladium',
    address: '462, Senapati Bapat Marg, Lower Parel, Mumbai, Maharashtra • 1.8 km away',
    totalRows: 8,
    totalCols: 18,
    categories: [
      { name: 'Classic Seats', color: '#38bdf8', rowStart: 1, rowEnd: 3, price: 350 },
      { name: 'Prime Club', color: '#1ed760', rowStart: 4, rowEnd: 6, price: 550 },
      { name: 'VIP Recliner Lounges', color: '#ffa42b', rowStart: 7, rowEnd: 8, price: 950 },
    ],
  },
  {
    name: 'Cinépolis: 4K Laser & RealD 3D — Forum Mall',
    address: 'Hosur Rd, Chikku Lakshmaiah Layout, Koramangala, Bengaluru, Karnataka • 3.4 km away',
    totalRows: 8,
    totalCols: 18,
    categories: [
      { name: 'Classic Seats', color: '#38bdf8', rowStart: 1, rowEnd: 3, price: 320 },
      { name: 'Prime Club', color: '#1ed760', rowStart: 4, rowEnd: 6, price: 480 },
      { name: 'VIP Recliner Lounges', color: '#ffa42b', rowStart: 7, rowEnd: 8, price: 850 },
    ],
  },
  {
    name: 'PVR ICON: Gold Class & Dolby Atmos — Infinity Mall',
    address: 'Link Rd, Oshiwara, Andheri West, Mumbai, Maharashtra • 4.2 km away',
    totalRows: 8,
    totalCols: 18,
    categories: [
      { name: 'Classic Executive', color: '#38bdf8', rowStart: 1, rowEnd: 3, price: 380 },
      { name: 'Prime Club', color: '#1ed760', rowStart: 4, rowEnd: 6, price: 600 },
      { name: 'VIP Gold Class Recliners', color: '#ffa42b', rowStart: 7, rowEnd: 8, price: 1100 },
    ],
  },
  {
    name: 'PVR Superplex: 4DX & ICE Theatres — Logix City Center',
    address: 'BW-58, Sector 32, Noida, Uttar Pradesh • 2.6 km away',
    totalRows: 8,
    totalCols: 18,
    categories: [
      { name: 'Classic Seats', color: '#38bdf8', rowStart: 1, rowEnd: 3, price: 340 },
      { name: 'Prime Club', color: '#1ed760', rowStart: 4, rowEnd: 6, price: 520 },
      { name: 'VIP Recliner Lounges', color: '#ffa42b', rowStart: 7, rowEnd: 8, price: 900 },
    ],
  },
  {
    name: 'Prasads Multiplex: Large Screen Laser — NTR Gardens',
    address: 'Khairatabad, Hyderabad, Telangana • 1.5 km away',
    totalRows: 9,
    totalCols: 20,
    categories: [
      { name: 'Classic Seats', color: '#38bdf8', rowStart: 1, rowEnd: 3, price: 280 },
      { name: 'Prime Club', color: '#1ed760', rowStart: 4, rowEnd: 7, price: 450 },
      { name: 'VIP Recliner Lounges', color: '#ffa42b', rowStart: 8, rowEnd: 9, price: 750 },
    ],
  },
  {
    name: 'PVR VR Chennai — Anna Nagar',
    address: '3rd Floor, VR Mall, MetroZone, No 44, Jawaharlal Nehru Rd, Chennai • 3.9 km away',
    totalRows: 8,
    totalCols: 18,
    categories: [
      { name: 'Classic Seats', color: '#38bdf8', rowStart: 1, rowEnd: 3, price: 300 },
      { name: 'Prime Club', color: '#1ed760', rowStart: 4, rowEnd: 6, price: 480 },
      { name: 'VIP Recliner Lounges', color: '#ffa42b', rowStart: 7, rowEnd: 8, price: 850 },
    ],
  },
  {
    name: 'Jio World Grand Theatre & Concert Auditorium — BKC',
    address: 'G Block, Bandra Kurla Complex, Bandra East, Mumbai, Maharashtra • 2.1 km away',
    totalRows: 10,
    totalCols: 28,
    categories: [
      { name: 'Upper Gallery', color: '#38bdf8', rowStart: 1, rowEnd: 3, price: 950 },
      { name: 'Grand Tier Balcony', color: '#1ed760', rowStart: 4, rowEnd: 7, price: 1800 },
      { name: 'Royal VIP Stalls', color: '#ffa42b', rowStart: 8, rowEnd: 10, price: 3500 },
    ],
  },
  {
    name: 'Royal Opera House & Auditorium — Girgaon',
    address: 'Mama Parmanand Marg, Charni Road East, Mumbai, Maharashtra • 5.0 km away',
    totalRows: 9,
    totalCols: 26,
    categories: [
      { name: 'Balcony Gallery', color: '#38bdf8', rowStart: 1, rowEnd: 3, price: 750 },
      { name: 'Dress Circle', color: '#1ed760', rowStart: 4, rowEnd: 6, price: 1500 },
      { name: 'Royal Box & Stalls', color: '#ffa42b', rowStart: 7, rowEnd: 9, price: 2800 },
    ],
  },
];

const MOVIES_AND_CONCERTS = [
  {
    title: 'SPIDER-MAN: BRAND NEW DAY (2026)',
    type: 'movie',
    tmdbQuery: 'Spider-Man Brand New Day',
    fallbackQuery: 'Spider-Man: No Way Home',
    language: 'English • IMAX 3D & Dolby Atmos',
    venueKeyword: 'Palladium',
    customDetails: {
      director: 'Destin Daniel Cretton',
      tagline: 'A brand new day starts now.',
      description: 'Peter Parker navigates a new era in New York City with his identity forgotten by the world, confronting street-level crime and new threats alongside Daredevil and classic adversaries.',
      castNames: [
        { name: 'Tom Holland', role: 'Peter Parker / Spider-Man' },
        { name: 'Zendaya', role: 'MJ / Michelle Jones' },
        { name: 'Charlie Cox', role: 'Matt Murdock / Daredevil' },
        { name: 'Sadie Sink', role: 'Felicia Hardy / Black Cat' },
        { name: 'Jon Bernthal', role: 'Frank Castle / The Punisher' },
      ],
    },
  },
  {
    title: 'THE ODYSSEY (2026)',
    type: 'movie',
    tmdbQuery: 'The Odyssey',
    fallbackQuery: 'Troy',
    language: 'English • IMAX 70mm Laser & Dolby Atmos',
    venueKeyword: 'Palladium',
    customDetails: {
      director: 'Christopher Nolan',
      tagline: 'The epic voyage home across uncharted mythical oceans.',
      description: 'Homer’s timeless Greek epic brought to life with groundbreaking practical effects, following Odysseus on his perilous ten-year voyage home to Ithaca after the fall of Troy.',
      castNames: [
        { name: 'Ralph Fiennes', role: 'Odysseus' },
        { name: 'Juliette Binoche', role: 'Penelope' },
        { name: 'Charlie Plummer', role: 'Telemachus' },
        { name: 'Claudio Santamaria', role: 'Eumaeus' },
      ],
    },
  },
  {
    title: 'MUTINY (2026)',
    type: 'movie',
    tmdbQuery: 'Mutiny',
    fallbackQuery: 'The Beekeeper',
    language: 'English • Dolby Atmos 7.1',
    venueKeyword: 'Forum',
    customDetails: {
      director: 'Jean-François Richet',
      tagline: 'Framed. Hunted. Unstoppable.',
      description: 'When his billionaire industrialist boss is murdered in front of him, ex-Special Forces operative Cole Reed is framed for the crime, embarking on a relentless global conspiracy thriller.',
      castNames: [
        { name: 'Jason Statham', role: 'Cole Reed' },
        { name: 'Annabelle Wallis', role: 'Agent Rhona Fox' },
        { name: 'Jason Flemyng', role: 'Director Vance' },
      ],
    },
  },
  {
    title: 'TOY STORY 5 (2026)',
    type: 'movie',
    tmdbQuery: 'Toy Story 5',
    fallbackQuery: 'Toy Story 4',
    language: 'English • RealD 3D & Dolby Atmos',
    venueKeyword: 'Infinity',
    customDetails: {
      director: 'Andrew Stanton',
      tagline: 'Toy meets Tech.',
      description: 'Woody, Buzz Lightyear, and the whole crew reunite to face their newest challenge: the rise of screens, tablets, and high-tech electronic gadgets captivating children everywhere.',
      castNames: [
        { name: 'Tom Hanks', role: 'Woody (voice)' },
        { name: 'Tim Allen', role: 'Buzz Lightyear (voice)' },
        { name: 'Joan Cusack', role: 'Jessie (voice)' },
        { name: 'Tony Hale', role: 'Forky (voice)' },
      ],
    },
  },
  {
    title: 'RAGE OF STARS: CONTROL THE CHAOS (2026)',
    type: 'movie',
    tmdbQuery: 'Rage of Stars',
    fallbackQuery: 'Interstellar',
    language: 'English • IMAX 70mm Laser',
    venueKeyword: 'Logix',
    customDetails: {
      director: 'Denis Villeneuve',
      tagline: 'Control the Chaos.',
      description: 'When a cataclysmic solar eruption threatens Earth’s orbital defense shields, an elite aerospace strike squadron embarks on a dangerous deep-space interception mission.',
      castNames: [
        { name: 'Michael B. Jordan', role: 'Commander Aaron Cross' },
        { name: 'Ana de Armas', role: 'Dr. Elena Vance' },
        { name: 'Pedro Pascal', role: 'Captain Marcus Ruiz' },
      ],
    },
  },
  {
    title: 'F1: FORMULA 1 RACING (2026)',
    type: 'movie',
    tmdbQuery: 'F1',
    fallbackQuery: 'Top Gun: Maverick',
    language: 'English • IMAX 70mm Laser & Dolby Atmos',
    venueKeyword: 'Prasads',
    customDetails: {
      director: 'Joseph Kosinski',
      tagline: 'Speed is the only truth.',
      description: 'A former Formula 1 legend comes out of retirement to mentor a prodigy rookie driver on the fictional APXGP team, shot live at authentic Grand Prix weekends worldwide.',
      castNames: [
        { name: 'Brad Pitt', role: 'Sonny Hayes' },
        { name: 'Damson Idris', role: 'Joshua Pearce' },
        { name: 'Javier Bardem', role: 'APXGP Team Principal' },
        { name: 'Kerry Condon', role: 'Kate' },
      ],
    },
  },
  {
    title: 'AVATAR: FIRE AND ASH (2026)',
    type: 'movie',
    tmdbQuery: 'Avatar: Fire and Ash',
    fallbackQuery: 'Avatar: The Way of Water',
    language: 'English • IMAX 3D 4K HFR',
    venueKeyword: 'Palladium',
    customDetails: {
      director: 'James Cameron',
      tagline: 'Return to Pandora. Discover the Ash People.',
      description: 'Jake Sully and Neytiri encounter the volcanic Ash People of Pandora—a fiery, aggressive Na’vi clan led by the enigmatic Varang, pushing Pandora to the brink of civil war.',
      castNames: [
        { name: 'Sam Worthington', role: 'Jake Sully' },
        { name: 'Zoe Saldaña', role: 'Neytiri' },
        { name: 'Sigourney Weaver', role: 'Kiri' },
        { name: 'Oona Chaplin', role: 'Varang' },
      ],
    },
  },
  {
    title: 'DEADPOOL & WOLVERINE',
    type: 'movie',
    tmdbQuery: 'Deadpool & Wolverine',
    language: 'English • Dolby Atmos 7.1',
    venueKeyword: 'Forum',
  },
  {
    title: 'WAR 2 (2026)',
    type: 'movie',
    tmdbQuery: 'War 2',
    language: 'Hindi • IMAX & Dolby Atmos',
    venueKeyword: 'Infinity',
    customDetails: {
      director: 'Ayan Mukerji',
      tagline: 'Two legends. One mission.',
      description: 'Major Kabir Dhaliwal faces off against an elite rogue agent across global theaters of war in an adrenaline-fueled spy spectacle.',
      castNames: [
        { name: 'Hrithik Roshan', role: 'Major Kabir Dhaliwal' },
        { name: 'N.T. Rama Rao Jr.', role: 'Agent Vikram' },
        { name: 'Kiara Advani', role: 'Kavya' },
      ],
    },
  },
  {
    title: 'THE BATMAN: PART II (2026)',
    type: 'movie',
    tmdbQuery: 'The Batman Part II',
    fallbackQuery: 'The Batman',
    language: 'English • IMAX 70mm Laser',
    venueKeyword: 'Logix',
    customDetails: {
      director: 'Matt Reeves',
      tagline: 'Gotham belongs to the shadows.',
      castNames: [
        { name: 'Robert Pattinson', role: 'Bruce Wayne / Batman' },
        { name: 'Andy Serkis', role: 'Alfred Pennyworth' },
        { name: 'Colin Farrell', role: 'Oswald Cobblepot / Penguin' },
        { name: 'Zoë Kravitz', role: 'Selina Kyle / Catwoman' },
      ],
    },
  },
  {
    title: 'KALKI 2898 AD: PART TWO (2026)',
    type: 'movie',
    tmdbQuery: 'Kalki 2898 AD',
    language: 'Telugu • IMAX 3D & 4K Laser',
    venueKeyword: 'Prasads',
    customDetails: {
      director: 'Nag Ashwin',
      tagline: 'The battle for tomorrow begins today.',
      castNames: [
        { name: 'Prabhas', role: 'Bhairava' },
        { name: 'Amitabh Bachchan', role: 'Ashwatthama' },
        { name: 'Kamal Haasan', role: 'Supreme Yaskin' },
        { name: 'Deepika Padukone', role: 'Sumathi' },
      ],
    },
  },
  {
    title: 'DUNE: PART TWO',
    type: 'movie',
    tmdbQuery: 'Dune: Part Two',
    language: 'English • IMAX 70mm Laser',
    venueKeyword: 'Palladium',
  },
  {
    title: 'PUSHPA 2: THE RULE',
    type: 'movie',
    tmdbQuery: 'Pushpa 2: The Rule',
    language: 'Hindi • 4K Laser RealD 3D',
    venueKeyword: 'VR Chennai',
    customDetails: {
      director: 'Sukumar',
      tagline: 'The wildfire is unstoppable.',
      castNames: [
        { name: 'Allu Arjun', role: 'Pushpa Raj' },
        { name: 'Rashmika Mandanna', role: 'Srivalli' },
        { name: 'Fahadh Faasil', role: 'SP Bhanwar Singh Shekhawat' },
        { name: 'Ajay Ghosh', role: 'Konda Reddy' },
      ],
    },
  },
  {
    title: 'Hans Zimmer Live — Symphonic World Tour 2026',
    type: 'concert',
    tmdbQuery: 'Hans Zimmer: Live in Prague',
    fallbackQuery: 'Hans Zimmer',
    language: 'Live Orchestral Audio in Dolby Atmos',
    venueKeyword: 'Jio World',
    customDetails: {
      director: 'Hans Zimmer',
      tagline: 'An unforgettable musical odyssey.',
      description: 'Legendary Academy Award-winning composer Hans Zimmer performs his iconic cinematic scores from Inception, Gladiator, Interstellar, The Dark Knight, and Dune with a 60-piece symphony orchestra and vocal choir.',
      castNames: [
        { name: 'Hans Zimmer', role: 'Composer & Multi-Instrumentalist' },
        { name: 'Tina Guo', role: 'Electric Cello Virtuoso' },
        { name: 'Guthrie Govan', role: 'Lead Guitarist' },
      ],
    },
  },
  {
    title: 'Coldplay — Music of the Spheres World Tour',
    type: 'concert',
    tmdbQuery: 'Coldplay: A Head Full of Dreams',
    fallbackQuery: 'Coldplay Live 2012',
    language: 'Live Concert Audio in Dolby Atmos 360°',
    venueKeyword: 'Royal Opera House',
    customDetails: {
      director: 'Chris Martin',
      tagline: 'A cosmic musical spectacle.',
      description: 'Experience Coldplay live with kinetic stadium lighting, planetary visual projections, and anthems including Yellow, Viva La Vida, Fix You, and Higher Power.',
      castNames: [
        { name: 'Chris Martin', role: 'Lead Vocals & Piano' },
        { name: 'Jonny Buckland', role: 'Lead Guitar' },
        { name: 'Guy Berryman', role: 'Bass' },
        { name: 'Will Champion', role: 'Drums' },
      ],
    },
  },
  {
    title: 'Dua Lipa — Radical Optimism World Tour 2026',
    type: 'concert',
    tmdbQuery: 'Dua Lipa: Live',
    fallbackQuery: 'Dua Lipa',
    language: 'Live Concert Audio in Dolby Atmos 360°',
    venueKeyword: 'Jio World',
    customDetails: {
      director: 'Dua Lipa',
      tagline: 'Radical energy and disco pop spectacles.',
      description: 'Dua Lipa electrifies live arenas worldwide with hits from Radical Optimism and Future Nostalgia including Houdini, Training Season, Levitating, and Don’t Start Now.',
      castNames: [
        { name: 'Dua Lipa', role: 'Lead Vocals & Performance' },
      ],
    },
  },
  {
    title: 'The Weeknd — After Hours Til Dawn Stadium Tour',
    type: 'concert',
    tmdbQuery: 'The Weeknd: Live at SoFi Stadium',
    fallbackQuery: 'The Weeknd',
    language: 'Live Concert Audio in Dolby Atmos 360°',
    venueKeyword: 'Royal Opera House',
    customDetails: {
      director: 'Abel Tesfaye',
      tagline: 'A dystopian cinematic pop epic.',
      description: 'The Weeknd brings his apocalyptic stadium stage production featuring hits Blinding Lights, Starboy, Die For You, and Save Your Tears.',
      castNames: [
        { name: 'The Weeknd', role: 'Lead Vocals & Headliner' },
      ],
    },
  },
  {
    title: 'Ed Sheeran — +–=÷× Mathematics Stadium Tour',
    type: 'concert',
    tmdbQuery: 'Ed Sheeran: Jumpers for Goalposts',
    fallbackQuery: 'Ed Sheeran',
    language: 'Live Concert Audio in Dolby Atmos 360°',
    venueKeyword: 'Jio World',
    customDetails: {
      director: 'Ed Sheeran',
      tagline: 'The record-breaking in-the-round stadium experience.',
      description: 'Ed Sheeran performs on a 360-degree rotating center stage with iconic loop pedals, performing Shape of You, Perfect, Bad Habits, and Castle on the Hill.',
      castNames: [
        { name: 'Ed Sheeran', role: 'Lead Vocals & Acoustic Guitar' },
      ],
    },
  },
  {
    title: 'Taylor Swift — The Eras Tour Live Stadium Concert',
    type: 'concert',
    tmdbQuery: 'Taylor Swift: The Eras Tour',
    fallbackQuery: 'Taylor Swift',
    language: 'Live Concert Audio in Dolby Atmos 360°',
    venueKeyword: 'Royal Opera House',
    customDetails: {
      director: 'Sam Wrench',
      tagline: 'A monumental journey through 17 years of music.',
      description: 'Taylor Swift performs the highest-grossing stadium tour in music history spanning 10 musical eras with 44 anthems and 360-degree stage visuals.',
      castNames: [
        { name: 'Taylor Swift', role: 'Lead Vocals & Piano' },
      ],
    },
  },
];

async function seedDatabaseWithLiveTMDB() {
  console.log('🏛️ SEEDING FULLY PACKED THEATRES & CONCERT AUDITORIUMS...');

  await sequelize.sync({ alter: true });
  console.log('✅ Database schema synchronized.');

  const organiser = await User.findOne({ where: { role: 'organiser' } }) || await User.findOne();
  if (!organiser) {
    console.error('❌ No user found.');
    return;
  }

  // 1. Clean up old venues, seats, and obsolete records
  const oldVenues = await Venue.findAll();
  for (const v of oldVenues) {
    const seats = await Seat.findAll({ where: { venueId: v.id } });
    for (const s of seats) {
      await SeatStatus.destroy({ where: { seatId: s.id } }).catch(() => {});
    }
    await Seat.destroy({ where: { venueId: v.id } }).catch(() => {});
    await SeatCategory.destroy({ where: { venueId: v.id } }).catch(() => {});
    await Showtime.destroy({ where: { venueId: v.id } }).catch(() => {});
    await Venue.destroy({ where: { id: v.id } }).catch(() => {});
  }
  console.log(`🧹 Cleaned up ${oldVenues.length} old venues.`);

  // 2. Create Venues with Fully Packed Rows and Classic in front, VIP Recliners in back
  const createdVenues = [];
  for (const vData of CINEMA_VENUES) {
    const venue = await Venue.create({
      name: vData.name,
      address: vData.address,
      totalRows: vData.totalRows,
      totalCols: vData.totalCols,
    });

    const categories = [];
    for (const catData of vData.categories) {
      const cat = await SeatCategory.create({
        venueId: venue.id,
        name: catData.name,
        color: catData.color,
        rowStart: catData.rowStart,
        rowEnd: catData.rowEnd,
      });
      categories.push({ ...catData, id: cat.id });
    }

    // Auto-generate seats
    const seats = [];
    for (let r = 1; r <= vData.totalRows; r++) {
      const rowLetter = String.fromCharCode(64 + r);
      const cat = categories.find((c) => r >= c.rowStart && r <= c.rowEnd) || categories[0];
      for (let c = 1; c <= vData.totalCols; c++) {
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

    createdVenues.push({
      venue,
      categories,
    });
    console.log(`✅ Created Venue: ${venue.name} (${seats.length} seats fully packed)`);
  }

  // 3. Fetch Real-Time Data from TMDB for each Movie & Concert
  const today = new Date();

  for (let i = 0; i < MOVIES_AND_CONCERTS.length; i++) {
    const item = MOVIES_AND_CONCERTS[i];

    const matchedVenueObj = createdVenues.find((v) =>
      v.venue.name.toLowerCase().includes(item.venueKeyword.toLowerCase())
    ) || createdVenues[i % createdVenues.length];

    const venue = matchedVenueObj.venue;
    const venueCategories = matchedVenueObj.categories;

    const pricingMap = {};
    venueCategories.forEach((cat) => {
      pricingMap[cat.id] = cat.price;
    });

    console.log(`\n🔍 Fetching live TMDB data for "${item.title}"...`);

    let enriched = null;
    try {
      enriched = await findAndEnrichMovie(item.tmdbQuery);
      if (!enriched && item.fallbackQuery) {
        enriched = await findAndEnrichMovie(item.fallbackQuery);
      }
    } catch (e) {
      console.warn(`TMDB fetch error for ${item.title}:`, e.message);
    }

    // Resolve cast with official TMDB photo avatars
    let finalCast = [];
    if (item.customDetails?.castNames) {
      for (const c of item.customDetails.castNames) {
        const avatar = await fetchPersonAvatar(c.name);
        finalCast.push({
          name: c.name,
          role: c.role,
          avatarUrl: avatar || 'https://image.tmdb.org/t/p/w185/bBRlrpJm9Xk94g4QA6P35xSsmZz.jpg',
        });
      }
    } else if (enriched?.cast && enriched.cast.length > 0) {
      finalCast = enriched.cast;
    }

    const eventData = {
      organiserId: organiser.id,
      venueId: venue.id,
      title: item.title,
      description: item.customDetails?.description || enriched?.description || 'Experience this blockbuster in premium cinema sound and visuals.',
      type: item.type,
      imageUrl: enriched?.imageUrl || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=780&q=80',
      backdropUrl: enriched?.backdropUrl || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1600&q=80',
      trailerUrl: enriched?.trailerUrl || 'https://www.youtube.com/watch?v=cqGjhVJWtEg',
      director: item.customDetails?.director || enriched?.director || 'Renowned Filmmaker',
      duration: enriched?.duration || '2h 25m',
      genre: enriched?.genre || 'Action • Adventure',
      imdbRating: enriched?.imdbRating || '8.5',
      rating: enriched?.rating || 'UA 13+',
      ageRating: enriched?.ageRating || 'UA 13+',
      releaseDate: enriched?.releaseDate || '2026',
      language: item.language,
      tagline: item.customDetails?.tagline || enriched?.tagline || 'Experience it in theatres.',
      cast: finalCast,
      reviews: enriched?.reviews || [],
      similarMovies: enriched?.similarMovies || [],
    };

    let [event, created] = await Event.findOrCreate({
      where: { title: item.title },
      defaults: eventData,
    });

    if (!created) {
      await event.update(eventData);
    }
    console.log(`🎬 Event Ready: ${event.title} (${finalCast.length} cast members with TMDB avatars)`);

    // Schedule 7-day rich showtimes across multiple auditoriums
    const showtimeSlots = [
      { dayOffset: 0, hour: 13, min: 0, format: '4K LASER', lang: 'ENGLISH', screen: 'AUDITORIUM 1' },
      { dayOffset: 0, hour: 17, min: 30, format: 'IMAX 70MM', lang: 'ENGLISH', screen: 'IMAX LASER 1' },
      { dayOffset: 0, hour: 21, min: 15, format: 'DOLBY ATMOS', lang: 'HINDI', screen: 'AUDITORIUM 2' },
      { dayOffset: 1, hour: 14, min: 30, format: 'DOLBY 3D', lang: 'HINDI', screen: 'AUDITORIUM 3' },
      { dayOffset: 1, hour: 18, min: 45, format: 'IMAX 70MM', lang: 'ENGLISH', screen: 'IMAX LASER 1' },
      { dayOffset: 1, hour: 22, min: 0, format: '4K LASER', lang: 'TELUGU', screen: 'AUDITORIUM 4' },
      { dayOffset: 2, hour: 15, min: 15, format: 'DOLBY ATMOS', lang: 'ENGLISH', screen: 'AUDITORIUM 2' },
      { dayOffset: 2, hour: 20, min: 0, format: 'IMAX 70MM', lang: 'ENGLISH', screen: 'IMAX LASER 1' },
      { dayOffset: 3, hour: 18, min: 0, format: 'DOLBY ATMOS', lang: 'HINDI', screen: 'AUDITORIUM 1' },
      { dayOffset: 4, hour: 19, min: 30, format: 'IMAX 70MM', lang: 'ENGLISH', screen: 'IMAX LASER 1' },
      { dayOffset: 5, hour: 20, min: 15, format: 'DOLBY 3D', lang: 'ENGLISH', screen: 'AUDITORIUM 2' },
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
          pricing: pricingMap,
          format: slot.format,
          language: slot.lang,
          screen: slot.screen,
        },
      });

      if (!stCreated) {
        await st.update({ pricing: pricingMap, format: slot.format, language: slot.lang, screen: slot.screen });
      }

      const existingCount = await SeatStatus.count({ where: { showtimeId: st.id } });
      if (existingCount === 0 && seats.length > 0) {
        const seatStatuses = seats.map((s) => ({
          showtimeId: st.id,
          seatId: s.id,
          status: 'available',
        }));
        await SeatStatus.bulkCreate(seatStatuses);
      }
    }
  }

  console.log('\n🎉 ALL CINEMA THEATRES & CONCERT AUDITORIUMS ARE FULLY PACKED & SYNCHRONIZED!');
}

seedDatabaseWithLiveTMDB()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Error during seeding:', err);
    process.exit(1);
  });
