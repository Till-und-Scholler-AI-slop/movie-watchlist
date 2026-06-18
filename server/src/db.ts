import { DatabaseSync, type SQLInputValue } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.DB_PATH ?? join(__dirname, '..', 'data', 'watchlist.db');

mkdirSync(dirname(DB_PATH), { recursive: true });

export const db = new DatabaseSync(DB_PATH);
db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA foreign_keys = ON');

export type WatchStatus = 'want' | 'watching' | 'watched';
export type MediaType = 'movie' | 'tv';

export interface WatchlistRow {
  id: number;
  tmdb_id: number;
  media_type: MediaType;
  title: string;
  original_title: string | null;
  year: string | null;
  poster_path: string | null;
  backdrop_path: string | null;
  genre: string | null;
  director: string | null;
  plot: string | null;
  tagline: string | null;
  runtime: number | null;
  tmdb_rating: number | null;
  imdb_id: string | null;
  number_of_seasons: number | null;
  number_of_episodes: number | null;
  status: WatchStatus;
  rating: number | null;
  notes: string | null;
  added_at: string;
  watched_at: string | null;
}

// Auto-migrate: drop legacy single-key schema if it exists (no production data yet).
function migrate(): void {
  const cols = db.prepare("PRAGMA table_info(watchlist)").all() as { name: string }[];
  if (cols.length === 0) return;
  const colNames = cols.map((c) => c.name);
  const hasMediaType = colNames.includes('media_type');
  if (hasMediaType) return;
  // Old schema without media_type — drop and recreate.
  db.exec('DROP TABLE IF EXISTS watchlist');
}

migrate();

db.exec(`
  CREATE TABLE IF NOT EXISTS watchlist (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    tmdb_id             INTEGER NOT NULL,
    media_type          TEXT NOT NULL CHECK (media_type IN ('movie','tv')),
    title               TEXT NOT NULL,
    original_title      TEXT,
    year                TEXT,
    poster_path         TEXT,
    backdrop_path       TEXT,
    genre               TEXT,
    director            TEXT,
    plot                TEXT,
    tagline             TEXT,
    runtime             INTEGER,
    tmdb_rating         REAL,
    imdb_id             TEXT,
    number_of_seasons   INTEGER,
    number_of_episodes  INTEGER,
    status              TEXT NOT NULL DEFAULT 'want' CHECK (status IN ('want','watching','watched')),
    rating              INTEGER CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5)),
    notes               TEXT,
    added_at            TEXT NOT NULL DEFAULT (datetime('now')),
    watched_at          TEXT,
    UNIQUE (tmdb_id, media_type)
  );
  CREATE INDEX IF NOT EXISTS idx_watchlist_status ON watchlist(status);
  CREATE INDEX IF NOT EXISTS idx_watchlist_media ON watchlist(media_type);
  CREATE INDEX IF NOT EXISTS idx_watchlist_added ON watchlist(added_at);
`);

export interface AddTitleInput {
  tmdb_id: number;
  media_type: MediaType;
  title: string;
  original_title?: string | null;
  year?: string | null;
  poster_path?: string | null;
  backdrop_path?: string | null;
  genre?: string | null;
  director?: string | null;
  plot?: string | null;
  tagline?: string | null;
  runtime?: number | null;
  tmdb_rating?: number | null;
  imdb_id?: string | null;
  number_of_seasons?: number | null;
  number_of_episodes?: number | null;
}

const insertStmt = db.prepare(`
  INSERT INTO watchlist (
    tmdb_id, media_type, title, original_title, year, poster_path, backdrop_path,
    genre, director, plot, tagline, runtime, tmdb_rating, imdb_id,
    number_of_seasons, number_of_episodes
  )
  VALUES (
    @tmdb_id, @media_type, @title, @original_title, @year, @poster_path, @backdrop_path,
    @genre, @director, @plot, @tagline, @runtime, @tmdb_rating, @imdb_id,
    @number_of_seasons, @number_of_episodes
  )
  ON CONFLICT(tmdb_id, media_type) DO NOTHING
  RETURNING id
`);

