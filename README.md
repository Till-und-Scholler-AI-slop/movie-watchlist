# Movie Watchlist

A self-hosted app to search for movies (via OMDb), build a watchlist, rate them,
take notes, and track stats. Full-stack: React + Vite + Tailwind on the front,
Express + SQLite (Node's built-in `node:sqlite`) on the back, shipped as a single Docker image.

## Features

- **Search** movies via the OMDb API (with a built-in demo catalog when no API key is set).
- **Watchlist** with three statuses: _want to watch_, _watching_, _watched_.
- **Rate** movies 1-5 stars and add personal notes.
- **Filter** the list by status; **sort** by date added.
- **Stats dashboard**: totals, average rating, top genres (watched).
- **Persistent**: everything stored in SQLite on disk.
- **Single container**: serves the API and the built UI on one port.

## Quick start (Docker, for your VPS)

1. Get a free OMDb API key at <https://www.omdbapi.com/apikey.aspx> (optional but recommended).
2. Copy `.env.example` to `.env` and fill in your key:
   ```
   OMDB_API_KEY=your_key_here
   PORT=8787
   ```
3. Build and run:
   ```
   docker compose up -d --build
   ```
4. Open `http://YOUR_VPS_IP:8787`.

The SQLite database lives in a named Docker volume (`watchlist-data`) so it survives restarts/redeploys.

> Without an `OMDB_API_KEY`, search falls back to a small built-in catalog so the UI is still usable. Set a key to search all of OMDb.

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

| Method  | Path                     | Description                          |
| ------- | ------------------------ | ------------------------------------ |
| GET     | `/api/health`            | Health check                         |
| GET     | `/api/search?q=&page=`   | Search OMDb                          |
| GET     | `/api/search/:imdbID`    | Get full movie details from OMDb     |
| GET     | `/api/watchlist?status=` | List entries (optional status filter)|
| POST    | `/api/watchlist`         | Add a movie by `imdb_id`             |
| PATCH   | `/api/watchlist/:id`     | Update status / rating / notes       |
| DELETE  | `/api/watchlist/:id`     | Remove an entry                      |
| GET     | `/api/stats`             | Summary + genre breakdown            |

## Project layout

```
.
├── server/            Express + node:sqlite (TypeScript)
│   ├── src/
│   │   ├── index.ts       app entry, serves API + static UI
│   │   ├── db.ts          schema + queries (node:sqlite)
│   │   ├── omdb.ts        OMDb client + fallback catalog
│   │   └── routes/        search, watchlist, stats
│   └── data/              SQLite file (runtime, gitignored)
├── client/            React + Vite + Tailwind (TypeScript)
│   └── src/
│       ├── App.tsx        views: search / watchlist / stats
│       ├── api.ts         typed fetch wrapper
│       ├── types.ts       shared types
│       └── components/    Stars, Poster, cards, modal, stats
├── Dockerfile         multi-stage build -> single slim image
├── docker-compose.yml one service + persistent volume
└── .env.example       OMDB_API_KEY + PORT
```

## Tech

- **Frontend**: React 18, Vite 6, TypeScript, Tailwind CSS v4
- **Backend**: Express 4, Node built-in `node:sqlite`, TypeScript (tsx for dev)
- **Data**: OMDb API + local SQLite (WAL mode)
- **Deploy**: Docker (node:24-slim)
