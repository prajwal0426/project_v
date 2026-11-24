import mongoose from 'mongoose';
import { AuditLog, Company, Notification, NotificationReceipt, User } from '../models/index.js';
import {
  broadcastExpiry,
  individualExpiry,
  individualQueryForRecipient,
  listRecipientNotifications,
  notificationQueryForRecipient,
  serializeNotificationForRecipient,
  unreadCountForRecipient
} from '../services/notification.service.js';

const ELIGIBLE_STATUS_FILTER = { accountStatus: { $nin: ['BLOCKED', 'SUSPENDED'] } };

async function recordAdminNotificationAction(req, notification, action, metadata = {}) {
  try {
    await AuditLog.create({
      adminId: req.user.username || req.user.email || req.user.id,
      targetId: notification._id,
      targetType: 'NOTIFICATION',
      action,
      metadata
    });
  } catch {
    console.error('Unable to record an admin notification audit event');
  }
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function parseAudience(audience) {
  if (audience === 'users') return ['user'];
  if (audience === 'companies') return ['company'];
  return ['user', 'company'];
}

function serializeAdminNotification(notification, readCount = 0, totalRecipients = 0) {
  const isBroadcast = notification.type === 'broadcast';
  const viewed = Boolean(notification.viewedAt || notification.isRead);
  const count = isBroadcast ? Math.min(readCount, totalRecipients) : Number(viewed);
  return {
    id: String(notification._id),
    type: isBroadcast ? 'broadcast' : 'individual',
    title: notification.title,
    body: notification.body || '',
    category: notification.category || 'general',
    priority: notification.priority || 'normal',
    recipientRole: notification.recipientRole || (notification.companyId ? 'company' : 'user'),
    recipientId: notification.recipientId || notification.userId || notification.companyId || null,
    recipient: notification.recipient || null,
    audienceRoles: notification.audienceRoles || [],
    isRead: isBroadcast ? count > 0 && count >= totalRecipients : viewed,
    readCount: count,
    unreadCount: Math.max(totalRecipients - count, 0),
    totalRecipients,
    viewedAt: notification.viewedAt || null,
    expiresAt: notification.expiresAt || null,
    deletedAt: notification.deletedAt || null,
    createdAt: notification.createdAt
  };
}

function eligibleRoles(notification) {
  return notification.audienceRoles?.length ? notification.audienceRoles : ['user', 'company'];
}

export async function searchNotificationRecipients(req, res, next) {
  try {
    const role = req.query.role || 'user';
    const Model = role === 'company' ? Company : User;
    const query = String(req.query.search || '').trim();
    const filter = { ...ELIGIBLE_STATUS_FILTER };

    if (query) {
      const expression = new RegExp(escapeRegex(query), 'i');
      filter.$or = [{ name: expression }, { email: expression }];
    }

    const accounts = await Model.find(filter)
      .select('name email accountStatus')
      .sort({ name: 1, _id: 1 })
      .limit(25)
      .lean();

    return res.json({ rows: accounts.map((account) => ({
      id: String(account._id),
      role,
      name: account.name,
      email: account.email
    })) });
  } catch (error) {
    return next(error);
  }
}

export async function createBroadcastNotification(req, res, next) {
  try {
    const createdAt = new Date();
    const notification = await Notification.create({
      type: 'broadcast',
      title: req.body.title.trim(),
      body: req.body.body.trim(),
      category: req.body.category?.trim() || 'general',
      priority: req.body.priority || 'normal',
      audienceRoles: parseAudience(req.body.audience),
      senderAdminId: req.user.username,
      adminId: req.user.username,
      createdAt,
      expiresAt: broadcastExpiry(createdAt)
    });
    await recordAdminNotificationAction(req, notification, 'NOTIFICATION_BROADCAST_CREATED', {
      audienceRoles: notification.audienceRoles,
      category: notification.category,
      priority: notification.priority
    });

    return res.status(201).json({ notification: serializeAdminNotification(notification, 0, 0) });
  } catch (error) {
    return next(error);
  }
}

export async function createIndividualNotification(req, res, next) {
  try {
    const { recipientId, recipientRole } = req.body;
    const Model = recipientRole === 'company' ? Company : User;
    const recipient = await Model.findOne({ _id: recipientId, ...ELIGIBLE_STATUS_FILTER })
      .select('_id')
      .lean();

    if (!recipient) return res.status(404).json({ message: 'Eligible recipient not found' });

    const notification = await Notification.create({
      type: 'individual',
      recipientId: recipient._id,
      recipientRole,
      ...(recipientRole === 'company' ? { companyId: recipient._id } : { userId: recipient._id }),
      title: req.body.title.trim(),
      body: req.body.body.trim(),
      category: req.body.category?.trim() || 'general',
      priority: req.body.priority || 'normal',
      senderAdminId: req.user.username,
      adminId: req.user.username,
      isRead: false,
      viewedAt: null,
      expiresAt: null
    });
    await recordAdminNotificationAction(req, notification, 'NOTIFICATION_INDIVIDUAL_CREATED', {
      recipientRole,
      category: notification.category,
      priority: notification.priority
    });

    return res.status(201).json({ notification: serializeAdminNotification(notification, 0, 1) });
  } catch (error) {
    return next(error);
  }
}

export async function listAdminNotifications(req, res, next) {
  try {
    const now = new Date();
    const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 100);
    const skip = Math.max(Number(req.query.skip) || 0, 0);
    const clauses = [];
    const status = req.query.status || 'history';

    if (status === 'deleted') clauses.push({ deletedAt: { $ne: null } });
    else {
      clauses.push({ deletedAt: null });
      if (status === 'active') clauses.push({ $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }] });
      if (status === 'expired') clauses.push({ expiresAt: { $lte: now } });
    }
    if (req.query.type === 'individual') clauses.push({ type: { $in: [null, 'individual'] } });
    else if (req.query.type) clauses.push({ type: req.query.type });
    if (req.query.search) {
      const expression = new RegExp(escapeRegex(String(req.query.search).trim()), 'i');
      clauses.push({ $or: [{ title: expression }, { body: expression }] });
    }

    const filter = clauses.length ? { $and: clauses } : {};
    const rows = await Notification.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    const total = await Notification.countDocuments(filter);
    const broadcastIds = rows.filter((row) => row.type === 'broadcast').map((row) => row._id);
    const [receipts, userCount, companyCount] = await Promise.all([
      broadcastIds.length
        ? NotificationReceipt.aggregate([
          { $match: { notificationId: { $in: broadcastIds } } },
          { $group: { _id: { notificationId: '$notificationId', role: '$recipientRole' }, count: { $sum: 1 } } }
        ])
        : [],
      User.countDocuments(ELIGIBLE_STATUS_FILTER),
      Company.countDocuments(ELIGIBLE_STATUS_FILTER)
    ]);
    const receiptCounts = new Map(receipts.map((receipt) => [`${receipt._id.notificationId}:${receipt._id.role}`, receipt.count]));
    const userRecipientIds = rows
      .filter((row) => row.type !== 'broadcast' && (row.recipientRole === 'user' || (!row.recipientRole && !row.companyId)))
      .map((row) => row.recipientId || row.userId)
      .filter(Boolean);
    const companyRecipientIds = rows
      .filter((row) => row.type !== 'broadcast' && (row.recipientRole === 'company' || (!row.recipientRole && row.companyId)))
      .map((row) => row.recipientId || row.companyId)
      .filter(Boolean);
    const [userRecipients, companyRecipients] = await Promise.all([
      userRecipientIds.length ? User.find({ _id: { $in: userRecipientIds } }).select('name email').lean() : [],
      companyRecipientIds.length ? Company.find({ _id: { $in: companyRecipientIds } }).select('name email').lean() : []
    ]);
    const recipientDetails = new Map([
      ...userRecipients.map((account) => [`user:${account._id}`, { name: account.name, email: account.email }]),
      ...companyRecipients.map((account) => [`company:${account._id}`, { name: account.name, email: account.email }])
    ]);

    const notifications = rows.map((row) => {
      if (row.type !== 'broadcast') {
        const role = row.recipientRole || (row.companyId ? 'company' : 'user');
        const recipientId = row.recipientId || row.userId || row.companyId;
        return serializeAdminNotification({
          ...row,
          recipient: recipientId ? recipientDetails.get(`${role}:${recipientId}`) || null : null
        }, Boolean(row.viewedAt || row.isRead), 1);
      }
      const roles = eligibleRoles(row);
      const audienceSize = (roles.includes('user') ? userCount : 0) + (roles.includes('company') ? companyCount : 0);
      const readCount = roles.reduce((sum, role) => sum + (receiptCounts.get(`${row._id}:${role}`) || 0), 0);
      return serializeAdminNotification(row, readCount, audienceSize);
    });

    return res.json({ rows: notifications, total, limit, skip });
  } catch (error) {
    return next(error);
  }
}

