const TMDB_API_KEY = import.meta.env.VITE_TMDB_ACCESS_TOKEN; 
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

export const searchTMDBMovies = async (query) => {
  if (!query) return [];
  try {
    const res = await fetch(`${TMDB_BASE_URL}/search/movie?query=${encodeURIComponent(query)}&include_adult=false&language=en-US&page=1`, {
      headers: {
        Authorization: `Bearer ${TMDB_API_KEY}`,
        accept: 'application/json'
      }
    });
    const data = await res.json();
    return data.results || [];
  } catch (error) {
    console.error("Error searching TMDB:", error);
    return [];
  }
};

export const getTMDBMovieDetails = async (id) => {
  try {
    const res = await fetch(`${TMDB_BASE_URL}/movie/${id}?append_to_response=credits,videos&language=en-US`, {
      headers: {
        Authorization: `Bearer ${TMDB_API_KEY}`,
        accept: 'application/json'
      }
    });
    return await res.json();
  } catch (error) {
    console.error("Error fetching TMDB details:", error);
    return null;
  }
};

export const getLatestMovies = async () => {
  try {
    const res = await fetch(`${TMDB_BASE_URL}/movie/now_playing?language=en-US&page=1`, {
      headers: {
        Authorization: `Bearer ${TMDB_API_KEY}`,
        accept: 'application/json'
      }
    });
    const data = await res.json();
    return data.results || [];
  } catch (error) {
    console.error("Error fetching latest movies:", error);
    return [];
  }
};

export const getBollywoodMovies = async () => {
  try {
    const res = await fetch(`${TMDB_BASE_URL}/discover/movie?with_original_language=hi&sort_by=popularity.desc&page=1`, {
      headers: {
        Authorization: `Bearer ${TMDB_API_KEY}`,
        accept: 'application/json'
      }
    });
    const data = await res.json();
    return data.results || [];
  } catch (error) {
    console.error("Error fetching Bollywood movies:", error);
    return [];
  }
};
