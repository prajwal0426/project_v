import crypto from 'crypto';
import { AuditLog, Company, PasswordReset, User } from '../models/index.js';

const MODELS = {
  users: { Model: User, type: 'USER' },
  companies: { Model: Company, type: 'COMPANY' }
};

const VALID_STATUSES = new Set(['ACTIVE', 'BLOCKED', 'RESTRICTED', 'SUSPENDED']);

function adminId(req) {
  return req.user?.username || req.user?.email || req.user?.id || 'admin';
}

function badRequest(message) {
  const error = new Error(message);
  error.status = 400;
  return error;
}

function getConfig(kind) {
  const config = MODELS[kind];
  if (!config) throw badRequest('Unsupported account type');
  return config;
}

async function writeAudit({ req, type, targetId, action, reason, metadata = {} }) {
  await AuditLog.create({ adminId: adminId(req), targetId, targetType: type, action, reason: reason || null, metadata });
}

export async function listManagedAccounts(req, res, next) {
  try {
    const { Model } = getConfig(req.params.kind);
    const { search = '', status = '' } = req.query;

    const filter = {};
    if (search) filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { profile: { $regex: search, $options: 'i' } }
    ];
    if (status) filter.accountStatus = status.toUpperCase();

    const rows = await Model.find(filter)
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    res.json({ rows: rows.map(r => ({ ...r, id: r._id, username: r.email })) });
  } catch (error) { next(error); }
}

export async function getManagedAccount(req, res, next) {
  try {
    const { Model } = getConfig(req.params.kind);
    const account = await Model.findById(req.params.id).lean();
    if (!account) return res.status(404).json({ message: 'Account not found' });
    return res.json({ account: { ...account, id: account._id, username: account.email } });
  } catch (error) { return next(error); }
}

export async function updateManagedStatus(req, res, next) {
  try {
    const { Model, type } = getConfig(req.params.kind);
    const status = String(req.body.status || '').toUpperCase();
    const reason = req.body.reason || '';
    const suspensionUntil = req.body.permanent ? null : req.body.suspensionUntil || null;

    if (!VALID_STATUSES.has(status)) throw badRequest('Invalid account status');

    const update = { accountStatus: status };

    if (status === 'BLOCKED') {
      update.blockedAt = new Date();
      update.blockedBy = adminId(req);
      update.$inc = { tokenVersion: 1 };
    } else if (status === 'SUSPENDED') {
      update.suspendedAt = new Date();
      update.suspendedBy = adminId(req);
      update.suspensionReason = reason || null;
      update.suspensionUntil = suspensionUntil;
      update.$inc = { tokenVersion: 1 };
    } else {
      update.blockedAt = null; update.blockedBy = null;
      update.restrictedAt = null; update.restrictedBy = null;
      update.restrictionData = {};
      update.suspendedAt = null; update.suspendedBy = null;
      update.suspensionReason = null; update.suspensionUntil = null;
    }

    const account = await Model.findByIdAndUpdate(req.params.id, update, { new: true }).lean();
    if (!account) return res.status(404).json({ message: 'Account not found' });

    await writeAudit({ req, type, targetId: req.params.id, action: `${type}_${status}`, reason, metadata: { status, suspensionUntil } });
    return res.json({ account: { ...account, id: account._id, username: account.email } });
  } catch (error) { return next(error); }
}

export async function updateManagedRestrictions(req, res, next) {
  try {
    const { Model, type } = getConfig(req.params.kind);
    const restrictions = req.body.restrictions && typeof req.body.restrictions === 'object' ? req.body.restrictions : {};
    const hasRestrictions = Object.values(restrictions).some(Boolean);

    const existing = await Model.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Account not found' });

    const currentStatus = existing.accountStatus || 'ACTIVE';
    const newStatus = hasRestrictions ? 'RESTRICTED' : currentStatus === 'RESTRICTED' ? 'ACTIVE' : currentStatus;

    const update = {
      restrictionData: restrictions,
      accountStatus: newStatus,
      restrictedAt: hasRestrictions ? new Date() : null,
      restrictedBy: hasRestrictions ? adminId(req) : null
    };

    const account = await Model.findByIdAndUpdate(req.params.id, update, { new: true }).lean();
    await writeAudit({
      req, type, targetId: req.params.id,
      action: hasRestrictions ? `${type}_RESTRICTED` : `${type}_RESTRICTIONS_REMOVED`,
      metadata: { restrictions }
    });
    return res.json({ account: { ...account, id: account._id, username: account.email } });
  } catch (error) { return next(error); }
}

export async function forceLogoutManagedAccount(req, res, next) {
  try {
    const { Model, type } = getConfig(req.params.kind);
    const account = await Model.findByIdAndUpdate(req.params.id, { $inc: { tokenVersion: 1 } }, { new: true });
    if (!account) return res.status(404).json({ message: 'Account not found' });

    await writeAudit({ req, type, targetId: req.params.id, action: `${type}_FORCE_LOGOUT` });
    return res.json({ message: 'Active sessions invalidated' });
  } catch (error) { return next(error); }
}

export async function requestManagedPasswordReset(req, res, next) {
  try {
    const { Model, type } = getConfig(req.params.kind);
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    const exists = await Model.findById(req.params.id);
    if (!exists) return res.status(404).json({ message: 'Account not found' });

    await PasswordReset.create({ targetId: req.params.id, targetType: type, requestedBy: adminId(req), tokenHash, expiresAt });
    await Model.findByIdAndUpdate(req.params.id, { passwordResetRequestedAt: new Date() });
    await writeAudit({ req, type, targetId: req.params.id, action: `${type}_PASSWORD_RESET_REQUESTED` });

    return res.json({
      message: 'Password reset requested. Send the reset workflow through your configured email/SMS provider.',
      expiresAt
    });
  } catch (error) { return next(error); }
}

export async function listAuditLogs(_req, res, next) {
  try {
    const rows = await AuditLog.find().sort({ createdAt: -1 }).limit(100).lean();
    res.json({ rows: rows.map(r => ({ ...r, id: r._id })) });
  } catch (error) { next(error); }
}
