import { Router } from 'express';
import { searchMovies, getMovieDetail, hasApiKey, genresFromDetail, directorFromDetail, posterUrl, backdropUrl } from '../tmdb.js';

export const searchRouter = Router();

searchRouter.get('/', async (req, res) => {
  const query = String(req.query.q ?? '');
  const page = Math.max(1, parseInt(String(req.query.page ?? '1'), 10) || 1);
  try {
    const result = await searchMovies(query, page);
    res.json({
      movies: result.movies,
      total: result.total,
      page,
      error: result.error,
      using_fallback: !hasApiKey(),
    });
  } catch (e) {
    res.status(502).json({ error: e instanceof Error ? e.message : 'Search failed' });
  }
});

searchRouter.get('/:tmdbId', async (req, res) => {
  const id = parseInt(req.params.tmdbId, 10);
  if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid id' });
  const detail = await getMovieDetail(id);
  if (!detail) return res.status(404).json({ error: 'Movie not found' });
  res.json({
    movie: {
      tmdb_id: detail.id,
      title: detail.title,
      original_title: detail.original_title,
      year: detail.release_date ? detail.release_date.slice(0, 4) : null,
      poster_url: posterUrl(detail.poster_path),
      backdrop_url: backdropUrl(detail.backdrop_path),
      genre: genresFromDetail(detail),
      director: directorFromDetail(detail),
      plot: detail.overview || null,
      tagline: detail.tagline || null,
      runtime: detail.runtime,
      tmdb_rating: detail.vote_average,
      imdb_id: detail.imdb_id,
    },
  });
});
