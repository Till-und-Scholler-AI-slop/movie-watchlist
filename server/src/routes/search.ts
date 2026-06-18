import { Router } from 'express';
import { searchMovies, getMovieDetail, hasApiKey } from '../omdb.js';

export const searchRouter = Router();

searchRouter.get('/', async (req, res) => {
  const query = String(req.query.q ?? '');
  const page = Math.max(1, parseInt(String(req.query.page ?? '1'), 10) || 1);
  const result = await searchMovies(query, page);
  res.json({
    movies: result.movies,
    total: result.total,
    page,
    error: result.error,
    using_fallback: !hasApiKey(),
  });
});

searchRouter.get('/:imdbID', async (req, res) => {
  const detail = await getMovieDetail(req.params.imdbID);
  if (!detail) return res.status(404).json({ error: 'Movie not found' });
  res.json({ movie: detail });
});
