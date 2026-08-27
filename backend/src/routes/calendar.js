const express = require("express");
const { Booking, Showtime, Event, Venue, Seat, BookingItem, User } = require("../models");
const { generateIcsContent, generateGoogleCalendarUrl } = require("../services/calendar");
const jwt = require("jsonwebtoken");

const router = express.Router();

/**
 * GET /api/calendar/feed/:bookingRef.ics
 * Live RFC 5545 iCalendar feed for a single booking
 */
router.get("/feed/:bookingRef.ics", async (req, res, next) => {
  try {
    const rawRef = req.params.bookingRef.replace(/\.ics$/i, "").trim().toUpperCase();
    const booking = await Booking.findOne({
      where: { bookingRef: rawRef },
      include: [
        {
          model: Showtime,
          as: "showtime",
          include: [
            {
              model: Event,
              as: "event",
              include: [{ model: Venue, as: "venue" }],
            },
          ],
        },
        {
          model: BookingItem,
          as: "items",
          include: [{ model: Seat, as: "seat" }],
        },
      ],
    });

    if (!booking) {
      return res.status(404).send("Booking not found");
    }

    const eventTitle = booking.showtime?.event?.title || "Movie Screening";
    const venueName = booking.showtime?.event?.venue?.name || "Auditorium";
    const venueAddress = booking.showtime?.event?.venue?.address || "";
    const startDateTime = booking.showtime?.dateTime;
    const seatLabels = (booking.items || []).map(i => i.seat?.label || i.seatId).filter(Boolean);

    const icsString = generateIcsContent({
      bookingRef: booking.bookingRef,
      eventTitle,
      venueName,
      venueAddress,
      startDateTime,
      seatLabels,
      status: booking.status === "cancelled" ? "CANCELLED" : "CONFIRMED",
    });

    res.setHeader("Content-Type", "text/calendar; charset=utf-8");
    res.setHeader("Content-Disposition", `inline; filename="${booking.bookingRef}.ics"`);
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.send(icsString);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/calendar/google/:bookingRef
 * Generate and redirect to Google Calendar event creation URL
 */
router.get("/google/:bookingRef", async (req, res, next) => {
  try {
    const rawRef = req.params.bookingRef.trim().toUpperCase();
    const booking = await Booking.findOne({
      where: { bookingRef: rawRef },
      include: [
        {
          model: Showtime,
          as: "showtime",
          include: [
            {
              model: Event,
              as: "event",
              include: [{ model: Venue, as: "venue" }],
            },
          ],
        },
        {
          model: BookingItem,
          as: "items",
          include: [{ model: Seat, as: "seat" }],
        },
      ],
    });

    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    const eventTitle = booking.showtime?.event?.title || "Movie Screening";
    const venueName = booking.showtime?.event?.venue?.name || "Auditorium";
    const venueAddress = booking.showtime?.event?.venue?.address || "";
    const startDateTime = booking.showtime?.dateTime;
    const seatLabels = (booking.items || []).map(i => i.seat?.label || i.seatId).filter(Boolean);

    const googleUrl = generateGoogleCalendarUrl({
      bookingRef: booking.bookingRef,
      eventTitle,
      venueName,
      venueAddress,
      startDateTime,
      seatLabels,
    });

    if (req.query.redirect === "true") {
      return res.redirect(googleUrl);
    }

    res.json({ googleUrl });
  } catch (error) {
    next(error);
  }
});

module.exports = router;