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

export interface WatchlistRow {
  id: number;
  imdb_id: string;
  title: string;
  year: string | null;
  poster: string | null;
  genre: string | null;
  director: string | null;
  plot: string | null;
  runtime: string | null;
  imdb_rating: string | null;
  status: WatchStatus;
  rating: number | null;
  notes: string | null;
  added_at: string;
  watched_at: string | null;
}

db.exec(`
  CREATE TABLE IF NOT EXISTS watchlist (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    imdb_id      TEXT NOT NULL UNIQUE,
    title        TEXT NOT NULL,
    year         TEXT,
    poster       TEXT,
    genre        TEXT,
    director     TEXT,
    plot         TEXT,
    runtime      TEXT,
    imdb_rating  TEXT,
    status       TEXT NOT NULL DEFAULT 'want' CHECK (status IN ('want','watching','watched')),
    rating       INTEGER CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5)),
    notes        TEXT,
    added_at     TEXT NOT NULL DEFAULT (datetime('now')),
    watched_at   TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_watchlist_status ON watchlist(status);
  CREATE INDEX IF NOT EXISTS idx_watchlist_added ON watchlist(added_at);
`);

export interface AddMovieInput {
  imdb_id: string;
  title: string;
  year?: string | null;
  poster?: string | null;
  genre?: string | null;
  director?: string | null;
  plot?: string | null;
  runtime?: string | null;
  imdb_rating?: string | null;
}

const insertStmt = db.prepare(`
  INSERT INTO watchlist (imdb_id, title, year, poster, genre, director, plot, runtime, imdb_rating)
  VALUES (@imdb_id, @title, @year, @poster, @genre, @director, @plot, @runtime, @imdb_rating)
  ON CONFLICT(imdb_id) DO NOTHING
  RETURNING id
`);

const getByIdStmt = db.prepare('SELECT * FROM watchlist WHERE id = ?');
const getByImdbStmt = db.prepare('SELECT * FROM watchlist WHERE imdb_id = ?');
const listStmt = db.prepare('SELECT * FROM watchlist ORDER BY added_at DESC');
const listByStatusStmt = db.prepare('SELECT * FROM watchlist WHERE status = ? ORDER BY added_at DESC');

function coerceRow(row: unknown): WatchlistRow | null {
  return (row ?? null) as WatchlistRow | null;
}

export function addMovie(input: AddMovieInput): { item: WatchlistRow | null; created: boolean } {
  const row = insertStmt.get(
    input as unknown as Record<string, SQLInputValue>,
  ) as unknown as { id: number } | undefined;
  if (row) return { item: coerceRow(getByIdStmt.get(row.id)), created: true };
  return { item: coerceRow(getByImdbStmt.get(input.imdb_id)), created: false };
}

export function getById(id: number): WatchlistRow | null {
  return coerceRow(getByIdStmt.get(id));
}

export function list(status?: WatchStatus): WatchlistRow[] {
  if (status) return listByStatusStmt.all(status) as unknown as WatchlistRow[];
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
    COALESCE(ROUND(AVG(CASE WHEN rating IS NOT NULL THEN rating END), 2), 0) AS avg_rating
  FROM watchlist
`);

export interface Stats {
  total: number;
  watched: number;
  watching: number;
  want: number;
  avg_rating: number;
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
