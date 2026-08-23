require('dotenv').config();

const TICKETMASTER_API_KEY = process.env.TICKETMASTER_API_KEY || '6cN7xHNl26LhkXI26KMdCAvn8qwGYGN6';
const TM_BASE_URL = 'https://app.ticketmaster.com/discovery/v2';

/**
 * Clean & Extract Best Image from Ticketmaster image array
 */
function getBestImage(images = [], ratio = '16_9') {
  if (!images || images.length === 0) return null;
  const filtered = images.filter((img) => img.ratio === ratio);
  if (filtered.length > 0) {
    filtered.sort((a, b) => (b.width || 0) - (a.width || 0));
    return filtered[0].url;
  }
  images.sort((a, b) => (b.width || 0) - (a.width || 0));
  return images[0].url;
}

/**
 * Format Ticketmaster Event Object
 */
function formatTmEvent(event) {
  const classification = event.classifications?.[0] || {};
  const venue = event._embedded?.venues?.[0] || {};
  const segment = classification.segment?.name?.toLowerCase() || '';

  let eventType = 'concert';
  if (segment.includes('arts') || segment.includes('theatre') || segment.includes('theater')) {
    eventType = 'theatre';
  } else if (segment.includes('film')) {
    eventType = 'movie';
  }

  const images = event.images || [];
  const imageUrl = getBestImage(images, '4_3') || getBestImage(images, '3_2') || images[0]?.url;
  const backdropUrl = getBestImage(images, '16_9') || images[0]?.url;

  const priceRange = event.priceRanges?.[0] || null;

  return {
    id: `tm-${event.id}`,
    ticketmasterId: event.id,
    title: event.name,
    type: eventType,
    genre: classification.genre?.name || classification.segment?.name || 'Live Experience',
    subGenre: classification.subGenre?.name || '',
    description: event.info || event.pleaseNote || `${event.name} live in performance at ${venue.name || 'auditorium'}.`,
    imageUrl,
    backdropUrl,
    date: event.dates?.start?.localDate || '',
    time: event.dates?.start?.localTime || '',
    dateTime: event.dates?.start?.dateTime || '',
    status: event.dates?.status?.code || 'onsale',
    venue: {
      name: venue.name || 'Arena Auditorium',
      address: venue.address?.line1 || '',
      city: venue.city?.name || '',
      state: venue.state?.name || '',
      country: venue.country?.name || '',
      postalCode: venue.postalCode || '',
      location: venue.location || null,
    },
    price: priceRange ? {
      min: priceRange.min,
      max: priceRange.max,
      currency: priceRange.currency || 'USD',
    } : null,
    url: event.url || '',
    seatmapUrl: event.seatmap?.staticUrl || null,
  };
}

/**
 * Discover Live Shows & Concerts from Ticketmaster
 */
async function discoverShows({
  classificationName = 'music',
  keyword = '',
  city = '',
  countryCode = '',
  size = 20,
  page = 0,
  sort = 'date,asc',
} = {}) {
  try {
    const params = new URLSearchParams({
      apikey: TICKETMASTER_API_KEY,
      size: String(size),
      page: String(page),
      sort,
    });

    if (classificationName) params.append('classificationName', classificationName);
    if (keyword) params.append('keyword', keyword);
    if (city) params.append('city', city);
    if (countryCode) params.append('countryCode', countryCode);

    const url = `${TM_BASE_URL}/events.json?${params.toString()}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Ticketmaster API returned status ${response.status}`);
    }

    const data = await response.json();
    const rawEvents = data._embedded?.events || [];
    const formatted = rawEvents.map(formatTmEvent);

    return {
      events: formatted,
      page: data.page || { size, totalElements: formatted.length, totalPages: 1, number: 0 },
    };
  } catch (error) {
    console.error('Error fetching Ticketmaster discover:', error.message);
    return { events: [], page: { size, totalElements: 0, totalPages: 0, number: 0 } };
  }
}

/**
 * Get Specific Event Details from Ticketmaster
 */
async function getShowDetails(ticketmasterId) {
  try {
    const id = ticketmasterId.replace(/^tm-/, '');
    const url = `${TM_BASE_URL}/events/${id}.json?apikey=${TICKETMASTER_API_KEY}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Ticketmaster API returned status ${response.status}`);
    }

    const event = await response.json();
    return formatTmEvent(event);
  } catch (error) {
    console.error(`Error fetching Ticketmaster show ${ticketmasterId}:`, error.message);
    return null;
  }
}

module.exports = {
  discoverShows,
  getShowDetails,
};
