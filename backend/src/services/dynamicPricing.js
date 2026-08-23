/**
 * LuminaTix Dynamic Pricing Engine
 */

function calculateDynamicSeatPrice({
  basePrice = 250,
  totalSeats = 100,
  bookedSeats = 0,
  row = 1,
  totalRows = 10,
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
    };
  }

  let multiplier = 1.0;
  let surgeReasons = [];

  // 1. Occupancy Fill Rate Multiplier (Demand Elasticity)
  const occupancyRate = totalSeats > 0 ? bookedSeats / totalSeats : 0;

  if (occupancyRate >= 0.85) {
    multiplier += 0.35; // +35% Super High Demand Surge (>85% full)
    surgeReasons.push('High Demand Surge');
  } else if (occupancyRate >= 0.65) {
    multiplier += 0.20; // +20% Filling Fast (>65% full)
    surgeReasons.push('Filling Fast');
  } else if (occupancyRate >= 0.45) {
    multiplier += 0.10; // +10% Active Demand (>45% full)
    surgeReasons.push('Active Demand');
  }

  // 2. Prime Viewing Sweet Spot (Center 40% of rows e.g. rows 4-7 in 10-row hall)
  const primeRowStart = Math.max(2, Math.floor(totalRows * 0.35));
  const primeRowEnd = Math.min(totalRows - 1, Math.ceil(totalRows * 0.75));
  const isPrimeRow = row >= primeRowStart && row <= primeRowEnd;

if (isPrimeRow) {
    multiplier += 0.10; // +10% Prime Sightline & Acoustic Zone 
    surgeReasons.push('Prime View');
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