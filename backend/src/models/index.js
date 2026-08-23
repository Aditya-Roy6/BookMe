const sequelize = require('../config/database');
const User = require('./User');
const Venue = require('./Venue');
const SeatCategory = require('./SeatCategory');
const Event = require('./Event');
const Showtime = require('./Showtime');
const Seat = require('./Seat');
const SeatStatus = require('./SeatStatus');
const Booking = require('./Booking');
const BookingItem = require('./BookingItem');
const Waitlist = require('./Waitlist');

// Venue -> SeatCategory (one-to-many)
Venue.hasMany(SeatCategory, { foreignKey: 'venueId', as: 'categories' });
SeatCategory.belongsTo(Venue, { foreignKey: 'venueId' });

// Venue -> Seat (one-to-many)
Venue.hasMany(Seat, { foreignKey: 'venueId', as: 'seats' });
Seat.belongsTo(Venue, { foreignKey: 'venueId' });

// SeatCategory -> Seat (one-to-many)
SeatCategory.hasMany(Seat, { foreignKey: 'categoryId', as: 'seats' });
Seat.belongsTo(SeatCategory, { foreignKey: 'categoryId', as: 'category' });

// User (organiser) -> Event (one-to-many)
User.hasMany(Event, { foreignKey: 'organiserId', as: 'events' });
Event.belongsTo(User, { foreignKey: 'organiserId', as: 'organiser' });

// Venue -> Event (one-to-many)
Venue.hasMany(Event, { foreignKey: 'venueId', as: 'events' });
Event.belongsTo(Venue, { foreignKey: 'venueId', as: 'venue' });

// Event -> Showtime (one-to-many)
Event.hasMany(Showtime, { foreignKey: 'eventId', as: 'showtimes' });
Showtime.belongsTo(Event, { foreignKey: 'eventId', as: 'event' });

// Venue -> Showtime (one-to-many)
Venue.hasMany(Showtime, { foreignKey: 'venueId', as: 'showtimes' });
Showtime.belongsTo(Venue, { foreignKey: 'venueId', as: 'venue' });

// Showtime -> SeatStatus (one-to-many)
Showtime.hasMany(SeatStatus, { foreignKey: 'showtimeId', as: 'seatStatuses' });
SeatStatus.belongsTo(Showtime, { foreignKey: 'showtimeId' });

// Seat -> SeatStatus (one-to-many)
Seat.hasMany(SeatStatus, { foreignKey: 'seatId', as: 'statuses' });
SeatStatus.belongsTo(Seat, { foreignKey: 'seatId', as: 'seat' });

// User (customer) -> Booking (one-to-many)
User.hasMany(Booking, { foreignKey: 'customerId', as: 'bookings' });
Booking.belongsTo(User, { foreignKey: 'customerId', as: 'customer' });

// Showtime -> Booking (one-to-many)
Showtime.hasMany(Booking, { foreignKey: 'showtimeId', as: 'bookings' });
Booking.belongsTo(Showtime, { foreignKey: 'showtimeId', as: 'showtime' });

// Booking -> BookingItem (one-to-many)
Booking.hasMany(BookingItem, { foreignKey: 'bookingId', as: 'items' });
BookingItem.belongsTo(Booking, { foreignKey: 'bookingId' });

// Seat -> BookingItem (one-to-many)
Seat.hasMany(BookingItem, { foreignKey: 'seatId' });
BookingItem.belongsTo(Seat, { foreignKey: 'seatId', as: 'seat' });

// User -> Waitlist (one-to-many)
User.hasMany(Waitlist, { foreignKey: 'customerId', as: 'waitlistEntries' });
Waitlist.belongsTo(User, { foreignKey: 'customerId', as: 'customer' });

// Showtime -> Waitlist (one-to-many)
Showtime.hasMany(Waitlist, { foreignKey: 'showtimeId', as: 'waitlist' });
Waitlist.belongsTo(Showtime, { foreignKey: 'showtimeId', as: 'showtime' });

// SeatCategory -> Waitlist (one-to-many)
SeatCategory.hasMany(Waitlist, { foreignKey: 'categoryId' });
Waitlist.belongsTo(SeatCategory, { foreignKey: 'categoryId', as: 'category' });

module.exports = {
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
};
