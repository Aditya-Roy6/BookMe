require('dotenv').config();
const {
  sequelize,
  User,
  Venue,
  SeatCategory,
  Event,
  Showtime,
  Seat,
  SeatStatus,
  Booking,
  BookingItem,
  Waitlist,
} = require('./models');
const { generateBookingQRCode } = require('./services/qrcode');

async function seed() {
  try {
    console.log('🌱 Connected to database. Syncing tables with updated schema...');
    await sequelize.sync({ force: true });

    console.log('👤 Creating admin, organiser, and customer demo accounts...');
    const admin = await User.create({
      name: 'System Admin',
      email: 'admin@luminatix.com',
      password: 'password123',
      role: 'admin',
      isVerified: true,
    });

    const organiser = await User.create({
      name: 'Neon Horizon Productions',
      email: 'organiser@luminatix.com',
      password: 'password123',
      role: 'organiser',
      isVerified: true,
    });

    const customers = await User.bulkCreate([
      { name: 'Alex Rivers', email: 'customer@luminatix.com', password: 'password123', role: 'customer', isVerified: true },
      { name: 'Sophia Chen', email: 'sophia.chen@gmail.com', password: 'password123', role: 'customer', isVerified: true },
      { name: 'Marcus Vance', email: 'm.vance@techcorp.io', password: 'password123', role: 'customer', isVerified: true },
      { name: 'Elena Rostova', email: 'elena.rostova@outlook.com', password: 'password123', role: 'customer', isVerified: true },
      { name: 'David Kim', email: 'david.kim99@yahoo.com', password: 'password123', role: 'customer', isVerified: true },
      { name: 'Sarah Jenkins', email: 'sarah.j@creative.co', password: 'password123', role: 'customer', isVerified: true },
      { name: 'Lucas Silva', email: 'lucas.silva@musicfan.net', password: 'password123', role: 'customer', isVerified: true },
      { name: 'Emma Watson', email: 'emma.w@cinema.uk', password: 'password123', role: 'customer', isVerified: true },
      { name: 'Liam Johnson', email: 'liam.j@acoustics.com', password: 'password123', role: 'customer', isVerified: true },
      { name: 'Maya Patel', email: 'maya.patel@designstudio.org', password: 'password123', role: 'customer', isVerified: true },
      { name: 'Oliver Twist', email: 'oliver.t@theatrics.com', password: 'password123', role: 'customer', isVerified: true },
      { name: 'Isabella Garcia', email: 'isabella.g@hollywood.com', password: 'password123', role: 'customer', isVerified: true },
      { name: 'Noah Miller', email: 'noah.miller@imaxfans.org', password: 'password123', role: 'customer', isVerified: true },
      { name: 'Mia Davis', email: 'mia.davis@soundtracks.io', password: 'password123', role: 'customer', isVerified: true },
      { name: 'Ethan Wilson', email: 'ethan.w@concertgoers.com', password: 'password123', role: 'customer', isVerified: true },
      { name: 'Ava Taylor', email: 'ava.taylor@dolbycinema.net', password: 'password123', role: 'customer', isVerified: true },
      { name: 'James Anderson', email: 'james.a@tickets.dev', password: 'password123', role: 'customer', isVerified: true },
      { name: 'Charlotte Thomas', email: 'charlotte.t@broadway.org', password: 'password123', role: 'customer', isVerified: true },
      { name: 'Benjamin Jackson', email: 'ben.jackson@filmfest.com', password: 'password123', role: 'customer', isVerified: true },
      { name: 'Amelia White', email: 'amelia.white@vipcinema.com', password: 'password123', role: 'customer', isVerified: true },
    ], { individualHooks: true });

    console.log('🏛️ Creating multi-location venues and seating maps...');

    // ─── Venue 1: PVR Palazzo — The Nexus Vijaya Mall (8 rows x 14 cols = 112 seats) ───
    const venuePalazzo = await Venue.create({
      name: 'PVR Palazzo — The Nexus Vijaya Mall',
      address: '3rd Floor, 183 Arcot Road, Vadapalani • 2.4 km away',
      totalRows: 8,
      totalCols: 14,
    });

    const catPalazzoClassic = await SeatCategory.create({
      venueId: venuePalazzo.id,
      name: 'Classic Seats',
      color: '#38bdf8',
      rowStart: 1,
      rowEnd: 3,
    });

    const catPalazzoPrime = await SeatCategory.create({
      venueId: venuePalazzo.id,
      name: 'Prime Club',
      color: '#818cf8',
      rowStart: 4,
      rowEnd: 6,
    });

    const catPalazzoVIP = await SeatCategory.create({
      venueId: venuePalazzo.id,
      name: 'VIP Recliner Lounges',
      color: '#f59e0b',
      rowStart: 7,
      rowEnd: 8,
    });

    const seatsPalazzo = [];
    for (let r = 1; r <= venuePalazzo.totalRows; r++) {
      let catId = catPalazzoClassic.id;
      if (r >= 7) catId = catPalazzoVIP.id;
      else if (r >= 4) catId = catPalazzoPrime.id;

      const rowChar = String.fromCharCode(64 + r);
      for (let c = 1; c <= venuePalazzo.totalCols; c++) {
        seatsPalazzo.push({
          venueId: venuePalazzo.id,
          categoryId: catId,
          row: r,
          col: c,
          label: `${rowChar}${c}`,
        });
      }
    }
    const createdSeatsPalazzo = await Seat.bulkCreate(seatsPalazzo);

    // ─── Venue 2: PVR VR Chennai — Anna Nagar (8 rows x 14 cols = 112 seats) ───
    const venueVR = await Venue.create({
      name: 'PVR VR Chennai — Anna Nagar',
      address: '3rd Floor, VR Mall, MetroZone, No 44 • 4.8 km away',
      totalRows: 8,
      totalCols: 14,
    });

    const catVRClassic = await SeatCategory.create({
      venueId: venueVR.id,
      name: 'Classic Seats',
      color: '#38bdf8',
      rowStart: 1,
      rowEnd: 3,
    });

    const catVRPrime = await SeatCategory.create({
      venueId: venueVR.id,
      name: 'Prime Club',
      color: '#818cf8',
      rowStart: 4,
      rowEnd: 6,
    });

    const catVRVIP = await SeatCategory.create({
      venueId: venueVR.id,
      name: 'VIP Recliner Lounges',
      color: '#f59e0b',
      rowStart: 7,
      rowEnd: 8,
    });

    const seatsVR = [];
    for (let r = 1; r <= venueVR.totalRows; r++) {
      let catId = catVRClassic.id;
      if (r >= 7) catId = catVRVIP.id;
      else if (r >= 4) catId = catVRPrime.id;

      const rowChar = String.fromCharCode(64 + r);
      for (let c = 1; c <= venueVR.totalCols; c++) {
        seatsVR.push({
          venueId: venueVR.id,
          categoryId: catId,
          row: r,
          col: c,
          label: `${rowChar}${c}`,
        });
      }
    }
    const createdSeatsVR = await Seat.bulkCreate(seatsVR);

    // ─── Venue 3: CineMax IMAX & Dolby Cinema (8 rows x 14 cols = 112 seats) ───
    const venueCinema = await Venue.create({
      name: 'CineMax IMAX & Dolby Cinema',
      address: '221B Baker Street, Entertainment Plaza • 1.2 km away',
      totalRows: 8,
      totalCols: 14,
    });

    const catCinemaClassic = await SeatCategory.create({
      venueId: venueCinema.id,
      name: 'Classic Seats',
      color: '#38bdf8',
      rowStart: 1,
      rowEnd: 3,
    });

    const catCinemaPrime = await SeatCategory.create({
      venueId: venueCinema.id,
      name: 'Prime Club',
      color: '#818cf8',
      rowStart: 4,
      rowEnd: 6,
    });

    const catCinemaVIP = await SeatCategory.create({
      venueId: venueCinema.id,
      name: 'VIP Recliner Lounges',
      color: '#f59e0b',
      rowStart: 7,
      rowEnd: 8,
    });

    const seatsCinema = [];
    for (let r = 1; r <= venueCinema.totalRows; r++) {
      let catId = catCinemaClassic.id;
      if (r >= 7) catId = catCinemaVIP.id;
      else if (r >= 4) catId = catCinemaPrime.id;

      const rowChar = String.fromCharCode(64 + r);
      for (let c = 1; c <= venueCinema.totalCols; c++) {
        seatsCinema.push({
          venueId: venueCinema.id,
          categoryId: catId,
          row: r,
          col: c,
          label: `${rowChar}${c}`,
        });
      }
    }
    const createdSeatsCinema = await Seat.bulkCreate(seatsCinema);

    // ─── Venue 4: Grand Symphony Arena (360° Circular Stadium) ───
    const venueArena = await Venue.create({
      name: 'Grand Symphony Arena',
      address: '742 Evergreen Terrace, Metropolis',
      totalRows: 7,
      totalCols: 72,
    });

    const catArenaFront = await SeatCategory.create({
      venueId: venueArena.id,
      name: 'Golden Circle (Pitch)',
      color: '#38bdf8',
      rowStart: 1,
      rowEnd: 2,
    });

    const catArenaTier1 = await SeatCategory.create({
      venueId: venueArena.id,
      name: 'Lower Bowl Club',
      color: '#818cf8',
      rowStart: 3,
      rowEnd: 5,
    });

    const catArenaVIP = await SeatCategory.create({
      venueId: venueArena.id,
      name: 'VIP Recliner Lounges',
      color: '#f59e0b',
      rowStart: 6,
      rowEnd: 7,
    });

    const seatsArena = [];
    for (let r = 1; r <= venueArena.totalRows; r++) {
      let catId = catArenaFront.id;
      if (r >= 6) catId = catArenaVIP.id;
      else if (r >= 3) catId = catArenaTier1.id;

      const rowChar = String.fromCharCode(64 + r);
      const seatsPerSector = 5 + r;
      const totalColsInRow = seatsPerSector * 6;

      for (let c = 1; c <= totalColsInRow; c++) {
        seatsArena.push({
          venueId: venueArena.id,
          categoryId: catId,
          row: r,
          col: c,
          label: `${rowChar}${c}`,
        });
      }
    }
    const createdSeatsArena = await Seat.bulkCreate(seatsArena);

    console.log('🎬 Seeding authentic blockbuster productions...');

    const now = new Date();
    const getDateAt = (daysOffset, hours, minutes = 0) => {
      const d = new Date(now);
      d.setDate(d.getDate() + daysOffset);
      d.setHours(hours, minutes, 0, 0);
      return d;
    };

    const allShowtimes = [];

    // Helper to create showtimes
    async function createMultiShowtimes(event, venueConfigs) {
      for (const config of venueConfigs) {
        const showtime = await Showtime.create({
          eventId: event.id,
          venueId: config.venue.id,
          dateTime: config.dateTime,
          language: config.language || 'ENGLISH',
          format: config.format || 'DOLBY ATMOS',
          screen: config.screen || 'AUDI 1',
          pricing: config.pricing,
        });

        const seats = config.seats;
        const seatStatuses = await SeatStatus.bulkCreate(
          seats.map((s) => ({
            showtimeId: showtime.id,
            seatId: s.id,
            status: 'available',
          }))
        );

        allShowtimes.push({
          showtime,
          venue: config.venue,
          seats,
          pricing: config.pricing,
          event,
        });
      }
    }

    // ─── 1. OPPENHEIMER ───
    const movieOppenheimer = await Event.create({
      organiserId: organiser.id,
      venueId: venuePalazzo.id,
      title: 'OPPENHEIMER: DOLBY CINEMA EXCLUSIVE',
      description: 'The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb, mixed in immersive 64-channel Dolby Atmos audio.',
      type: 'movie',
      rating: 'R',
      ageRating: 'A 18+ (Adults Only)',
      imdbRating: '8.9',
      language: 'English, Hindi • Dolby Atmos 7.1',
      duration: '3h 00m',
      genre: 'Biography • Drama • History',
      director: 'Christopher Nolan',
      releaseDate: 'In Theatres Now',
      imageUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=780&q=80',
      backdropUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1600&q=80',
      trailerUrl: 'https://www.youtube.com/watch?v=uYPbbksJxIg',
      cast: [
        { name: 'Cillian Murphy', role: 'J. Robert Oppenheimer', avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80' },
        { name: 'Emily Blunt', role: 'Katherine "Kitty" Oppenheimer', avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80' },
      ],
    });

    await createMultiShowtimes(movieOppenheimer, [
      { venue: venuePalazzo, dateTime: getDateAt(0, 14, 0), language: 'HINDI', format: 'DOLBY ATMOS', screen: 'AUDI 2', seats: createdSeatsPalazzo, pricing: { [catPalazzoClassic.id]: 22, [catPalazzoPrime.id]: 32, [catPalazzoVIP.id]: 48 } },
      { venue: venuePalazzo, dateTime: getDateAt(0, 22, 10), language: 'HINDI', format: 'DOLBY ATMOS', screen: 'AUDI 2', seats: createdSeatsPalazzo, pricing: { [catPalazzoClassic.id]: 22, [catPalazzoPrime.id]: 32, [catPalazzoVIP.id]: 48 } },
      { venue: venueCinema, dateTime: getDateAt(0, 18, 15), language: 'ENGLISH', format: 'IMAX 70MM', screen: 'IMAX AUDI 1', seats: createdSeatsCinema, pricing: { [catCinemaClassic.id]: 28, [catCinemaPrime.id]: 38, [catCinemaVIP.id]: 55 } },
    ]);

    // ─── 2. SPIDER-MAN: BRAND NEW DAY ───
    const movieSpider = await Event.create({
      organiserId: organiser.id,
      venueId: venuePalazzo.id,
      title: 'SPIDER-MAN: BRAND NEW DAY',
      description: 'Fighting crime full-time as Spider-Man in a world that doesn\'t remember him sparks an extraordinary turning point in Peter Parker\'s life.',
      type: 'movie',
      rating: 'UA 13+',
      ageRating: 'UA 13+ (Ages 13+)',
      imdbRating: '8.4',
      language: 'English, Hindi, Tamil (IMAX 3D)',
      duration: '2h 25m',
      genre: 'Action • Adventure • Sci-Fi',
      director: 'Destin Daniel Cretton',
      releaseDate: 'Thursday, Jul 30, 2026',
      imageUrl: 'https://images.unsplash.com/photo-1635805737707-575885ab0820?auto=format&fit=crop&w=780&q=80',
      backdropUrl: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=1600&q=80',
      trailerUrl: 'https://www.youtube.com/watch?v=JfVOs4VSpmA',
      cast: [
        { name: 'Tom Holland', role: 'Peter Parker / Spider-Man', avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80' },
        { name: 'Zendaya', role: 'Michelle Jones (MJ)', avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80' },
      ],
    });

    await createMultiShowtimes(movieSpider, [
      { venue: venuePalazzo, dateTime: getDateAt(0, 10, 10), language: 'HINDI', format: 'DOLBY ATMOS', screen: 'AUDI 1', seats: createdSeatsPalazzo, pricing: { [catPalazzoClassic.id]: 22, [catPalazzoPrime.id]: 32, [catPalazzoVIP.id]: 48 } },
      { venue: venueVR, dateTime: getDateAt(0, 16, 0), language: 'HINDI', format: '4K 3D', screen: 'AUDI 3', seats: createdSeatsVR, pricing: { [catVRClassic.id]: 20, [catVRPrime.id]: 30, [catVRVIP.id]: 45 } },
      { venue: venueCinema, dateTime: getDateAt(0, 19, 0), language: 'ENGLISH', format: 'IMAX 3D', screen: 'IMAX 1', seats: createdSeatsCinema, pricing: { [catCinemaClassic.id]: 28, [catCinemaPrime.id]: 38, [catCinemaVIP.id]: 55 } },
    ]);

    // ─── 3. DUNE: PART TWO ───
    const movieDune = await Event.create({
      organiserId: organiser.id,
      venueId: venueCinema.id,
      title: 'DUNE: PART TWO — IMAX 70MM EXPERIENCE',
      description: 'Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family in glorious 70mm IMAX format.',
      type: 'movie',
      rating: 'UA 16+',
      ageRating: 'UA 16+ (Ages 16+)',
      imdbRating: '8.6',
      language: 'English (IMAX Laser)',
      duration: '2h 46m',
      genre: 'Sci-Fi • Epic • Adventure',
      director: 'Denis Villeneuve',
      releaseDate: 'Friday, Aug 15, 2026',
      imageUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=780&q=80',
      backdropUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1600&q=80',
      trailerUrl: 'https://www.youtube.com/watch?v=Way9Dexny3w',
      cast: [
        { name: 'Timothée Chalamet', role: 'Paul Atreides', avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=300&q=80' },
      ],
    });

    await createMultiShowtimes(movieDune, [
      { venue: venueCinema, dateTime: getDateAt(0, 15, 0), language: 'ENGLISH', format: 'IMAX 70MM', screen: 'IMAX 1', seats: createdSeatsCinema, pricing: { [catCinemaClassic.id]: 28, [catCinemaPrime.id]: 38, [catCinemaVIP.id]: 55 } },
      { venue: venuePalazzo, dateTime: getDateAt(0, 18, 0), language: 'ENGLISH', format: 'DOLBY ATMOS', screen: 'AUDI 4', seats: createdSeatsPalazzo, pricing: { [catPalazzoClassic.id]: 24, [catPalazzoPrime.id]: 34, [catPalazzoVIP.id]: 50 } },
    ]);

    // ─── 4. DEADPOOL & WOLVERINE ───
    const movieDeadpool = await Event.create({
      organiserId: organiser.id,
      venueId: venuePalazzo.id,
      title: 'DEADPOOL & WOLVERINE: 3D LASER',
      description: 'Wolverine is recovering from his injuries when he crosses paths with the loudmouth Deadpool. They team up to defeat a common enemy.',
      type: 'movie',
      rating: 'R',
      ageRating: 'A 18+ (Adults Only)',
      imdbRating: '8.0',
      language: 'English • 3D 4K Laser',
      duration: '2h 08m',
      genre: 'Action • Comedy • Sci-Fi',
      director: 'Shawn Levy',
      releaseDate: 'In Theatres Now',
      imageUrl: 'https://images.unsplash.com/photo-1608889825103-eb5ed706fc64?auto=format&fit=crop&w=780&q=80',
      backdropUrl: 'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=1600&q=80',
      trailerUrl: 'https://www.youtube.com/watch?v=73_1biulkYk',
      cast: [
        { name: 'Ryan Reynolds', role: 'Wade Wilson / Deadpool', avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80' },
      ],
    });

    await createMultiShowtimes(movieDeadpool, [
      { venue: venuePalazzo, dateTime: getDateAt(0, 17, 0), language: 'ENGLISH', format: '3D 4K', screen: 'AUDI 3', seats: createdSeatsPalazzo, pricing: { [catPalazzoClassic.id]: 22, [catPalazzoPrime.id]: 32, [catPalazzoVIP.id]: 48 } },
      { venue: venueVR, dateTime: getDateAt(0, 22, 0), language: 'ENGLISH', format: '3D 4K', screen: 'AUDI 1', seats: createdSeatsVR, pricing: { [catVRClassic.id]: 20, [catVRPrime.id]: 30, [catVRVIP.id]: 45 } },
    ]);

    // ─── 5. COLDPLAY ───
    const concertColdplay = await Event.create({
      organiserId: organiser.id,
      venueId: venueArena.id,
      title: 'Coldplay — Music of the Spheres 360° World Tour',
      description: 'The record-breaking stadium spectacle with kinetic dancefloors, synced LED wristbands, and 360° in-the-round center stage audio.',
      type: 'concert',
      rating: 'All Ages',
      ageRating: 'U / All Ages',
      imdbRating: '9.4',
      language: 'English (Live 360° Surround)',
      duration: '2h 15m',
      genre: 'Pop Rock • Electronic • Alternative',
      director: 'Paul Dugdale',
      releaseDate: 'Sunday, Aug 30, 2026',
      imageUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80',
      backdropUrl: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1600&q=80',
      trailerUrl: 'https://www.youtube.com/watch?v=F3tJ8X5hS3E',
      cast: [
        { name: 'Chris Martin', role: 'Lead Vocals & Piano', avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80' },
      ],
    });

    await createMultiShowtimes(concertColdplay, [
      { venue: venueArena, dateTime: getDateAt(1, 20, 0), language: 'ENGLISH', format: '360° IN-THE-ROUND', screen: 'MAIN ARENA', seats: createdSeatsArena, pricing: { [catArenaFront.id]: 95, [catArenaTier1.id]: 140, [catArenaVIP.id]: 220 } },
    ]);

    console.log('🎟️ Generating 120+ authentic customer booking transactions across 7 days...');

    // ─── MASS BOOKING SEEDER (120+ Real Bookings) ───
    let bookingCounter = 1000;
    const bookedSeatIds = new Set();

    for (let dayOffset = 6; dayOffset >= 0; dayOffset--) {
      // Transactions per day (increasing towards today)
      const transactionsToday = 14 + (6 - dayOffset) * 4; // 14, 18, 22, 26, 30...

      for (let t = 0; t < transactionsToday; t++) {
        bookingCounter++;
        const customer = customers[t % customers.length];
        const stObj = allShowtimes[bookingCounter % allShowtimes.length];
        const { showtime, seats, pricing } = stObj;

        // Select 1 to 3 available seats
        const availableSeats = seats.filter((s) => !bookedSeatIds.has(`${showtime.id}:${s.id}`));
        if (availableSeats.length === 0) continue;

        const numSeats = Math.min(1 + (t % 3), availableSeats.length);
        const chosenSeats = availableSeats.slice(0, numSeats);

        // Mark as booked
        chosenSeats.forEach((s) => bookedSeatIds.add(`${showtime.id}:${s.id}`));

        let totalAmount = 0;
        const itemRows = chosenSeats.map((s) => {
          const price = Number(pricing[s.categoryId] || 25);
          totalAmount += price;
          return {
            seatId: s.id,
            price,
          };
        });

        const bookingRef = `LTX-${bookingCounter}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
        const qrCodeUrl = await generateBookingQRCode(bookingRef, {
          title: stObj.event.title,
          customerName: customer.name,
        });

        // Set creation timestamp in past days
        const txDate = new Date(now);
        txDate.setDate(txDate.getDate() - dayOffset);
        txDate.setHours(9 + (t % 14), (t * 7) % 60, (t * 13) % 60);

        const booking = await Booking.create(
          {
            customerId: customer.id,
            showtimeId: showtime.id,
            bookingRef,
            totalAmount,
            qrCodeUrl,
            status: 'confirmed',
            createdAt: txDate,
            updatedAt: txDate,
            created_at: txDate,
            updated_at: txDate,
          },
          { silent: true, timestamps: false }
        );

        for (const item of itemRows) {
          await BookingItem.create(
            {
              bookingId: booking.id,
              seatId: item.seatId,
              price: item.price,
              createdAt: txDate,
              updatedAt: txDate,
              created_at: txDate,
              updated_at: txDate,
            },
            { silent: true, timestamps: false }
          );
        }

        // Update SeatStatus to 'booked'
        await SeatStatus.update(
          { status: 'booked' },
          {
            where: {
              showtimeId: showtime.id,
              seatId: chosenSeats.map((s) => s.id),
            },
          }
        );
      }
    }

    console.log(`✅ Seeded ${bookingCounter - 1000} verified bookings across all showtimes!`);
    console.log('✅ Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seed();
