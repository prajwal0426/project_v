import mongoose from 'mongoose';
import { Notification, NotificationReceipt } from '../models/index.js';

export const NOTIFICATION_LIFETIME_MS = 24 * 60 * 60 * 1000;

export function broadcastExpiry(createdAt) {
  return new Date(new Date(createdAt).getTime() + NOTIFICATION_LIFETIME_MS);
}

export function individualExpiry(viewedAt) {
  return new Date(new Date(viewedAt).getTime() + NOTIFICATION_LIFETIME_MS);
}

export function isNotificationVisible(notification, now = new Date()) {
  if (notification?.deletedAt) return false;

  if (notification?.type === 'broadcast') {
    return Boolean(notification.expiresAt && new Date(notification.expiresAt) > now);
  }

  if (!notification?.viewedAt) return true;
  return Boolean(notification.expiresAt && new Date(notification.expiresAt) > now);
}

function recipientConditions(role, recipientId, now) {
  const individualStillAvailable = {
    $or: [{ viewedAt: null }, { expiresAt: { $gt: now } }]
  };
  const individualById = {
    type: 'individual',
    recipientRole: role,
    recipientId: new mongoose.Types.ObjectId(recipientId),
    ...individualStillAvailable
  };
  const legacyRoleField = role === 'company' ? 'companyId' : 'userId';
  const otherLegacyRoleField = role === 'company' ? 'userId' : 'companyId';
  const legacyIndividual = {
    type: { $in: [null, 'individual'] },
    [legacyRoleField]: new mongoose.Types.ObjectId(recipientId),
    [otherLegacyRoleField]: null,
    ...individualStillAvailable
  };

  return [
    { type: 'broadcast', audienceRoles: role, expiresAt: { $gt: now } },
    individualById,
    legacyIndividual
  ];
}

export function notificationQueryForRecipient(role, recipientId, now = new Date()) {
  return {
    deletedAt: null,
    $or: recipientConditions(role, recipientId, now)
  };
}

export function individualQueryForRecipient(role, recipientId, notificationId, now = new Date()) {
  if (!mongoose.isValidObjectId(recipientId) || !mongoose.isValidObjectId(notificationId)) return null;

  const conditions = recipientConditions(role, recipientId, now).slice(1);
  return {
    _id: new mongoose.Types.ObjectId(notificationId),
    deletedAt: null,
    $or: conditions
  };
}

function serializeNotification(notification, isRead = notification.isRead) {
  return {
    id: String(notification._id),
    type: notification.type || 'individual',
    title: notification.title,
    body: notification.body || '',
    category: notification.category || 'general',
    priority: notification.priority || 'normal',
    isRead: Boolean(isRead),
    viewedAt: notification.viewedAt || null,
    expiresAt: notification.expiresAt || null,
    createdAt: notification.createdAt,
    created_at: notification.createdAt
  };
}

export async function listRecipientNotifications({ role, recipientId, limit = 50, skip = 0, now = new Date() }) {
  const rows = await Notification.find(notificationQueryForRecipient(role, recipientId, now))
    .sort({ createdAt: -1, _id: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const broadcastIds = rows.filter((row) => row.type === 'broadcast').map((row) => row._id);
  const receipts = broadcastIds.length
    ? await NotificationReceipt.find({
      notificationId: { $in: broadcastIds },
      recipientId,
      recipientRole: role
    }).select('notificationId').lean()
    : [];
  const viewedBroadcastIds = new Set(receipts.map((receipt) => String(receipt.notificationId)));

  return rows.map((row) => serializeNotification(
    row,
    row.type === 'broadcast'
      ? viewedBroadcastIds.has(String(row._id))
      : Boolean(row.viewedAt || row.isRead)
  ));
}

export async function unreadCountForRecipient({ role, recipientId, now = new Date() }) {
  const recipientObjectId = new mongoose.Types.ObjectId(recipientId);
  const broadcastFilter = {
    type: 'broadcast',
    audienceRoles: role,
    deletedAt: null,
    expiresAt: { $gt: now }
  };
  const [broadcasts, unreadIndividuals] = await Promise.all([
    Notification.find(broadcastFilter).select('_id').lean(),
    Notification.countDocuments({
      deletedAt: null,
      isRead: { $ne: true },
      viewedAt: null,
      $or: recipientConditions(role, recipientId, now).slice(1)
    })
  ]);

  const broadcastIds = broadcasts.map((notification) => notification._id);
  const viewedBroadcastCount = broadcastIds.length
    ? await NotificationReceipt.countDocuments({
      notificationId: { $in: broadcastIds },
      recipientId: recipientObjectId,
      recipientRole: role
    })
    : 0;

  return Math.max(broadcastIds.length - viewedBroadcastCount, 0) + unreadIndividuals;
}

export function serializeNotificationForRecipient(notification, isRead = notification.isRead) {
  return serializeNotification(notification, isRead);
}
