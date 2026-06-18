import { Router } from 'express';
import {
  searchTitles,
  getTitleDetail,
  hasApiKey,
  genresFromDetail,
  directorFromDetail,
  posterUrl,
  backdropUrl,
  type MediaType,
} from '../tmdb.js';

export const searchRouter = Router();

searchRouter.get('/', async (req, res) => {
  const query = String(req.query.q ?? '');
  const page = Math.max(1, parseInt(String(req.query.page ?? '1'), 10) || 1);
  try {
    const result = await searchTitles(query, page);
    res.json({
      titles: result.titles,
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

  const rawType = String(req.query.type ?? '');
  const mediaType: MediaType | null =
    rawType === 'movie' ? 'movie' : rawType === 'tv' ? 'tv' : null;
  if (!mediaType) {
    return res.status(400).json({ error: 'type query param must be "movie" or "tv"' });
  }

  const detail = await getTitleDetail(id, mediaType);
  if (!detail) return res.status(404).json({ error: 'Title not found' });
  res.json({
    title: {
      tmdb_id: detail.id,
      media_type: detail.media_type,
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
      number_of_seasons: detail.number_of_seasons,
      number_of_episodes: detail.number_of_episodes,
    },
  });
});
