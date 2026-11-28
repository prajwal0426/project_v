import crypto from 'node:crypto';
import mongoose from 'mongoose';
import { AdminDevice, AdminSecurityEvent, AdminSession } from '../models/index.js';

export const ADMIN_DEVICE_LIMIT = 3;
export const ADMIN_DEVICE_LIMIT_MESSAGE = 'Maximum authorized devices reached. Your Admin account is registered on 3 devices. Remove an existing device to authorize this device.';

const ADMIN_KEY = 'env-admin';
const DEVICE_TOKEN_BYTES = 32;
const LAST_ACTIVE_REFRESH_MS = 5 * 60 * 1000;
let indexesReady;

export class AdminDeviceLimitError extends Error {
  constructor() {
    super(ADMIN_DEVICE_LIMIT_MESSAGE);
    this.name = 'AdminDeviceLimitError';
    this.code = 'ADMIN_DEVICE_LIMIT_REACHED';
    this.status = 403;
  }
}

export function createAdminDeviceToken() {
  return crypto.randomBytes(DEVICE_TOKEN_BYTES).toString('base64url');
}

export function hashAdminDeviceToken(token) {
  return crypto.createHash('sha256').update(String(token)).digest('hex');
}

export function hashAdminUserAgent(userAgent = '') {
  return crypto.createHash('sha256').update(String(userAgent)).digest('hex');
}

export function describeAdminDevice(userAgent = '') {
  const ua = String(userAgent);
  const browser = [
    [/Edg\//i, 'Microsoft Edge'],
    [/OPR\//i, 'Opera'],
    [/Firefox\//i, 'Firefox'],
    [/Chrome\//i, 'Chrome'],
    [/Safari\//i, 'Safari']
  ].find(([pattern]) => pattern.test(ua))?.[1] || 'Unknown browser';
  const operatingSystem = [
    [/Windows/i, 'Windows'],
    [/Android/i, 'Android'],
    [/(iPhone|iPad|iPod)/i, 'iOS'],
    [/(Macintosh|Mac OS X)/i, 'macOS'],
    [/Linux/i, 'Linux']
  ].find(([pattern]) => pattern.test(ua))?.[1] || 'Unknown operating system';

  return { browser, operatingSystem, name: `${operatingSystem} · ${browser}` };
}

function isDuplicateKey(error) {
  return error?.code === 11000;
}

export async function reserveAdminDeviceSlot(createAtSlot) {
  for (let slot = 0; slot < ADMIN_DEVICE_LIMIT; slot += 1) {
    try {
      return await createAtSlot(slot);
    } catch (error) {
      if (!isDuplicateKey(error)) throw error;
    }
  }

  throw new AdminDeviceLimitError();
}

async function ensureDeviceIndexes() {
  if (!indexesReady) {
    indexesReady = AdminDevice.createIndexes().catch((error) => {
      indexesReady = null;
      throw error;
    });
  }
  await indexesReady;
}

function deviceEvent({ adminId, type, device, message }) {
  return AdminSecurityEvent.create({
    adminId,
    type,
    deviceId: device?._id,
    deviceName: device?.name,
    browser: device?.browser,
    operatingSystem: device?.operatingSystem,
    message
  });
}

export async function registerOrAuthorizeAdminDevice({ deviceToken, username, userAgent }) {
  await ensureDeviceIndexes();

  const now = new Date();
  const userAgentHash = hashAdminUserAgent(userAgent);
  const details = describeAdminDevice(userAgent);
  const existing = typeof deviceToken === 'string' && deviceToken.length >= 32 && deviceToken.length <= 128
    ? await AdminDevice.findOne({ deviceTokenHash: hashAdminDeviceToken(deviceToken) }).lean()
    : null;

  if (existing?.status === 'active' && existing.adminKey === ADMIN_KEY) {
    await AdminDevice.updateOne(
      { _id: existing._id, status: 'active' },
      { $set: { ...details, userAgentHash, lastActiveAt: now } }
    );
    return {
      device: { ...existing, ...details, lastActiveAt: now },
      deviceToken,
      newlyRegistered: false
    };
  }

  const newDeviceToken = createAdminDeviceToken();
  const newDevice = await reserveAdminDeviceSlot((slot) => AdminDevice.create({
    adminKey: ADMIN_KEY,
    slot,
    deviceTokenHash: hashAdminDeviceToken(newDeviceToken),
    userAgentHash,
    ...details,
    status: 'active',
    registeredAt: now,
    lastActiveAt: now
  }));

  try {
    await deviceEvent({
      adminId: username,
      type: 'device_registered',
      device: newDevice,
      message: `New Admin device authorized: ${newDevice.name}.`
    });
  } catch (error) {
    await AdminDevice.updateOne(
      { _id: newDevice._id, status: 'active' },
      { $set: { status: 'revoked', revokedAt: new Date(), revokedBy: 'system' } }
    );
    throw error;
  }

  return { device: newDevice, deviceToken: newDeviceToken, newlyRegistered: true };
}

export async function isAdminDeviceAuthorized({ deviceId, deviceToken, userAgent }) {
  if (!mongoose.isValidObjectId(deviceId) || typeof deviceToken !== 'string' || deviceToken.length < 32 || deviceToken.length > 128) {
    return false;
  }

  const device = await AdminDevice.findOne({
    _id: deviceId,
    adminKey: ADMIN_KEY,
    status: 'active',
    deviceTokenHash: hashAdminDeviceToken(deviceToken),
    userAgentHash: hashAdminUserAgent(userAgent)
  }).select('lastActiveAt').lean();

  if (!device) return false;
  const now = new Date();
  if (!device.lastActiveAt || now.getTime() - new Date(device.lastActiveAt).getTime() >= LAST_ACTIVE_REFRESH_MS) {
    await AdminDevice.updateOne(
      { _id: device._id, status: 'active' },
      { $set: { lastActiveAt: now } }
    );
  }
  return true;
}

export async function revokeAdminDevice(deviceId, adminId) {
  if (!mongoose.isValidObjectId(deviceId)) return null;
  const now = new Date();
  const device = await AdminDevice.findOneAndUpdate(
    { _id: deviceId, adminKey: ADMIN_KEY, status: 'active' },
    { $set: { status: 'revoked', revokedAt: now, revokedBy: adminId } },
    { new: true }
  ).lean();

  if (!device) return null;

  await AdminSession.updateMany(
    { deviceId: device._id, revokedAt: null },
    { $set: { revokedAt: now } }
  );
  await deviceEvent({
    adminId,
    type: 'device_revoked',
    device,
    message: `Admin device access revoked: ${device.name}.`
  });
  return device;
}

export async function recordAdminDeviceRecovery(adminId, revokedCount) {
  return deviceEvent({
    adminId,
    type: 'device_recovery',
    message: `Server-verified recovery revoked ${revokedCount} Admin device registration${revokedCount === 1 ? '' : 's'}.`
  });
}
