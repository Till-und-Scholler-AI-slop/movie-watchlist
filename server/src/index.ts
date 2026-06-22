import express from 'express';
import cors from 'cors';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import 'dotenv/config';

import { searchRouter } from './routes/search.js';
import { watchlistRouter } from './routes/watchlist.js';
import { statsRouter } from './routes/stats.js';
import { authMiddleware } from './auth.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = parseInt(process.env.PORT ?? '8787', 10);

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ ok: true }));

// Auth: gates everything except /api/health. In dev mode (no TRUST_AUTHENTIK_HEADERS),
// a fixed local user is used. Behind Authentik+nginx, X-authentik-* headers are trusted.
app.use('/api', authMiddleware);
app.get('/api/me', (req, res) => res.json(req.user));

app.use('/api/search', searchRouter);
app.use('/api/watchlist', watchlistRouter);
app.use('/api/stats', statsRouter);

// Serve the built client in production. Paths cover both dev workspace
// layout (../client/dist) and the Docker layout (../public).
const clientDirs = [
  join(__dirname, '..', 'public'),
  join(__dirname, '..', 'client', 'dist'),
];
const clientDir = clientDirs.find((d) => existsSync(d));

if (clientDir) {
  app.use(express.static(clientDir));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    res.sendFile(join(clientDir, 'index.html'));
  });
} else {
  app.get('/', (_req, res) => {
    res.json({
      message: 'Movie-Watchlist API running. Build the client to serve the UI.',
      api: ['/api/health', '/api/search', '/api/watchlist', '/api/stats'],
    });
  });
}

app.listen(PORT, () => {
  console.log(`Movie-Watchlist server listening on http://localhost:${PORT}`);
  if (!clientDir) console.log('  (no client build found — serving API only)');
});
