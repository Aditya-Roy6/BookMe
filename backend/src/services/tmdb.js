const TMDB_ACCESS_TOKEN = process.env.TMDB_ACCESS_TOKEN || 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIwNmI5MDQ1MjYzOTM1YWM1NjUwZDIzODQyYzJmMzc0NiIsIm5iZiI6MTc3OTA5NzMwMy4xMTAwMDAxLCJzdWIiOiI2YTBhZGVkN2U5YzUyOWIwYjA0ZTYyNjEiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.iE8O5o5gGBQ0ZuN4OltlxOLBOnW2c0pPmB-uuwfc1fs';
const TMDB_API_KEY = process.env.TMDB_API_KEY || '06b9045263935ac5650d23842c2f3746';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

// TMDB Genre ID Map
const GENRE_MAP = {
  action: 28,
  adventure: 12,
  animation: 16,
  comedy: 35,
  crime: 80,
  documentary: 99,
  drama: 18,
  family: 10751,
  fantasy: 14,
  history: 36,
  horror: 27,
  music: 10402,
  mystery: 9648,
  romance: 10749,
  'sci-fi': 878,
  scifi: 878,
  sciencefiction: 878,
  thriller: 53,
  war: 10752,
  western: 37,
};

/**
 * Helper to make authenticated requests to TMDB API
 */
async function tmdbFetch(endpoint, params = {}) {
  const url = new URL(`${TMDB_BASE_URL}${endpoint}`);
  
  // Append query params
  Object.keys(params).forEach((key) => {
    if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
      url.searchParams.append(key, params[key]);
    }
  });

  const headers = {
    accept: 'application/json',
  };

  if (TMDB_ACCESS_TOKEN) {
    headers.Authorization = `Bearer ${TMDB_ACCESS_TOKEN}`;
  } else if (TMDB_API_KEY) {
    url.searchParams.append('api_key', TMDB_API_KEY);
  }

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers,
  });

  if (!response.ok) {
    const errBody = await response.text().catch(() => '');
    throw new Error(`TMDB API Error: ${response.status} ${response.statusText} - ${errBody}`);
  }

  return response.json();
}

/**
 * Format runtime minutes into "Xh Ym"
 */
function formatDuration(minutes) {
  if (!minutes || isNaN(minutes)) return '2h 15m';
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hrs > 0 && mins > 0) return `${hrs}h ${mins.toString().padStart(2, '0')}m`;
  if (hrs > 0) return `${hrs}h 00m`;
  return `${mins}m`;
}

/**
 * Extract age certification from TMDB release_dates response
 */
function extractAgeRating(releaseDatesData) {
  if (!releaseDatesData || !releaseDatesData.results) return 'UA 13+';

  // Check India (IN) first, then US
  const inRelease = releaseDatesData.results.find((r) => r.iso_3166_1 === 'IN');
  const usRelease = releaseDatesData.results.find((r) => r.iso_3166_1 === 'US');

  const inCert = inRelease?.release_dates?.find((d) => d.certification)?.certification;
  if (inCert) {
    if (inCert.toUpperCase().includes('U/A') || inCert.toUpperCase().includes('UA')) return 'UA 13+';
    if (inCert.toUpperCase() === 'A') return 'A (18+)';
    if (inCert.toUpperCase() === 'U') return 'U (Universal)';
    return inCert;
  }

  const usCert = usRelease?.release_dates?.find((d) => d.certification)?.certification;
  if (usCert) {
    if (usCert === 'PG-13') return 'UA 13+ (PG-13)';
    if (usCert === 'R') return 'A (Rated R - 18+)';
    if (usCert === 'PG') return 'PG (Parental Guidance)';
    if (usCert === 'G') return 'U (All Ages)';
    return usCert;
  }

  return 'UA 13+';
}

/**
 * Search movies by keyword for live autocompletion
 */
