/**
 * LuminaTix Dynamic Pricing Engine
 * Computes seat prices based on base pricing, central view sweet spot, and demand dynamics.
 */

function calculateDynamicSeatPrice({
  basePrice = 250,
  totalSeats = 100,
  bookedSeats = 0,
  row = 1,
  totalRows = 10,
  col = 1,
  totalCols = 12,
  showtimeDate = new Date(),
  dynamicPricingEnabled = true,
}) {
  const numericBasePrice = Number(basePrice) || 250;
  if (!dynamicPricingEnabled || numericBasePrice <= 0) {
    return {
      finalPrice: numericBasePrice,
      basePrice: numericBasePrice,
      multiplier: 1.0,
      surgeLabel: 'Standard',
      surgePercent: 0,
      surgeReasons: [],
    };
  }

  let multiplier = 1.0;
  let surgeReasons = [];

  // 1. Prime Central Viewing Sweet Spot (Center Rows + Center Columns)
  // Optimal sightlines and acoustic sweet spot are centered in the hall
  const centerRow = (totalRows + 1) / 2;
  const centerCol = (totalCols + 1) / 2;
  const maxRowDist = Math.max(1, totalRows / 2);
  const maxColDist = Math.max(1, totalCols / 2);

  const rowDistNorm = Math.abs(row - centerRow) / maxRowDist; // 0 (center) to 1 (edge)
  const colDistNorm = Math.abs(col - centerCol) / maxColDist; // 0 (center) to 1 (edge)
  
  // Closeness score: 1.0 = exact central sweet spot, 0.0 = furthest corner
  const sweetSpotScore = Math.max(0, 1 - (rowDistNorm * 0.45 + colDistNorm * 0.55));

  if (sweetSpotScore >= 0.72) {
    multiplier += 0.20; // +20% Prime Center Sweet-Spot
    surgeReasons.push('Center Sweet-Spot');
  } else if (sweetSpotScore >= 0.50) {
    multiplier += 0.10; // +10% Preferred Central Sightline
    surgeReasons.push('Prime View');
  }

  // 2. Occupancy Fill Rate Multiplier (Demand Elasticity)
  const occupancyRate = totalSeats > 0 ? bookedSeats / totalSeats : 0;
  if (occupancyRate >= 0.85) {
    multiplier += 0.25; // +25% Super High Demand Surge (>85% full)
    surgeReasons.push('High Demand Surge');
  } else if (occupancyRate >= 0.65) {
    multiplier += 0.15; // +15% Filling Fast (>65% full)
    surgeReasons.push('Filling Fast');
  } else if (occupancyRate >= 0.45) {
    multiplier += 0.05; // +5% Active Demand (>45% full)
    surgeReasons.push('Active Demand');
  }

  // 3. Proximity to Showtime (Time-Decay / Rush)
  const showDate = new Date(showtimeDate);
  const now = new Date();
  const diffHours = (showDate.getTime() - now.getTime()) / (1000 * 60 * 60);

  if (diffHours > 0 && diffHours <= 6 && occupancyRate > 0.5) {
    multiplier += 0.10; // +10% Last-Minute Rush (<6 hrs away & high demand)
    surgeReasons.push('Last-Minute Rush');
  }

  // 4. Weekend Prime Evening Multiplier
  const day = showDate.getDay(); // 0 = Sun, 5 = Fri, 6 = Sat
  const hour = showDate.getHours();
  const isWeekend = day === 0 || day === 5 || day === 6;
  const isPrimeEvening = hour >= 17 && hour <= 22;

  if (isWeekend && isPrimeEvening) {
    multiplier += 0.10; // +10% Weekend Prime Evening
    surgeReasons.push('Prime Slot');
  }

  // Cap maximum surge multiplier at 1.75x
  multiplier = Math.min(1.75, Number(multiplier.toFixed(2)));

  // Round to clean 10s (e.g. 388 -> 390)
  const rawFinalPrice = numericBasePrice * multiplier;
  const roundedFinalPrice = Math.round(rawFinalPrice / 10) * 10;
  const surgePercent = Math.round((multiplier - 1) * 100);

  return {
    finalPrice: roundedFinalPrice,
    basePrice: numericBasePrice,
    multiplier,
    surgePercent,
    surgeLabel: surgeReasons.length > 0 ? surgeReasons[0] : 'Standard',
    surgeReasons,
  };
}

module.exports = {
  calculateDynamicSeatPrice,
};