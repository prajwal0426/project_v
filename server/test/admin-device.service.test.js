import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { AdminDevice, AdminSecurityEvent, AdminSession } from '../src/models/index.js';
import {
  ADMIN_DEVICE_LIMIT,
  ADMIN_DEVICE_LIMIT_MESSAGE,
  AdminDeviceLimitError,
  describeAdminDevice,
  isAdminDeviceAuthorized,
  registerOrAuthorizeAdminDevice,
  revokeAdminDevice,
  reserveAdminDeviceSlot
} from '../src/services/admin-device.service.js';

test('Mongo enforces one active registration per each of the three Admin device slots', () => {
  const slotIndex = AdminDevice.schema.indexes().find(([, options]) => options.name === 'uniq_active_admin_device_slot');
  assert.deepEqual(slotIndex[0], { adminKey: 1, slot: 1 });
  assert.equal(slotIndex[1].unique, true);
  assert.deepEqual(slotIndex[1].partialFilterExpression, { status: 'active' });
  assert.equal(ADMIN_DEVICE_LIMIT, 3);
});

test('simultaneous registrations cannot reserve more than three active slots', async () => {
  const activeSlots = new Set();
  const createAtSlot = async (slot) => {
    await new Promise((resolve) => setImmediate(resolve));
    if (activeSlots.has(slot)) throw Object.assign(new Error('duplicate slot'), { code: 11000 });
    activeSlots.add(slot);
    return { slot };
  };

  const results = await Promise.allSettled(
    Array.from({ length: 8 }, () => reserveAdminDeviceSlot(createAtSlot))
  );
  const allowed = results.filter((result) => result.status === 'fulfilled');
  const rejected = results.filter((result) => result.status === 'rejected');

  assert.equal(allowed.length, 3);
  assert.equal(rejected.length, 5);
  assert.ok(rejected.every((result) => result.reason instanceof AdminDeviceLimitError));
  assert.ok(rejected.every((result) => result.reason.message === ADMIN_DEVICE_LIMIT_MESSAGE));
  assert.equal(activeSlots.size, 3);
});

test('device labels are derived server-side from the request user agent', () => {
  assert.deepEqual(describeAdminDevice('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/123.0.0.0 Safari/537.36'), {
    browser: 'Chrome',
    operatingSystem: 'Windows',
    name: 'Windows · Chrome'
  });
});

test('three devices register, a fourth is rejected, repeated login reuses registration, and revocation frees a slot', async () => {
  const methods = [
    [AdminDevice, 'createIndexes'],
    [AdminDevice, 'findOne'],
    [AdminDevice, 'create'],
    [AdminDevice, 'updateOne'],
    [AdminDevice, 'findOneAndUpdate'],
    [AdminSession, 'updateMany'],
    [AdminSecurityEvent, 'create']
  ];
  const originals = methods.map(([model, name]) => [model, name, model[name]]);
  const devices = [];
  const activeSlots = new Set();
  const events = [];
  let sessionsRevokedForDevice = false;
  const query = (value) => ({ select() { return this; }, lean: async () => value });

  AdminDevice.createIndexes = async () => {};
  AdminDevice.findOne = (filter) => query(devices.find((device) =>
    (!filter._id || String(device._id) === String(filter._id)) &&
    (!filter.deviceTokenHash || device.deviceTokenHash === filter.deviceTokenHash) &&
    (!filter.status || device.status === filter.status) &&
    (!filter.adminKey || device.adminKey === filter.adminKey) &&
    (!filter.userAgentHash || device.userAgentHash === filter.userAgentHash)
  ) || null);
  AdminDevice.create = async (document) => {
    if (activeSlots.has(document.slot)) throw Object.assign(new Error('duplicate active slot'), { code: 11000 });
    activeSlots.add(document.slot);
    const device = { ...document, _id: new mongoose.Types.ObjectId() };
    devices.push(device);
    return device;
  };
  AdminDevice.updateOne = async (filter, update) => {
    const device = devices.find((entry) => String(entry._id) === String(filter._id));
    if (device) Object.assign(device, update.$set);
    return { modifiedCount: device ? 1 : 0 };
  };
  AdminDevice.findOneAndUpdate = (filter, update) => {
    const device = devices.find((entry) => String(entry._id) === String(filter._id) && entry.status === filter.status);
    if (device) {
      Object.assign(device, update.$set);
      activeSlots.delete(device.slot);
    }
    return query(device || null);
  };
  AdminSession.updateMany = async (filter) => {
    sessionsRevokedForDevice = Boolean(filter.deviceId);
    return { modifiedCount: 1 };
  };
  AdminSecurityEvent.create = async (event) => { events.push(event); return event; };

  try {
    const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/123.0.0.0';
    const first = await registerOrAuthorizeAdminDevice({ username: 'admin', userAgent });
    const repeated = await registerOrAuthorizeAdminDevice({ deviceToken: first.deviceToken, username: 'admin', userAgent });
    const second = await registerOrAuthorizeAdminDevice({ username: 'admin', userAgent: 'Firefox/120.0 (Macintosh; Intel Mac OS X)' });
    const third = await registerOrAuthorizeAdminDevice({ username: 'admin', userAgent: 'Safari/17.0 (iPhone; iOS)' });

    assert.equal(repeated.newlyRegistered, false);
    assert.equal(String(repeated.device._id), String(first.device._id));
    assert.equal(activeSlots.size, 3);
    await assert.rejects(
      registerOrAuthorizeAdminDevice({ username: 'admin', userAgent: 'Edg/123.0 (Windows NT 10.0)' }),
      (error) => error instanceof AdminDeviceLimitError && error.message === ADMIN_DEVICE_LIMIT_MESSAGE
    );

    assert.equal(await isAdminDeviceAuthorized({ deviceId: first.device._id, deviceToken: first.deviceToken, userAgent }), true);
    const revoked = await revokeAdminDevice(first.device._id, 'admin');
    assert.equal(revoked.status, 'revoked');
    assert.equal(sessionsRevokedForDevice, true);
    assert.equal(await isAdminDeviceAuthorized({ deviceId: first.device._id, deviceToken: first.deviceToken, userAgent }), false);

    const replacement = await registerOrAuthorizeAdminDevice({ deviceToken: first.deviceToken, username: 'admin', userAgent });
    assert.equal(replacement.newlyRegistered, true);
    assert.notEqual(replacement.deviceToken, first.deviceToken);
    assert.equal(activeSlots.size, 3);
    assert.equal(events.filter((event) => event.type === 'device_registered').length, 4);
    assert.equal(events.filter((event) => event.type === 'device_revoked').length, 1);
    assert.equal(second.device.status, 'active');
    assert.equal(third.device.status, 'active');
  } finally {
    for (const [model, name, original] of originals) model[name] = original;
  }
});