async function searchMovies(query, page = 1) {
  if (!query || !query.trim()) return { results: [], total_results: 0 };

  const data = await tmdbFetch('/search/movie', {
    query: query.trim(),
    include_adult: false,
    language: 'en-US',
    page,
  });

  const results = (data.results || []).map((m) => ({
    id: m.id,
    title: m.title,
    originalTitle: m.original_title,
    overview: m.overview,
    releaseDate: m.release_date,
    releaseYear: m.release_date ? m.release_date.split('-')[0] : '',
    voteAverage: m.vote_average ? m.vote_average.toFixed(1) : '8.0',
    posterUrl: m.poster_path ? `${TMDB_IMAGE_BASE_URL}/w780${m.poster_path}` : null,
    backdropUrl: m.backdrop_path ? `${TMDB_IMAGE_BASE_URL}/original${m.backdrop_path}` : null,
  }));

  return {
    page: data.page,
    totalPages: data.total_pages,
    totalResults: data.total_results,
    results,
  };
}

/**
 * Fetch complete movie details with credits, videos, release dates, reviews, and similar movies
 */
async function getMovieDetails(tmdbId) {
  const data = await tmdbFetch(`/movie/${tmdbId}`, {
    append_to_response: 'credits,videos,release_dates,reviews,similar',
    language: 'en-US',
  });

  // Extract director
  const directorObj = data.credits?.crew?.find((c) => c.job === 'Director');
  const director = directorObj ? directorObj.name : null;

  // Extract Top 12 cast members
  const cast = (data.credits?.cast || []).slice(0, 12).map((c) => ({
    name: c.name,
    role: c.character || 'Actor',
    avatarUrl: c.profile_path ? `${TMDB_IMAGE_BASE_URL}/w185${c.profile_path}` : null,
  }));

  // Extract Reviews
  const reviews = (data.reviews?.results || []).slice(0, 6).map((r) => ({
    id: r.id,
    author: r.author,
    username: r.author_details?.username || r.author,
    avatarUrl: r.author_details?.avatar_path
      ? r.author_details.avatar_path.startsWith('http')
        ? r.author_details.avatar_path.replace(/^\//, '')
        : `${TMDB_IMAGE_BASE_URL}/w185${r.author_details.avatar_path}`
      : null,
    rating: r.author_details?.rating || null,
    content: r.content,
    createdAt: r.created_at,
    url: r.url,
  }));

  // Extract Similar Movies
  const similarMovies = (data.similar?.results || []).slice(0, 8).map((s) => ({
    id: s.id,
    title: s.title,
    posterUrl: s.poster_path ? `${TMDB_IMAGE_BASE_URL}/w780${s.poster_path}` : null,
    voteAverage: s.vote_average ? s.vote_average.toFixed(1) : '8.0',
    releaseYear: s.release_date ? s.release_date.split('-')[0] : '',
  }));

  // Extract official trailer (prefer Official Trailer from YouTube)
  const videos = data.videos?.results || [];
  const officialTrailer =
    videos.find((v) => v.site === 'YouTube' && v.type === 'Trailer' && v.official) ||
    videos.find((v) => v.site === 'YouTube' && v.type === 'Trailer') ||
    videos.find((v) => v.site === 'YouTube' && v.type === 'Teaser');

  const trailerUrl = officialTrailer
    ? `https://www.youtube.com/watch?v=${officialTrailer.key}`
    : null;

  // Extract genres
  const genre = (data.genres || []).map((g) => g.name).join(' • ') || 'Action • Adventure';

  // Duration
  const duration = formatDuration(data.runtime);

  // Ratings
  const voteAverage = data.vote_average ? data.vote_average.toFixed(1) : '8.5';
  const ageRating = extractAgeRating(data.release_dates);

  return {
    tmdbId: data.id,
    title: data.title,
    tagline: data.tagline || '',
    description: data.overview || '',
    type: 'movie',
    imageUrl: data.poster_path ? `${TMDB_IMAGE_BASE_URL}/w780${data.poster_path}` : null,
    backdropUrl: data.backdrop_path ? `${TMDB_IMAGE_BASE_URL}/original${data.backdrop_path}` : null,
    trailerUrl,
    director,
    duration,
    genre,
    imdbRating: voteAverage,
    rating: ageRating,
    ageRating,
    releaseDate: data.release_date || '',
    language: data.spoken_languages?.[0]?.english_name
      ? `${data.spoken_languages[0].english_name} • Dolby Atmos 7.1`
      : 'English • Dolby Atmos 7.1',
    budget: data.budget || null,
    revenue: data.revenue || null,
    productionCompanies: (data.production_companies || []).slice(0, 4).map((p) => ({
      id: p.id,
      name: p.name,
      logoUrl: p.logo_path ? `${TMDB_IMAGE_BASE_URL}/w185${p.logo_path}` : null,
    })),
    cast,
    reviews,
    similarMovies,
  };
}

/**
 * Discover movies (Bollywood, Hollywood, Anime, by Genre, Sort)
 */
async function discoverMovies({
  industry = 'all',
  genre = 'all',
  sortBy = 'popularity.desc',
  search = '',
  page = 1,
} = {}) {
  // If search query is provided, use search endpoint
  if (search && search.trim()) {
    return searchMovies(search, page);
  }

  const params = {
    include_adult: false,
    include_video: false,
    language: 'en-US',
    page,
    sort_by: sortBy || 'popularity.desc',
  };

  // Industry Filtering
  if (industry === 'bollywood' || industry === 'indian') {
    params.with_original_language = 'hi|te|ta|kn|ml';
  } else if (industry === 'hollywood') {
    params.with_original_language = 'en';
  } else if (industry === 'anime') {
    params.with_original_language = 'ja';
    params.with_genres = '16';
  }

  // Genre Filtering
  if (genre && genre !== 'all') {
    const genreKey = genre.toLowerCase().replace(/[^a-z]/g, '');
    if (GENRE_MAP[genreKey]) {
      params.with_genres = params.with_genres
        ? `${params.with_genres},${GENRE_MAP[genreKey]}`
        : GENRE_MAP[genreKey].toString();
    }
  }

  const data = await tmdbFetch('/discover/movie', params);

  const results = (data.results || []).map((m) => ({
    id: m.id,
    title: m.title,
    originalTitle: m.original_title,
    overview: m.overview,
    releaseDate: m.release_date,
    releaseYear: m.release_date ? m.release_date.split('-')[0] : '',
    voteAverage: m.vote_average ? m.vote_average.toFixed(1) : '8.0',
    posterUrl: m.poster_path ? `${TMDB_IMAGE_BASE_URL}/w780${m.poster_path}` : null,
    backdropUrl: m.backdrop_path ? `${TMDB_IMAGE_BASE_URL}/original${m.backdrop_path}` : null,
    genreIds: m.genre_ids,
  }));

  return {
    page: data.page,
    totalPages: data.total_pages,
    totalResults: data.total_results,
    industry,
    genre,
    results,
  };
}

/**
 * Clean up title string to maximize TMDB match accuracy
 */
function sanitizeTitleForSearch(rawTitle) {
  return rawTitle
    .replace(/[:—–-].*$/i, '') // Remove subtitles
    .replace(/\b(IMAX|3D|2D|4K|DOLBY|EXCLUSIVE|EXPERIENCE|LASER)\b/gi, '')
    .trim();
}

/**
 * Search TMDB and enrich an event record
 */
async function findAndEnrichMovie(rawTitle) {
  const cleanTitle = sanitizeTitleForSearch(rawTitle);
  const search = await searchMovies(cleanTitle);

  if (!search.results || search.results.length === 0) {
    const fallbackSearch = await searchMovies(rawTitle);
    if (!fallbackSearch.results || fallbackSearch.results.length === 0) {
      return null;
    }
    return getMovieDetails(fallbackSearch.results[0].id);
  }

  return getMovieDetails(search.results[0].id);
}

module.exports = {
  searchMovies,
  getMovieDetails,
  discoverMovies,
  findAndEnrichMovie,
};