export async function getNotificationStatistics(_req, res, next) {
  try {
    const now = new Date();
    const notifications = await Notification.find({ deletedAt: null })
      .select('type audienceRoles expiresAt viewedAt isRead')
      .lean();
    const activeBroadcasts = notifications.filter((row) => row.type === 'broadcast' && row.expiresAt && row.expiresAt > now);
    const individuals = notifications.filter((row) => row.type !== 'broadcast');
    const expired = notifications.filter((row) => row.expiresAt && row.expiresAt <= now).length;
    const [userCount, companyCount] = await Promise.all([
      User.countDocuments(ELIGIBLE_STATUS_FILTER),
      Company.countDocuments(ELIGIBLE_STATUS_FILTER)
    ]);
    const activeBroadcastIds = activeBroadcasts.map((row) => row._id);
    const viewedBroadcastRecipients = activeBroadcastIds.length
      ? await NotificationReceipt.countDocuments({ notificationId: { $in: activeBroadcastIds } })
      : 0;
    const activeIndividuals = individuals.filter((row) => !row.viewedAt || (row.expiresAt && row.expiresAt > now));
    const viewedIndividuals = activeIndividuals.filter((row) => row.viewedAt || row.isRead).length;
    const broadcastRecipients = activeBroadcasts.reduce((sum, row) => {
      const roles = eligibleRoles(row);
      return sum + (roles.includes('user') ? userCount : 0) + (roles.includes('company') ? companyCount : 0);
    }, 0);
    const activeRecipients = broadcastRecipients + activeIndividuals.length;
    const readRecipients = Math.min(viewedBroadcastRecipients, broadcastRecipients) + viewedIndividuals;

    return res.json({
      total: notifications.length,
      activeBroadcasts: activeBroadcasts.length,
      individual: individuals.length,
      expired,
      read: readRecipients,
      unread: Math.max(activeRecipients - readRecipients, 0)
    });
  } catch (error) {
    return next(error);
  }
}

