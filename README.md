# Movie Watchlist

A self-hosted app to search for movies (via TMDB), build a watchlist, rate them,
take notes, and track stats. Full-stack: React + Vite + Tailwind on the front,
Express + SQLite (Node's built-in `node:sqlite`) on the back, shipped as a single Docker image.

The UI is in German. Search matches **both German and English titles simultaneously**
(e.g. "Herr der Ringe" and "Lord of the Rings" find the same film) via parallel
`de-DE` and `en-US` TMDB queries that are merged and de-duplicated.

## Features

- **Search** movies via TMDB with dual-language matching (German + English).
  German title shown primary, original title secondary (italic, gray).
- **Watchlist** with three statuses: _will sehen_, _am schauen_, _gesehen_.
- **Rate** movies 1-5 stars and add personal notes.
- **Filter** the list by status.
- **Stats dashboard**: totals, average rating, top genres (watched).
- **Persistent**: everything stored in SQLite on disk.
- **Single container**: serves the API and the built UI on one port.
- **Demo catalog**: 30 curated films with German titles and TMDB metadata
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

| Method  | Path                     | Description                                    |
| ------- | ------------------------ | ---------------------------------------------- |
| GET     | `/api/health`            | Health check                                   |
| GET     | `/api/search?q=&page=`   | Search TMDB (dual de-DE + en-US, merged)       |
| GET     | `/api/search/:tmdbId`    | Get full movie details from TMDB               |
| GET     | `/api/watchlist?status=` | List entries (optional status filter)          |
| POST    | `/api/watchlist`         | Add a movie by `tmdb_id`                       |
| PATCH   | `/api/watchlist/:id`     | Update status / rating / notes                 |
| DELETE  | `/api/watchlist/:id`     | Remove an entry                                |
| GET     | `/api/stats`             | Summary + genre breakdown                      |

## Project layout

```
.
├── server/            Express + node:sqlite (TypeScript)
│   ├── src/
│   │   ├── index.ts       app entry, serves API + static UI
│   │   ├── db.ts          schema + queries (node:sqlite)
│   │   ├── tmdb.ts        TMDB client + dual-language search + fallback catalog
│   │   └── routes/        search, watchlist, stats
│   └── data/              SQLite file (runtime, gitignored)
├── client/            React + Vite + Tailwind (TypeScript)
│   └── src/
│       ├── App.tsx        views: search / watchlist / stats
│       ├── api.ts         typed fetch wrapper + TMDB image URL helper
│       ├── types.ts       shared types
│       └── components/    Stars, Poster, cards, modal, stats
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
requests (one for `de-DE`, one for `en-US`) that are merged — well within the
limit. Adding a movie triggers one detail request; all metadata is then cached
in SQLite so subsequent views hit the local DB, not TMDB.
