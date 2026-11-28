import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { AdminSession } from '../models/index.js';
import { isAdminDeviceAuthorized } from './admin-device.service.js';
import { signToken } from './token.service.js';

function hashSessionId(sessionId) {
  return crypto.createHash('sha256').update(sessionId).digest('hex');
}

export async function createAdminSession(username, deviceId) {
  const sessionId = crypto.randomBytes(32).toString('base64url');
  const token = signToken({ id: 'env-admin', role: 'admin', username, sid: sessionId, deviceId: String(deviceId) });
  const claims = jwt.decode(token);

  if (!claims?.exp) throw new Error('Admin session token is missing an expiration');

  await AdminSession.create({
    sessionIdHash: hashSessionId(sessionId),
    deviceId,
    username,
    expiresAt: new Date(claims.exp * 1000)
  });

  return token;
}

export async function isAdminSessionActive({ sessionId, deviceId, deviceToken, userAgent }) {
  if (typeof sessionId !== 'string' || sessionId.length < 32 || sessionId.length > 128) return false;

  const session = await AdminSession.findOne({
    sessionIdHash: hashSessionId(sessionId),
    revokedAt: null,
    expiresAt: { $gt: new Date() }
  }).select('deviceId').lean();

  if (!session || String(session.deviceId) !== String(deviceId)) return false;
  return isAdminDeviceAuthorized({ deviceId: session.deviceId, deviceToken, userAgent });
}

export async function revokeAdminSession(sessionId) {
  if (typeof sessionId !== 'string' || sessionId.length < 32 || sessionId.length > 128) return false;

  const result = await AdminSession.updateOne(
    { sessionIdHash: hashSessionId(sessionId), revokedAt: null },
    { $set: { revokedAt: new Date() } }
  );

  return result.modifiedCount > 0;
}
