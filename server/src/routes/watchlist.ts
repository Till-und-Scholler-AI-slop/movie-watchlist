import { Router } from 'express';
import { addTitle, list, getById, updateEntry, removeEntry, type WatchStatus, type MediaType } from '../db.js';
import { getTitleDetail, genresFromDetail, directorFromDetail, type TmdbDetail } from '../tmdb.js';

export const watchlistRouter = Router();

watchlistRouter.get('/', (req, res) => {
  const status = req.query.status as WatchStatus | undefined;
  const validStatuses: WatchStatus[] = ['want', 'watching', 'watched'];
  const statusFilter = status && validStatuses.includes(status) ? status : undefined;

  const mediaTypeParam = req.query.media_type as MediaType | undefined;
  const validMediaTypes: MediaType[] = ['movie', 'tv'];
  const mediaFilter =
    mediaTypeParam && validMediaTypes.includes(mediaTypeParam) ? mediaTypeParam : undefined;

  res.json({ items: list(req.user!.uid, statusFilter, mediaFilter) });
});

watchlistRouter.post('/', async (req, res) => {
  const { tmdb_id, media_type } = req.body ?? {};
  if (typeof tmdb_id !== 'number' || !Number.isFinite(tmdb_id)) {
    return res.status(400).json({ error: 'tmdb_id (number) is required' });
  }
  if (media_type !== 'movie' && media_type !== 'tv') {
    return res.status(400).json({ error: 'media_type must be "movie" or "tv"' });
  }

  const detail: TmdbDetail | null = await getTitleDetail(tmdb_id, media_type);
  if (!detail) return res.status(404).json({ error: 'Title not found on TMDB' });

  const result = addTitle(req.user!.uid, {
    tmdb_id: detail.id,
    media_type: detail.media_type,
    title: detail.title || detail.original_title,
    original_title: detail.original_title || null,
    year: detail.release_date ? detail.release_date.slice(0, 4) : null,
    poster_path: detail.poster_path,
    backdrop_path: detail.backdrop_path,
    genre: genresFromDetail(detail),
    director: directorFromDetail(detail),
    plot: detail.overview || null,
    tagline: detail.tagline || null,
    runtime: detail.runtime,
    tmdb_rating: detail.vote_average,
    imdb_id: detail.imdb_id,
    number_of_seasons: detail.number_of_seasons,
    number_of_episodes: detail.number_of_episodes,
  });

  if (!result.item) return res.status(404).json({ error: 'Title not found on TMDB' });
  if (!result.created) {
    return res.status(409).json({ error: 'Already in watchlist', item: result.item });
  }
  res.status(201).json({ item: result.item });
});

watchlistRouter.patch('/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid id' });

  const existing = getById(req.user!.uid, id);
  if (!existing) return res.status(404).json({ error: 'Entry not found' });

  const validStatuses: WatchStatus[] = ['want', 'watching', 'watched'];
  const status = (req.body?.status ?? existing.status) as WatchStatus;
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  const ratingRaw = req.body?.rating;
  const rating = ratingRaw === null || ratingRaw === undefined ? null : Number(ratingRaw);
  if (rating !== null && (Number.isNaN(rating) || rating < 1 || rating > 5)) {
    return res.status(400).json({ error: 'rating must be between 1 and 5' });
  }

  const notes = req.body?.notes === undefined ? existing.notes : String(req.body.notes);

  const ok = updateEntry({ user_id: req.user!.uid, id, status, rating, notes });
  if (!ok) return res.status(404).json({ error: 'Entry not found' });
  res.json({ item: getById(req.user!.uid, id) });
});

watchlistRouter.delete('/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid id' });
  const ok = removeEntry(req.user!.uid, id);
  if (!ok) return res.status(404).json({ error: 'Entry not found' });
  res.status(204).end();
});
