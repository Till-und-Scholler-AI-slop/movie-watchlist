import type { Request, Response, NextFunction } from 'express';
import { upsertUser, type User } from './db.js';

// Augment Express's Request with the `user` field set by authMiddleware.
declare module 'express-serve-static-core' {
  interface Request {
    user?: User;
  }
}

// Trust mode: only trust X-authentik-* headers when explicitly enabled.
// In dev mode (no flag), a fixed local user is used so the app stays single-user.
const TRUST = process.env.TRUST_AUTHENTIK_HEADERS === '1';

// Optional shared secret: if set (and TRUST=1), nginx must forward the same
// value in X-Authentik-Secret. Defense-in-depth against header spoofing if the
// port is ever accidentally exposed. Leave empty to disable the check.
const SHARED_SECRET = process.env.AUTHENTIK_SHARED_SECRET || '';

const DEV_USER: User = { uid: 'dev', username: 'local', email: null, name: null };

function userFromHeaders(req: Request): User | null {
  const uid = req.get('X-authentik-uid');
  if (!uid) return null;
  return {
    uid,
    username: req.get('X-authentik-username') || null,
    email: req.get('X-authentik-email') || null,
    name: req.get('X-authentik-name') || null,
  };
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (!TRUST) {
    upsertUser(DEV_USER);
    req.user = DEV_USER;
    return next();
  }
  if (SHARED_SECRET && req.get('X-Authentik-Secret') !== SHARED_SECRET) {
    res.status(401).json({ error: 'Invalid or missing X-Authentik-Secret header' });
    return;
  }
  const user = userFromHeaders(req);
  if (!user) {
    res.status(401).json({ error: 'TRUST_AUTHENTIK_HEADERS=1 but no X-authentik-uid header — check nginx auth_request config' });
    return;
  }
  upsertUser(user);
  req.user = user;
  next();
}
