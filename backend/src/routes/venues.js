const express = require('express');
const { Venue, SeatCategory, Seat, SeatStatus } = require('../models');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

/**
 * POST /api/venues
 * Admin only: Create a new venue with grid dimensions
 */
router.post('/', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const { name, address, totalRows, totalCols, layoutType, layoutData } = req.body;

    if (!name || !totalRows || !totalCols) {
      return res.status(400).json({ error: 'Name, totalRows, and totalCols are required' });
    }

    const venue = await Venue.create({
      name,
      address,
      totalRows,
      totalCols,
      layoutType: layoutType || 'cinema',
      layoutData: layoutData || {},
    });
    res.status(201).json({ venue });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/venues/:id/categories
 * Admin only: Add seat categories to a venue
 * Body: { categories: [{ name, color, rowStart, rowEnd }] }
 */
router.post('/:id/categories', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const venue = await Venue.findByPk(req.params.id);
    if (!venue) {
      return res.status(404).json({ error: 'Venue not found' });
    }

    const { categories } = req.body;
    if (!categories || !Array.isArray(categories) || categories.length === 0) {
      return res.status(400).json({ error: 'Categories array is required' });
    }

    const created = await Promise.all(
      categories.map(cat =>
        SeatCategory.create({
          venueId: venue.id,
          name: cat.name,
          color: cat.color || '#007AFF',
          rowStart: cat.rowStart,
          rowEnd: cat.rowEnd,
        })
      )
    );

    res.status(201).json({ categories: created });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/venues/:id/generate-seats
 * Admin only: Auto-generate seats based on venue grid and categories
 * Creates a seat for each (row, col) position, assigns category based on row range
 */
router.post('/:id/generate-seats', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const venue = await Venue.findByPk(req.params.id, {
      include: [{ model: SeatCategory, as: 'categories' }],
    });
    if (!venue) {
      return res.status(404).json({ error: 'Venue not found' });
    }

    if (!venue.categories || venue.categories.length === 0) {
      return res.status(400).json({ error: 'Venue must have categories before generating seats' });
    }

    // Delete existing seats for this venue
    await Seat.destroy({ where: { venueId: venue.id } });

    const seats = [];
    for (let row = 1; row <= venue.totalRows; row++) {
      // Find which category this row belongs to
      const category = venue.categories.find(
        cat => row >= cat.rowStart && row <= cat.rowEnd
      );
      if (!category) continue;

      const rowLetter = String.fromCharCode(64 + row); // A, B, C...
      for (let col = 1; col <= venue.totalCols; col++) {
        seats.push({
          venueId: venue.id,
          categoryId: category.id,
          row,
          col,
          label: `${rowLetter}${col}`,
        });
      }
    }

    const createdSeats = await Seat.bulkCreate(seats);
    res.status(201).json({
      message: `Generated ${createdSeats.length} seats`,
      totalSeats: createdSeats.length,
    });
  } catch (error) {
    next(error);
  }
});

/**
/**
 * POST /api/venues/:id/seats/bulk
 * Admin only: Bulk insert seats
 */
router.post('/:id/seats/bulk', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const venue = await Venue.findByPk(req.params.id);
    if (!venue) {
      return res.status(404).json({ error: 'Venue not found' });
    }

    const { seats } = req.body;
    if (!seats || !Array.isArray(seats)) {
      return res.status(400).json({ error: 'Seats array is required' });
    }

    // Delete any existing seats for this venue
    await Seat.destroy({ where: { venueId: venue.id } });

    const createdSeats = await Seat.bulkCreate(seats);
    res.status(201).json({
      message: `Created ${createdSeats.length} seats`,
      totalSeats: createdSeats.length,
      seats: createdSeats,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/venues/:id
 * Admin only: Delete a venue
 */
router.delete('/:id', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const venue = await Venue.findByPk(req.params.id);
    if (!venue) {
      return res.status(404).json({ error: 'Venue not found' });
    }

    const seats = await Seat.findAll({ where: { venueId: venue.id } });
    for (const s of seats) {
      await SeatStatus.destroy({ where: { seatId: s.id } }).catch(() => {});
    }
    await Seat.destroy({ where: { venueId: venue.id } });
    await SeatCategory.destroy({ where: { venueId: venue.id } });
    await venue.destroy();

    res.json({ message: 'Venue deleted successfully' });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/venues
 * Public: List all venues
 */
router.get('/', async (req, res, next) => {
  try {
    const venues = await Venue.findAll({
      include: [
        { model: SeatCategory, as: 'categories' },
        { model: Seat, as: 'seats' },
      ],
      order: [['createdAt', 'DESC']],
    });
    res.json({ venues });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/venues/:id
 * Public: Get venue with seats and categories
 */
router.get('/:id', async (req, res, next) => {
  try {
    const venue = await Venue.findByPk(req.params.id, {
      include: [
        { model: SeatCategory, as: 'categories' },
        {
          model: Seat,
          as: 'seats',
          include: [{ model: SeatCategory, as: 'category' }],
        },
      ],
    });
    if (!venue) {
      return res.status(404).json({ error: 'Venue not found' });
    }
    res.json({ venue });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
