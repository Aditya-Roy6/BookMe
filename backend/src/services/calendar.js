/**
 * Format Date to RFC 5545 UTC timestamp: YYYYMMDDTHHMMSSZ
 */
function formatIcsDate(date) {
  const d = new Date(date);
  return d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

/**
 * Generate standard RFC 5545 iCalendar (.ics) string for a booking
 */
function generateIcsContent({
  bookingRef,
  eventTitle = "Movie Screening",
  venueName = "Auditorium",
  venueAddress = "",
  startDateTime,
  endDateTime,
  seatLabels = [],
  sequence = 0,
  method = "REQUEST",
  status = "CONFIRMED",
  url,
}) {
  const startObj = startDateTime ? new Date(startDateTime) : new Date();
  const endObj = endDateTime
    ? new Date(endDateTime)
    : new Date(startObj.getTime() + 2.5 * 60 * 60 * 1000);

  const dtStart = formatIcsDate(startObj);
  const dtEnd = formatIcsDate(endObj);
  const dtStamp = formatIcsDate(new Date());
  const uid = "booking-" + bookingRef + "@bookme.com";

  const seatsStr = seatLabels && seatLabels.length > 0 ? seatLabels.join(", ") : "Reserved Seats";
  const locationStr = [venueName, venueAddress].filter(Boolean).join(", ").replace(/,/g, "\\,");
  const passUrl = url || ("https://bookme-jet.vercel.app/my-bookings?ref=" + bookingRef);
  const cleanTitle = (eventTitle || "Event").replace(/,/g, "\\,");

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//BooKMe Ticketing Platform//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:" + method,
    "X-WR-CALNAME:BooKMe Tickets",
    "X-WR-TIMEZONE:UTC",
    "BEGIN:VEVENT",
    "UID:" + uid,
    "SEQUENCE:" + sequence,
    "DTSTAMP:" + dtStamp,
    "DTSTART:" + dtStart,
    "DTEND:" + dtEnd,
    "SUMMARY:🎟️ " + cleanTitle + " (" + bookingRef + ")",
    "DESCRIPTION:Booking Reference: " + bookingRef + "\\nSeats: " + seatsStr + "\\nVenue: " + venueName + "\\nView Pass: " + passUrl,
    "LOCATION:" + locationStr,
    "STATUS:" + status,
    "URL:" + passUrl,
    "BEGIN:VALARM",
    "TRIGGER:-PT2H",
    "ACTION:DISPLAY",
    "DESCRIPTION:Reminder: " + cleanTitle + " starts in 2 hours!",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  return lines.join("\r\n");
}

/**
 * Generate Google Calendar Web URL for 1-click addition
 */
function generateGoogleCalendarUrl({
  bookingRef,
  eventTitle = "Movie Screening",
  venueName = "Auditorium",
  venueAddress = "",
  startDateTime,
  endDateTime,
  seatLabels = [],
  url,
}) {
  const startObj = startDateTime ? new Date(startDateTime) : new Date();
  const endObj = endDateTime
    ? new Date(endDateTime)
    : new Date(startObj.getTime() + 2.5 * 60 * 60 * 1000);

  const startUtc = formatIcsDate(startObj);
  const endUtc = formatIcsDate(endObj);
  const dates = startUtc + "/" + endUtc;

  const seatsStr = seatLabels && seatLabels.length > 0 ? seatLabels.join(", ") : "Reserved Seats";
  const location = [venueName, venueAddress].filter(Boolean).join(", ");
  const passUrl = url || ("https://bookme-jet.vercel.app/my-bookings?ref=" + bookingRef);
  const details = "🎟️ BooKMe Official Ticket Pass\nBooking Reference: " + bookingRef + "\nSeats: " + seatsStr + "\nVenue: " + venueName + "\n\nView & Download Pass: " + passUrl;

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: "🎟️ " + eventTitle + " (" + bookingRef + ")",
    dates,
    details,
    location,
  });

  return "https://calendar.google.com/calendar/render?" + params.toString();
}

module.exports = {
  formatIcsDate,
  generateIcsContent,
  generateGoogleCalendarUrl,
};
