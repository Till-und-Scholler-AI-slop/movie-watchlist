import { Router } from 'express';
import {
  getTitleExtended,
  posterUrl,
  backdropUrl,
  genresFromDetail,
  directorFromDetail,
  type MediaType,
} from '../tmdb.js';
import { getByTmdbId } from '../db.js';

export const titlesRouter = Router();

titlesRouter.get('/:tmdbId/full', async (req, res) => {
  const id = parseInt(req.params.tmdbId, 10);
  if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid id' });

  const rawType = String(req.query.type ?? '');
  if (rawType !== 'movie' && rawType !== 'tv') {
    return res.status(400).json({ error: 'type query param must be "movie" or "tv"' });
  }
  const mediaType: MediaType = rawType;

  try {
    const ext = await getTitleExtended(id, mediaType);
    if (!ext) return res.status(404).json({ error: 'Title not found' });

    const d = ext.detail;
    const year = d.release_date ? d.release_date.slice(0, 4) : null;

    const watchlistEntry = getByTmdbId(req.user!.uid, id, mediaType);
    const watchlist = watchlistEntry
      ? {
          id: watchlistEntry.id,
          status: watchlistEntry.status,
          rating: watchlistEntry.rating,
          notes: watchlistEntry.notes,
        }
      : null;

    res.json({
      title: {
        tmdb_id: d.id,
        media_type: d.media_type,
        title: d.title,
        original_title: d.original_title,
        year,
        poster_url: posterUrl(d.poster_path),
        backdrop_url: backdropUrl(d.backdrop_path),
        genre: genresFromDetail(d),
        director: directorFromDetail(d),
        plot: d.overview || null,
        tagline: d.tagline || null,
        runtime: d.runtime,
        tmdb_rating: d.vote_average,
        imdb_id: d.imdb_id,
        number_of_seasons: d.number_of_seasons,
        number_of_episodes: d.number_of_episodes,
      },
      cast: ext.cast,
      crew_top: ext.crew_top,
      trailer_key: ext.trailer_key,
      trailer_name: ext.trailer_name,
      similar: ext.similar,
      watchlist,
    });
  } catch (e) {
    res.status(502).json({ error: e instanceof Error ? e.message : 'TMDB request failed' });
  }
});