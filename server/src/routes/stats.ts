import { Router } from 'express';
import { stats, genreStats } from '../db.js';

export const statsRouter = Router();

statsRouter.get('/', (req, res) => {
  res.json({
    summary: stats(req.user!.uid),
    genres: genreStats(req.user!.uid),
  });
});
