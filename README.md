# Movie & Series Watchlist

A self-hosted app to search for **movies and TV shows** (via TMDB), build a
watchlist, rate them, take notes, and track stats. Full-stack: React + Vite +
Tailwind on the front, Express + SQLite (Node's built-in `node:sqlite`) on the
back, shipped as a single Docker image.

The UI is in German. Search matches **both German and English titles simultaneously**
(e.g. "Herr der Ringe" and "Lord of the Rings" find the same film) via parallel
`de-DE` and `en-US` TMDB `/search/multi` queries that are merged and de-duplicated.

## Features

- **Search** movies and TV shows via TMDB `/search/multi` (dual-language matching).
  German title shown primary, original title secondary (italic, gray).
  Film/Serie badge on every card.
- **Watchlist** with three statuses: _will sehen_, _am schauen_, _gesehen_.
- **Filter** the list by media type (Alle / Filme / Serien) **and** by status
  — both combinable.
- **Rate** titles 1-5 stars and add personal notes.
- **Stats dashboard**: totals, average rating, breakdown by media type,
  top genres (watched).
- **TV-aware cards**: shows display "X Staffeln · Y Episoden" instead of runtime;
  creator(s) shown instead of director.
- **Persistent**: everything stored in SQLite on disk.
- **Single container**: serves the API and the built UI on one port.
- **Demo catalog**: 30 films + 8 TV shows with German titles and TMDB metadata
  work out-of-the-box without an API key.

## Quick start (Docker, for your VPS)

1. Get a free TMDB API key at <https://www.themoviedb.org/settings/api>
   (optional but recommended for full search).
2. Copy `.env.example` to `.env` and fill in your key:
   ```
   TMDB_API_KEY=your_key_here
   PORT=8787
   ```
3. Build and run:
   ```
   docker compose up -d --build
   ```
4. Open `http://YOUR_VPS_IP:8787`.

The SQLite database lives in a named Docker volume (`watchlist-data`) so it survives restarts/redeploys.

> Without a `TMDB_API_KEY`, search falls back to a small built-in catalog so the UI is still usable. Set a key to search all of TMDB.

## Local development

Requires Node 20+ and npm 10+.

```
npm install
npm run dev
```

- Client: <http://localhost:5173>
- Server API: <http://localhost:8787>

The Vite dev server proxies `/api/*` to the backend.

## Scripts

| Command            | What it does                                   |
| ------------------ | ---------------------------------------------- |
| `npm run dev`      | Run client + server concurrently (hot reload)  |
| `npm run build`    | Type-check and build both client and server    |
| `npm start`        | Run the built server (serves UI + API)         |
| `npm run typecheck`| Type-check both workspaces                     |
| `npm run db:reset` | Delete the local SQLite database file          |

## API

| Method  | Path                              | Description                                          |
| ------- | --------------------------------- | ---------------------------------------------------- |
| GET     | `/api/health`                     | Health check (no auth)                               |
| GET     | `/api/me`                         | Current user (uid, username, email, name)            |
| GET     | `/api/search?q=&page=`            | Search TMDB multi (movies + TV, dual de-DE + en-US) |
| GET     | `/api/search/:tmdbId?type=movie\|tv` | Get full title details from TMDB                  |
| GET     | `/api/watchlist?status=&media_type=` | List entries (optional status + media_type filter) |
| POST    | `/api/watchlist`                  | Add a title by `tmdb_id` + `media_type`              |
| PATCH   | `/api/watchlist/:id`              | Update status / rating / notes                       |
| DELETE  | `/api/watchlist/:id`              | Remove an entry                                      |
| GET     | `/api/stats`                      | Summary (incl. movies/shows split) + genre breakdown |

## Project layout

```
.
├── server/            Express + node:sqlite (TypeScript)
│   ├── src/
│   │   ├── index.ts       app entry, serves API + static UI
│   │   ├── db.ts          schema + queries (node:sqlite); UNIQUE(tmdb_id, media_type)
│   │   ├── tmdb.ts        TMDB multi-search + movie/tv detail branching + fallback catalog
│   │   └── routes/        search, watchlist, stats
│   └── data/              SQLite file (runtime, gitignored)
├── client/            React + Vite + Tailwind (TypeScript)
│   └── src/
│       ├── App.tsx        views: search / watchlist / stats; dual filter (media + status)
│       ├── api.ts         typed fetch wrapper + TMDB image URL helper
│       ├── types.ts       shared types (SearchTitle, WatchlistItem with media_type)
│       └── components/    Stars, Poster, cards, modal, stats, MediaTypeBadge
├── Dockerfile         multi-stage build -> single slim image
├── docker-compose.yml one service + persistent volume
└── .env.example       TMDB_API_KEY + PORT
```

## Tech

- **Frontend**: React 18, Vite 6, TypeScript, Tailwind CSS v4
- **Backend**: Express 4, Node built-in `node:sqlite`, TypeScript (tsx for dev)
- **Data**: TMDB API + local SQLite (WAL mode)
- **Deploy**: Docker (node:24-slim)

## TMDB rate limits

TMDB allows roughly 40 requests per second. Each search triggers two parallel
requests (one for `de-DE`, one for `en-US`) to `/search/multi` that are merged —
well within the limit. Adding a title triggers one detail request (`/movie/{id}`
or `/tv/{id}`); all metadata is then cached in SQLite so subsequent views hit
the local DB, not TMDB.

## Multi-User & Authentik

The app supports per-user watchlists. Each user's entries are isolated by
`user_id` in the database (`UNIQUE(user_id, tmdb_id, media_type)`).

### Dev mode (default)

Without any extra config, the app uses a fixed local user (`uid="dev"`).
This keeps local development single-user — no Authentik, no nginx needed.

### Production (behind Authentik + nginx)

Set `TRUST_AUTHENTIK_HEADERS=1` in `.env`. The reverse proxy (nginx with
Authentik forward-auth) injects `X-authentik-uid`, `X-authentik-username`,
`X-authentik-email`, and `X-authentik-name` headers on every authenticated
request. The app upserts a `users` row on first sight and scopes all
watchlist queries to that user.

**The `X-authentik-*` headers are only trustworthy because:**
1. nginx sets them from the `auth_request` subrequest (not from the client).
2. The app port is bound to `127.0.0.1` (never public) — clients cannot
   bypass the proxy.

### One-time migration of existing data

If upgrading an existing single-user instance, set `MIGRATE_LEGACY_OWNER_UID`
to the Authentik uid that should own the pre-existing rows. On next boot the
schema is migrated (table recreated, rows backfilled). Leave empty in dev.

### Two rules for contributors

> **Never remove `user_id` scoping from queries.** Every `watchlist` query
> must filter by `user_id`. Without it, all users share one bucket and the
> production instance corrupts.

> **Never bind the port publicly in `docker-compose.yml`.** The upstream
> compose uses `"8787:8787"` (public) — the production deploy script rewrites
> this to `"127.0.0.1:8787:8787"` on every pull. If you change the upstream
> format, the deploy aborts (safety). Keep the public binding in the repo
> (it's the upstream default); the deploy handles the patch.

### Env vars

| Var | Default | Purpose |
| --- | ------- | ------- |
| `TRUST_AUTHENTIK_HEADERS` | _(empty)_ | Set to `1` to trust `X-authentik-*` headers. |
| `MIGRATE_LEGACY_OWNER_UID` | _(empty)_ | One-time: assign existing rows to this uid. |

### Schema changes

Schema migrations run automatically on container boot (idempotent). The
production deploy is auto via cron-pull + `docker compose up -d --build`, so
any merged change goes live within ~5 min. **If a migration is risky or
non-idempotent, discuss in the PR first.**

## Notes on TMDB movie/TV id spaces

TMDB movie IDs and TV IDs are **separate namespaces** — the same number can
refer to a movie and to a TV show. The schema therefore uses a composite unique
constraint `UNIQUE(tmdb_id, media_type)` so the same ID can exist once as a
movie and once as a TV show without conflict.
