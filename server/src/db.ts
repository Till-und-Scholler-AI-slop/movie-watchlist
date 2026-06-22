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

export interface User {
  uid: string;
  username: string | null;
  email: string | null;
  name: string | null;
}

export interface WatchlistRow {
  id: number;
  user_id: string;
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

// --- Schema migration (idempotent) ---

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    uid         TEXT PRIMARY KEY,
    username    TEXT,
    email       TEXT,
    name        TEXT,
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

const wlCols = db.prepare("PRAGMA table_info(watchlist)").all() as { name: string }[];

if (wlCols.length > 0 && !wlCols.some((c) => c.name === 'media_type')) {
  // Ancient pre-media_type schema — drop and recreate (no production data survives this).
  db.exec('DROP TABLE watchlist');
  wlCols.length = 0;
}

if (wlCols.length === 0) {
  // Fresh install — create new schema with user_id.
  createWatchlistTable();
} else if (!wlCols.some((c) => c.name === 'user_id')) {
  // Legacy table without user_id — recreate with user_id, backfilling
  // existing rows to MIGRATE_LEGACY_OWNER_UID (or 'dev' in dev mode).
  const legacyUid = process.env.MIGRATE_LEGACY_OWNER_UID?.trim() || 'dev';
  // Exclude id (handled explicitly in INSERT) and user_id (added by migration).
  const srcCols = wlCols.map((c) => c.name).filter((n) => n !== 'user_id' && n !== 'id');
  db.exec('BEGIN');
  try {
    db.exec(`
      CREATE TABLE watchlist_new (
        id                  INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id             TEXT NOT NULL REFERENCES users(uid),
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
        UNIQUE (user_id, tmdb_id, media_type)
      )
    `);
    // Ensure the legacy owner row exists so the FK is satisfied.
    db.prepare('INSERT OR IGNORE INTO users (uid, username) VALUES (?, ?)').run(legacyUid, 'legacy-owner');
    // Copy existing columns (id + srcCols) with the legacy uid as user_id.
    const colList = srcCols.join(', ');
    const insertCols = colList ? `id, user_id, ${colList}` : 'id, user_id';
    const selectCols = colList ? `id, ?, ${colList}` : 'id, ?';
    db.prepare(`INSERT INTO watchlist_new (${insertCols}) SELECT ${selectCols} FROM watchlist`)
      .run(legacyUid);
    db.exec('DROP TABLE watchlist');
    db.exec('ALTER TABLE watchlist_new RENAME TO watchlist');
    db.exec('COMMIT');
  } catch (e) {
    db.exec('ROLLBACK');
    throw e;
  }
  console.log(`[db] migrated legacy watchlist rows to owner uid=${legacyUid}`);
}

function createWatchlistTable(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS watchlist (
      id                  INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id             TEXT NOT NULL REFERENCES users(uid),
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
      UNIQUE (user_id, tmdb_id, media_type)
    )
  `);
}

createWatchlistTable();
db.exec('CREATE INDEX IF NOT EXISTS idx_watchlist_user ON watchlist(user_id)');
db.exec('CREATE INDEX IF NOT EXISTS idx_watchlist_status ON watchlist(status)');
db.exec('CREATE INDEX IF NOT EXISTS idx_watchlist_media ON watchlist(media_type)');
db.exec('CREATE INDEX IF NOT EXISTS idx_watchlist_added ON watchlist(added_at)');

db.exec(`
  CREATE TABLE IF NOT EXISTS follows (
    follower_id  TEXT NOT NULL REFERENCES users(uid),
    followee_id  TEXT NOT NULL REFERENCES users(uid),
    created_at   TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (follower_id, followee_id),
    CHECK (follower_id != followee_id)
  )
`);
db.exec('CREATE INDEX IF NOT EXISTS idx_follows_followee ON follows(followee_id)');

// --- Users ---

const upsertUserStmt = db.prepare(`
  INSERT INTO users (uid, username, email, name) VALUES (@uid, @username, @email, @name)
  ON CONFLICT(uid) DO UPDATE SET
    username = excluded.username,
    email    = excluded.email,
    name     = excluded.name
`);

export function upsertUser(u: User): void {
  upsertUserStmt.run(u as unknown as Record<string, SQLInputValue>);
}

// --- Watchlist ---

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
    user_id, tmdb_id, media_type, title, original_title, year, poster_path, backdrop_path,
    genre, director, plot, tagline, runtime, tmdb_rating, imdb_id,
    number_of_seasons, number_of_episodes
  )
  VALUES (
    @user_id, @tmdb_id, @media_type, @title, @original_title, @year, @poster_path, @backdrop_path,
    @genre, @director, @plot, @tagline, @runtime, @tmdb_rating, @imdb_id,
    @number_of_seasons, @number_of_episodes
  )
  ON CONFLICT(user_id, tmdb_id, media_type) DO NOTHING
  RETURNING id
`);

const getByIdStmt = db.prepare('SELECT * FROM watchlist WHERE id = ? AND user_id = ?');
const getByTmdbStmt = db.prepare('SELECT * FROM watchlist WHERE user_id = ? AND tmdb_id = ? AND media_type = ?');
const listStmt = db.prepare('SELECT * FROM watchlist WHERE user_id = ? ORDER BY added_at DESC');
const listByStatusStmt = db.prepare('SELECT * FROM watchlist WHERE user_id = ? AND status = ? ORDER BY added_at DESC');
const listByMediaTypeStmt = db.prepare('SELECT * FROM watchlist WHERE user_id = ? AND media_type = ? ORDER BY added_at DESC');
const listByStatusAndMediaTypeStmt = db.prepare(
  'SELECT * FROM watchlist WHERE user_id = ? AND status = ? AND media_type = ? ORDER BY added_at DESC',
);

function coerceRow(row: unknown): WatchlistRow | null {
  return (row ?? null) as WatchlistRow | null;
}

export function addTitle(userId: string, input: AddTitleInput): { item: WatchlistRow | null; created: boolean } {
  const row = insertStmt.get(
    { ...input, user_id: userId } as unknown as Record<string, SQLInputValue>,
  ) as unknown as { id: number } | undefined;
  if (row) return { item: coerceRow(getByIdStmt.get(row.id, userId)), created: true };
  return {
    item: coerceRow(getByTmdbStmt.get(userId, input.tmdb_id, input.media_type)),
    created: false,
  };
}

export function getById(userId: string, id: number): WatchlistRow | null {
  return coerceRow(getByIdStmt.get(id, userId));
}

export function getByTmdbId(userId: string, tmdbId: number, mediaType: MediaType): WatchlistRow | null {
  return coerceRow(getByTmdbStmt.get(userId, tmdbId, mediaType));
}

export function list(
  userId: string,
  status?: WatchStatus,
  mediaType?: MediaType,
): WatchlistRow[] {
  if (status && mediaType) {
    return listByStatusAndMediaTypeStmt.all(userId, status, mediaType) as unknown as WatchlistRow[];
  }
  if (status) return listByStatusStmt.all(userId, status) as unknown as WatchlistRow[];
  if (mediaType) return listByMediaTypeStmt.all(userId, mediaType) as unknown as WatchlistRow[];
  return listStmt.all(userId) as unknown as WatchlistRow[];
}

const updateStmt = db.prepare(`
  UPDATE watchlist
  SET status = @status,
      rating = @rating,
      notes = @notes,
      watched_at = @watched_at
  WHERE id = @id AND user_id = @user_id
`);

export interface UpdateInput {
  user_id: string;
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

const deleteStmt = db.prepare('DELETE FROM watchlist WHERE id = ? AND user_id = ?');

export function removeEntry(userId: string, id: number): boolean {
  return deleteStmt.run(id, userId).changes > 0;
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
  WHERE user_id = ?
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

export function stats(userId: string): Stats {
  return statsStmt.get(userId) as unknown as Stats;
}

const genreStatsStmt = db.prepare(`
  SELECT genre AS name, COUNT(*) AS count
  FROM watchlist
  WHERE user_id = ? AND genre IS NOT NULL AND genre != '' AND status = 'watched'
  GROUP BY genre
  ORDER BY count DESC
  LIMIT 10
`);

export interface GenreStat {
  name: string;
  count: number;
}

export function genreStats(userId: string): GenreStat[] {
  const rows = genreStatsStmt.all(userId) as unknown as { name: string; count: number }[];
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

// --- Follows ---

export interface FollowRow {
  uid: string;
  username: string | null;
  email: string | null;
  name: string | null;
  followed_at: string;
}

const followInsertStmt = db.prepare(`
  INSERT INTO follows (follower_id, followee_id) VALUES (?, ?)
  ON CONFLICT(follower_id, followee_id) DO NOTHING
`);

export function followUser(followerUid: string, followeeUid: string): boolean {
  const res = followInsertStmt.run(followerUid, followeeUid);
  return res.changes > 0;
}

const followDeleteStmt = db.prepare(
  'DELETE FROM follows WHERE follower_id = ? AND followee_id = ?',
);

export function unfollowUser(followerUid: string, followeeUid: string): boolean {
  return followDeleteStmt.run(followerUid, followeeUid).changes > 0;
}

const isFollowingStmt = db.prepare(
  'SELECT 1 FROM follows WHERE follower_id = ? AND followee_id = ?',
);

export function isFollowing(followerUid: string, followeeUid: string): boolean {
  return isFollowingStmt.get(followerUid, followeeUid) !== undefined;
}

const listFollowsStmt = db.prepare(`
  SELECT u.uid, u.username, u.email, u.name, f.created_at AS followed_at
  FROM follows f JOIN users u ON u.uid = f.followee_id
  WHERE f.follower_id = ?
  ORDER BY f.created_at DESC
`);

export function listFollows(followerUid: string): FollowRow[] {
  return listFollowsStmt.all(followerUid) as unknown as FollowRow[];
}

const findUserStmt = db.prepare(`
  SELECT uid, username, email, name FROM users
  WHERE uid = ? OR username = ? COLLATE NOCASE
  LIMIT 1
`);

export function findUserByUsernameOrUid(query: string): User | null {
  const q = query.trim();
  if (!q) return null;
  return (findUserStmt.get(q, q) ?? null) as User | null;
}

export interface FollowedWatchlistItem {
  id: number;
  tmdb_id: number;
  media_type: MediaType;
  title: string;
  original_title: string | null;
  year: string | null;
  poster_path: string | null;
  genre: string | null;
  director: string | null;
  plot: string | null;
  tagline: string | null;
  runtime: number | null;
  tmdb_rating: number | null;
  number_of_seasons: number | null;
  number_of_episodes: number | null;
  status: WatchStatus;
  rating: number | null;
  added_at: string;
  watched_at: string | null;
}

const followedWatchlistStmt = db.prepare(`
  SELECT id, tmdb_id, media_type, title, original_title, year, poster_path,
    genre, director, plot, tagline, runtime, tmdb_rating,
    number_of_seasons, number_of_episodes, status, rating, added_at, watched_at
  FROM watchlist
  WHERE user_id = ?
  ORDER BY added_at DESC
`);

export function getFollowedWatchlist(followeeUid: string): FollowedWatchlistItem[] {
  return followedWatchlistStmt.all(followeeUid) as unknown as FollowedWatchlistItem[];
}

export interface SharedWatchlistItem {
  tmdb_id: number;
  media_type: MediaType;
  title: string;
  original_title: string | null;
  year: string | null;
  poster_path: string | null;
  genre: string | null;
  director: string | null;
  plot: string | null;
  tagline: string | null;
  runtime: number | null;
  tmdb_rating: number | null;
  number_of_seasons: number | null;
  number_of_episodes: number | null;
  my_status: WatchStatus;
  my_rating: number | null;
  their_status: WatchStatus;
  their_rating: number | null;
}

const sharedWatchlistStmt = db.prepare(`
  SELECT
    a.tmdb_id, a.media_type, a.title, a.original_title, a.year, a.poster_path,
    a.genre, a.director, a.plot, a.tagline, a.runtime, a.tmdb_rating,
    a.number_of_seasons, a.number_of_episodes,
    a.status AS my_status, a.rating AS my_rating,
    b.status AS their_status, b.rating AS their_rating
  FROM watchlist a
  JOIN watchlist b
    ON b.tmdb_id = a.tmdb_id AND b.media_type = a.media_type AND b.user_id = ?
  WHERE a.user_id = ?
  ORDER BY a.added_at DESC
`);

export function getSharedWatchlist(
  myUid: string,
  theirUid: string,
): SharedWatchlistItem[] {
  return sharedWatchlistStmt.all(theirUid, myUid) as unknown as SharedWatchlistItem[];
}
