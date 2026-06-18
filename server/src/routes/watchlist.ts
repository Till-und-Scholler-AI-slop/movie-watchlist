import { Router } from 'express';
import { addMovie, list, getById, updateEntry, removeEntry, type WatchStatus } from '../db.js';
import { getMovieDetail, type OmdbDetail } from '../omdb.js';

export const watchlistRouter = Router();

watchlistRouter.get('/', (req, res) => {
  const status = req.query.status as WatchStatus | undefined;
  const valid: WatchStatus[] = ['want', 'watching', 'watched'];
  const filter = status && valid.includes(status) ? status : undefined;
  res.json({ items: list(filter) });
});

watchlistRouter.post('/', async (req, res) => {
  const { imdb_id } = req.body ?? {};
  if (typeof imdb_id !== 'string' || !imdb_id.trim()) {
    return res.status(400).json({ error: 'imdb_id is required' });
  }

  const detail: OmdbDetail | null = await getMovieDetail(imdb_id);
  if (!detail) return res.status(404).json({ error: 'Movie not found on OMDb' });

  const result = addMovie({
    imdb_id: detail.imdbID,
    title: detail.Title,
    year: detail.Year,
    poster: detail.Poster && detail.Poster !== 'N/A' ? detail.Poster : null,
    genre: detail.Genre && detail.Genre !== 'N/A' ? detail.Genre : null,
    director: detail.Director && detail.Director !== 'N/A' ? detail.Director : null,
    plot: detail.Plot && detail.Plot !== 'N/A' ? detail.Plot : null,
    runtime: detail.Runtime && detail.Runtime !== 'N/A' ? detail.Runtime : null,
    imdb_rating: detail.imdbRating && detail.imdbRating !== 'N/A' ? detail.imdbRating : null,
  });

  if (!result.item) return res.status(404).json({ error: 'Movie not found on OMDb' });
  if (!result.created) return res.status(409).json({ error: 'Already in watchlist', item: result.item });
  res.status(201).json({ item: result.item });
});

watchlistRouter.patch('/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid id' });

  const existing = getById(id);
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

  const ok = updateEntry({ id, status, rating, notes });
  if (!ok) return res.status(404).json({ error: 'Entry not found' });
  res.json({ item: getById(id) });
});

watchlistRouter.delete('/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid id' });
  const ok = removeEntry(id);
  if (!ok) return res.status(404).json({ error: 'Entry not found' });
  res.status(204).end();
});