export async function deleteAdminNotification(req, res, next) {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, deletedAt: null },
      { $set: { deletedAt: new Date() } },
      { new: true }
    ).lean();
    if (!notification) return res.status(404).json({ message: 'Notification not found' });
    await recordAdminNotificationAction(req, notification, 'NOTIFICATION_DELETED', { type: notification.type || 'individual' });
    return res.json({ message: 'Notification deleted', id: String(notification._id) });
  } catch (error) {
    return next(error);
  }
}

export async function listMyNotifications(req, res, next) {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 100);
    const skip = Math.max(Number(req.query.skip) || 0, 0);
    const [rows, unreadCount] = await Promise.all([
      listRecipientNotifications({ role: req.user.role, recipientId: req.user.id, limit, skip }),
      unreadCountForRecipient({ role: req.user.role, recipientId: req.user.id })
    ]);
    return res.json({ rows, unreadCount, limit, skip });
  } catch (error) {
    return next(error);
  }
}

export async function getMyUnreadCount(req, res, next) {
  try {
    const unreadCount = await unreadCountForRecipient({ role: req.user.role, recipientId: req.user.id });
    return res.json({ unreadCount });
  } catch (error) {
    return next(error);
  }
}

export async function viewMyNotification(req, res, next) {
  try {
    const query = notificationQueryForRecipient(req.user.role, req.user.id);
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Notification not found' });
    const notification = await Notification.findOne({ ...query, _id: req.params.id }).lean();
    if (!notification) return res.status(404).json({ message: 'Notification not found' });

    if (notification.type === 'broadcast') {
      const viewedAt = new Date();
      try {
        await NotificationReceipt.updateOne(
          { notificationId: notification._id, recipientId: req.user.id, recipientRole: req.user.role },
          { $setOnInsert: { viewedAt } },
          { upsert: true }
        );
      } catch (error) {
        if (error?.code !== 11000) throw error;
      }
      return res.json({ notification: serializeNotificationForRecipient(notification, true) });
    }

    const individualQuery = individualQueryForRecipient(req.user.role, req.user.id, req.params.id);
    if (!individualQuery) return res.status(404).json({ message: 'Notification not found' });
    const now = new Date();
    let updated = notification.viewedAt
      ? await Notification.findOneAndUpdate(individualQuery, { $set: { isRead: true } }, { new: true }).lean()
      : await Notification.findOneAndUpdate(
        { ...individualQuery, viewedAt: null },
        {
          $set: {
            type: 'individual',
            recipientRole: req.user.role,
            recipientId: req.user.id,
            isRead: true,
            viewedAt: now,
            expiresAt: individualExpiry(now)
          }
        },
        { new: true, runValidators: true }
      ).lean();

    if (!updated) {
      updated = await Notification.findOne(individualQuery).lean();
      if (!updated) return res.status(404).json({ message: 'Notification not found' });
    }

    return res.json({ notification: serializeNotificationForRecipient(updated, true) });
  } catch (error) {
    return next(error);
  }
}
