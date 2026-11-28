import { AdminDevice, AdminSecurityEvent } from '../models/index.js';
import { revokeAdminDevice } from '../services/admin-device.service.js';

const ADMIN_KEY = 'env-admin';

function serializeDevice(device, currentDeviceId) {
  return {
    id: String(device._id),
    name: device.name,
    browser: device.browser,
    operatingSystem: device.operatingSystem,
    registeredAt: device.registeredAt,
    lastActiveAt: device.lastActiveAt,
    status: device.status,
    revokedAt: device.revokedAt || null,
    isCurrent: String(device._id) === String(currentDeviceId)
  };
}

function serializeEvent(event) {
  return {
    id: String(event._id),
    type: event.type,
    deviceId: event.deviceId ? String(event.deviceId) : null,
    deviceName: event.deviceName || 'Admin account',
    message: event.message,
    createdAt: event.createdAt
  };
}

export async function listAdminDevices(req, res, next) {
  try {
    const [devices, events] = await Promise.all([
      AdminDevice.find({ adminKey: ADMIN_KEY }).sort({ registeredAt: -1 }).limit(30).lean(),
      AdminSecurityEvent.find({ adminId: req.user.username }).sort({ createdAt: -1 }).limit(25).lean()
    ]);

    return res.json({
      devices: devices.map((device) => serializeDevice(device, req.user.deviceId)),
      events: events.map(serializeEvent),
      currentDeviceId: req.user.deviceId
    });
  } catch (error) {
    return next(error);
  }
}

export async function revokeAdminDeviceAccess(req, res, next) {
  try {
    const device = await revokeAdminDevice(req.params.deviceId, req.user.username);
    if (!device) return res.status(404).json({ message: 'Active Admin device not found' });

    return res.json({
      device: serializeDevice({ ...device, status: 'revoked', revokedAt: device.revokedAt || new Date() }, req.user.deviceId),
      message: 'Device access revoked. All sessions for this device are invalid.'
    });
  } catch (error) {
    return next(error);
  }
}
