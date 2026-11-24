import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { AdminSession } from '../models/index.js';
import { signToken } from './token.service.js';

function hashSessionId(sessionId) {
  return crypto.createHash('sha256').update(sessionId).digest('hex');
}

export async function createAdminSession(username) {
  const sessionId = crypto.randomBytes(32).toString('base64url');
  const token = signToken({ id: 'env-admin', role: 'admin', username, sid: sessionId });
  const claims = jwt.decode(token);

  if (!claims?.exp) throw new Error('Admin session token is missing an expiration');

  await AdminSession.create({
    sessionIdHash: hashSessionId(sessionId),
    username,
    expiresAt: new Date(claims.exp * 1000)
  });

  return token;
}

export async function isAdminSessionActive(sessionId) {
  if (typeof sessionId !== 'string' || sessionId.length < 32 || sessionId.length > 128) return false;

  return Boolean(await AdminSession.exists({
    sessionIdHash: hashSessionId(sessionId),
    revokedAt: null,
    expiresAt: { $gt: new Date() }
  }));
}

export async function revokeAdminSession(sessionId) {
  if (typeof sessionId !== 'string' || sessionId.length < 32 || sessionId.length > 128) return false;

  const result = await AdminSession.updateOne(
    { sessionIdHash: hashSessionId(sessionId), revokedAt: null },
    { $set: { revokedAt: new Date() } }
  );

  return result.modifiedCount > 0;
}
