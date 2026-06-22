import { Router } from 'express';
import {
  followUser,
  unfollowUser,
  listFollows,
  getFollow,
  isFollowing,
  findUserByUsernameOrUid,
  getFollowedWatchlist,
  getSharedWatchlist,
  type FollowedWatchlistItem,
  type SharedWatchlistItem,
} from '../db.js';

export const followsRouter = Router();

followsRouter.get('/', (req, res) => {
  res.json({ follows: listFollows(req.user!.uid) });
});

followsRouter.post('/', (req, res) => {
  const query = String(req.body?.query ?? '').trim();
  if (!query) return res.status(400).json({ error: 'query (username or uid) is required' });

  const target = findUserByUsernameOrUid(query);
  if (!target) return res.status(404).json({ error: 'Kein User mit diesem Username/UID gefunden' });

  if (target.uid === req.user!.uid) {
    return res.status(400).json({ error: 'Du kannst dir nicht selbst folgen' });
  }

  const created = followUser(req.user!.uid, target.uid);
  if (!created) {
    // Already follows — return the existing follow projection for consistency.
    const existing = getFollow(req.user!.uid, target.uid);
    return res.status(409).json({ error: 'Du folgst diesem User bereits', user: existing ?? target });
  }
  // Return the freshly created follow row (includes followed_at).
  const row = getFollow(req.user!.uid, target.uid);
  res.status(201).json({ user: row ?? target });
});

followsRouter.delete('/:followeeUid', (req, res) => {
  const followeeUid = req.params.followeeUid;
  if (!followeeUid) return res.status(400).json({ error: 'followeeUid is required' });
  const ok = unfollowUser(req.user!.uid, followeeUid);
  if (!ok) return res.status(404).json({ error: 'Du folgst diesem User nicht' });
  res.status(204).end();
});

followsRouter.get('/:followeeUid/watchlist', (req, res) => {
  const followeeUid = req.params.followeeUid;
  if (!followeeUid) return res.status(400).json({ error: 'followeeUid is required' });
  if (!isFollowing(req.user!.uid, followeeUid)) {
    return res.status(403).json({ error: 'Du folgst diesem User nicht' });
  }
  const items = getFollowedWatchlist(followeeUid);
  res.json({ items });
});

followsRouter.get('/:followeeUid/shared', (req, res) => {
  const followeeUid = req.params.followeeUid;
  if (!followeeUid) return res.status(400).json({ error: 'followeeUid is required' });
  if (!isFollowing(req.user!.uid, followeeUid)) {
    return res.status(403).json({ error: 'Du folgst diesem User nicht' });
  }
  const items = getSharedWatchlist(req.user!.uid, followeeUid);
  res.json({ items });
});

export type { FollowedWatchlistItem, SharedWatchlistItem };
