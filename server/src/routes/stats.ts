import { Router } from 'express';
import { stats, genreStats } from '../db.js';

export const statsRouter = Router();

statsRouter.get('/', (_req, res) => {
  res.json({
    summary: stats(),
    genres: genreStats(),
  });
});