const getByIdStmt = db.prepare('SELECT * FROM watchlist WHERE id = ?');
const getByTmdbStmt = db.prepare('SELECT * FROM watchlist WHERE tmdb_id = ? AND media_type = ?');
const listStmt = db.prepare('SELECT * FROM watchlist ORDER BY added_at DESC');
const listByStatusStmt = db.prepare('SELECT * FROM watchlist WHERE status = ? ORDER BY added_at DESC');
const listByMediaTypeStmt = db.prepare('SELECT * FROM watchlist WHERE media_type = ? ORDER BY added_at DESC');
const listByStatusAndMediaTypeStmt = db.prepare(
  'SELECT * FROM watchlist WHERE status = ? AND media_type = ? ORDER BY added_at DESC',
);

function coerceRow(row: unknown): WatchlistRow | null {
  return (row ?? null) as WatchlistRow | null;
}

export function addTitle(input: AddTitleInput): { item: WatchlistRow | null; created: boolean } {
  const row = insertStmt.get(
    input as unknown as Record<string, SQLInputValue>,
  ) as unknown as { id: number } | undefined;
  if (row) return { item: coerceRow(getByIdStmt.get(row.id)), created: true };
  return {
    item: coerceRow(getByTmdbStmt.get(input.tmdb_id, input.media_type)),
    created: false,
  };
}

export function getById(id: number): WatchlistRow | null {
  return coerceRow(getByIdStmt.get(id));
}

export function list(
  status?: WatchStatus,
  mediaType?: MediaType,
): WatchlistRow[] {
  if (status && mediaType) {
    return listByStatusAndMediaTypeStmt.all(status, mediaType) as unknown as WatchlistRow[];
  }
  if (status) return listByStatusStmt.all(status) as unknown as WatchlistRow[];
  if (mediaType) return listByMediaTypeStmt.all(mediaType) as unknown as WatchlistRow[];
  return listStmt.all() as unknown as WatchlistRow[];
}

const updateStmt = db.prepare(`
  UPDATE watchlist
  SET status = @status,
      rating = @rating,
      notes = @notes,
      watched_at = @watched_at
  WHERE id = @id
`);

export interface UpdateInput {
  id: number;
  status: WatchStatus;
  rating: number | null;
  notes: string | null;
}

export function updateEntry(input: UpdateInput): boolean {
  const watchedAt = input.status === 'watched' ? new Date().toISOString() : null;
  const res = updateStmt.run({ ...input, watched_at: watchedAt });
  return res.changes > 0;
}

const deleteStmt = db.prepare('DELETE FROM watchlist WHERE id = ?');

export function removeEntry(id: number): boolean {
  return deleteStmt.run(id).changes > 0;
}

const statsStmt = db.prepare(`
  SELECT
    COUNT(*) AS total,
    COALESCE(SUM(CASE WHEN status = 'watched' THEN 1 ELSE 0 END), 0) AS watched,
    COALESCE(SUM(CASE WHEN status = 'watching' THEN 1 ELSE 0 END), 0) AS watching,
    COALESCE(SUM(CASE WHEN status = 'want' THEN 1 ELSE 0 END), 0) AS want,
    COALESCE(ROUND(AVG(CASE WHEN rating IS NOT NULL THEN rating END), 2), 0) AS avg_rating,
    COALESCE(SUM(CASE WHEN media_type = 'movie' THEN 1 ELSE 0 END), 0) AS movies,
    COALESCE(SUM(CASE WHEN media_type = 'tv' THEN 1 ELSE 0 END), 0) AS shows
  FROM watchlist
`);

export interface Stats {
  total: number;
  watched: number;
  watching: number;
  want: number;
  avg_rating: number;
  movies: number;
  shows: number;
}

export function stats(): Stats {
  return statsStmt.get() as unknown as Stats;
}

const genreStatsStmt = db.prepare(`
  SELECT genre AS name, COUNT(*) AS count
  FROM watchlist
  WHERE genre IS NOT NULL AND genre != '' AND status = 'watched'
  GROUP BY genre
  ORDER BY count DESC
  LIMIT 10
`);

export interface GenreStat {
  name: string;
  count: number;
}

export function genreStats(): GenreStat[] {
  const rows = genreStatsStmt.all() as unknown as { name: string; count: number }[];
  const out: GenreStat[] = [];
  for (const r of rows) {
    for (const g of r.name.split(', ')) {
      const existing = out.find((o) => o.name === g);
      if (existing) existing.count += r.count;
      else out.push({ name: g, count: r.count });
    }
  }
  return out.sort((a, b) => b.count - a.count).slice(0, 10);
}
