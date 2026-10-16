/*
 * Offline, read-only PostgreSQL to MongoDB importer.
 *
 * The script defaults to dry-run and will not write to MongoDB until both
 * MIGRATION_WRITE=true and the confirmation phrase below are supplied.
 */
import 'dotenv/config';
import pg from 'pg';
import { closeDB, connectDB } from '../src/config/db.js';
import {
  AuditLog,
  Company,
  Notification,
  PasswordReset,
  Project,
  Ranking,
  Submission,
  Transaction,
  User,
  Wallet
} from '../src/models/index.js';

const { Client } = pg;
const CONFIRMATION = 'I_UNDERSTAND_THIS_WRITES_TO_MONGODB';
const shouldWrite = process.env.MIGRATION_WRITE === 'true' && process.env.MIGRATION_CONFIRM === CONFIRMATION;
const batchSize = Math.min(Math.max(Number(process.env.MIGRATION_BATCH_SIZE || 100), 1), 1000);
const counts = {};
const cache = new Map();

function count(name, key) {
  counts[name] ??= { read: 0, written: 0, skipped: 0, errors: 0 };
  counts[name][key] += 1;
}

function value(row, key, fallback = null) {
  return row[key] === undefined || row[key] === null ? fallback : row[key];
}

function date(value) {
  return value ? new Date(value) : undefined;
}

function paise(value) {
  return Math.round(Number(value || 0) * 100);
}

function cacheKey(model, legacyId) {
  return `${model.modelName}:${legacyId}`;
}

async function reference(Model, legacyId) {
  if (!legacyId) return null;
  const key = cacheKey(Model, legacyId);
  if (cache.has(key)) return cache.get(key);
  const document = await Model.findOne({ legacyPostgresId: String(legacyId) }).select('_id').lean();
  const id = document?._id || null;
  cache.set(key, id);
  return id;
}

async function upsert(Model, legacyId, document) {
  if (!shouldWrite) return true;
  await Model.updateOne(
    { legacyPostgresId: String(legacyId) },
    { $set: document, $setOnInsert: { legacyPostgresId: String(legacyId) } },
    { upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );
  cache.set(cacheKey(Model, legacyId), (await reference(Model, legacyId)));
  return true;
}

async function importUsers(row) {
  await upsert(User, row.id, {
    name: value(row, 'name', '').trim() || 'Legacy user',
    email: String(value(row, 'email', '')).toLowerCase(),
    passwordHash: value(row, 'password_hash', undefined),
    dateOfBirth: date(row.date_of_birth),
    governmentIdFile: value(row, 'government_id_file', undefined),
    idVerificationStatus: value(row, 'id_verification_status', 'pending'),
    role: value(row, 'role', 'user'),
    privacyPolicyAccepted: Boolean(row.privacy_policy_accepted),
    termsAccepted: Boolean(row.terms_accepted),
    ageConfirmed: Boolean(row.age_confirmed),
    legalAcceptedAt: date(row.legal_accepted_at),
    privacyPolicyVersion: value(row, 'privacy_policy_version', ''),
    termsVersion: value(row, 'terms_version', ''),
    accountStatus: value(row, 'account_status', 'ACTIVE'),
    blockedAt: date(row.blocked_at),
    blockedBy: value(row, 'blocked_by', undefined),
    restrictedAt: date(row.restricted_at),
    restrictedBy: value(row, 'restricted_by', undefined),
    restrictionData: value(row, 'restriction_data', {}),
    suspendedAt: date(row.suspended_at),
    suspendedBy: value(row, 'suspended_by', undefined),
    suspensionReason: value(row, 'suspension_reason', undefined),
    suspensionUntil: date(row.suspension_until),
    tokenVersion: Number(value(row, 'token_version', 0)),
    lastLoginAt: date(row.last_login_at),
    passwordResetRequestedAt: date(row.password_reset_requested_at),
    createdAt: date(row.created_at),
    updatedAt: date(row.updated_at)
  });
}

async function importCompanies(row) {
  await upsert(Company, row.id, {
    name: value(row, 'name', '').trim() || 'Legacy company',
    email: String(value(row, 'email', '')).toLowerCase(),
    passwordHash: value(row, 'password_hash', undefined),
    verificationFile: value(row, 'verification_file', undefined),
    profile: value(row, 'profile', undefined),
    status: value(row, 'status', 'pending'),
    role: 'company',
    privacyPolicyAccepted: Boolean(row.privacy_policy_accepted),
    termsAccepted: Boolean(row.terms_accepted),
    ageConfirmed: Boolean(row.age_confirmed),
    legalAcceptedAt: date(row.legal_accepted_at),
    privacyPolicyVersion: value(row, 'privacy_policy_version', ''),
    termsVersion: value(row, 'terms_version', ''),
    accountStatus: value(row, 'account_status', 'ACTIVE'),
    blockedAt: date(row.blocked_at),
    blockedBy: value(row, 'blocked_by', undefined),
    restrictedAt: date(row.restricted_at),
    restrictedBy: value(row, 'restricted_by', undefined),
    restrictionData: value(row, 'restriction_data', {}),
    suspendedAt: date(row.suspended_at),
    suspendedBy: value(row, 'suspended_by', undefined),
    suspensionReason: value(row, 'suspension_reason', undefined),
    suspensionUntil: date(row.suspension_until),
    tokenVersion: Number(value(row, 'token_version', 0)),
    lastLoginAt: date(row.last_login_at),
    passwordResetRequestedAt: date(row.password_reset_requested_at),
    createdAt: date(row.created_at),
    updatedAt: date(row.updated_at)
  });
}

async function importProjects(row) {
  const companyId = await reference(Company, row.company_id);
  if (!companyId) return false;
  await upsert(Project, row.id, {
    companyId,
    title: value(row, 'title', '').trim() || 'Legacy project',
    description: value(row, 'description', undefined),
    difficulty: value(row, 'difficulty', 'easy'),
    coinReward: Number(value(row, 'coin_reward', 0)),
    budgetInr: Number(value(row, 'budget_inr', 0)),
    rewardPoolInr: Number(value(row, 'reward_pool_inr', 0)),
    bonusInr: Number(value(row, 'bonus_inr', 0)),
    paymentInr: Number(value(row, 'payment_inr', 0)),
    status: value(row, 'status', 'open'),
    createdAt: date(row.created_at),
    updatedAt: date(row.updated_at)
  });
  return true;
}

async function importSubmissions(row) {
  const [projectId, userId] = await Promise.all([reference(Project, row.project_id), reference(User, row.user_id)]);
  if (!projectId || !userId) return false;
  await upsert(Submission, row.id, {
    projectId, userId,
    fileUrl: value(row, 'file_url', undefined),
    status: value(row, 'status', 'submitted'),
    feedback: value(row, 'feedback', undefined),
    feedbackScore: Number(value(row, 'feedback_score', 0)),
    starRating: Number(value(row, 'star_rating', 0)),
    submittedAt: date(row.submitted_at),
    reviewedAt: date(row.reviewed_at),
    createdAt: date(row.submitted_at),
    updatedAt: date(row.reviewed_at || row.submitted_at)
  });
  return true;
}

async function importRankings(row) {
  const userId = await reference(User, row.user_id);
  if (!userId) return false;
  await Ranking.updateOne(
    { userId, month: date(row.month) },
    { $set: {
      projectsCompleted: Number(value(row, 'projects_completed', 0)),
      feedbackScore: Number(value(row, 'feedback_score', 0)),
      starRating: Number(value(row, 'star_rating', 0)),
      difficultyScore: Number(value(row, 'difficulty_score', 0)),
      totalScore: Number(value(row, 'total_score', 0)),
      badge: value(row, 'badge', 'Bronze'),
      createdAt: date(row.created_at), updatedAt: date(row.updated_at)
    } },
    { upsert: shouldWrite, runValidators: true, setDefaultsOnInsert: true }
  );
  return true;
}

async function importWallets(row) {
  const [userId, companyId] = await Promise.all([reference(User, row.user_id), reference(Company, row.company_id)]);
  if (!userId && !companyId) return false;
  await upsert(Wallet, row.id, {
    ...(userId ? { userId } : { companyId }),
    coinBalance: Math.max(0, Math.round(Number(value(row, 'coin_balance', 0)))),
    inrBalancePaise: Math.max(0, paise(row.inr_balance)),
    pendingInrBalancePaise: Math.max(0, paise(row.pending_inr_balance)),
    createdAt: date(row.created_at), updatedAt: date(row.updated_at)
  });
  return true;
}

async function importTransactions(row) {
  const [userId, companyId] = await Promise.all([reference(User, row.user_id), reference(Company, row.company_id)]);
  if (!userId && !companyId) return false;
  await upsert(Transaction, row.id, {
    ...(userId ? { userId } : {}), ...(companyId ? { companyId } : {}),
    type: value(row, 'type', 'legacy'),
    coinAmount: Math.max(0, Math.round(Number(value(row, 'coin_amount', 0)))),
    inrAmountPaise: Math.max(0, paise(row.inr_amount)),
    provider: value(row, 'provider', 'legacy'),
    providerReference: value(row, 'provider_reference', undefined),
    status: value(row, 'status', 'pending'),
    createdAt: date(row.created_at), updatedAt: date(row.created_at)
  });
  return true;
}

async function importNotifications(row) {
  const [userId, companyId] = await Promise.all([reference(User, row.user_id), reference(Company, row.company_id)]);
  await upsert(Notification, row.id, {
    ...(userId ? { userId } : {}), ...(companyId ? { companyId } : {}),
    adminId: value(row, 'admin_id', undefined),
    title: value(row, 'title', 'Legacy notification'), body: value(row, 'body', undefined),
    isRead: Boolean(row.is_read), createdAt: date(row.created_at), updatedAt: date(row.created_at)
  });
  return true;
}

async function importAuditLogs(row) {
  const targetModel = row.target_type === 'COMPANY' ? Company : User;
  const targetId = await reference(targetModel, row.target_id);
  if (!targetId) return false;
  await AuditLog.updateOne(
    { adminId: String(row.admin_id), targetId, action: String(row.action), createdAt: date(row.created_at) },
    { $set: { targetType: row.target_type, reason: value(row, 'reason', undefined), metadata: value(row, 'metadata', {}), updatedAt: date(row.created_at) } },
    { upsert: shouldWrite, runValidators: true, setDefaultsOnInsert: true }
  );
  return true;
}

async function importPasswordResets(row) {
  const targetModel = row.target_type === 'COMPANY' ? Company : User;
  const targetId = await reference(targetModel, row.target_id);
  if (!targetId) return false;
  await PasswordReset.updateOne(
    { targetId, tokenHash: value(row, 'token_hash', undefined), expiresAt: date(row.expires_at) },
    { $set: { targetType: row.target_type, requestedBy: String(row.requested_by), usedAt: date(row.used_at), createdAt: date(row.created_at), updatedAt: date(row.created_at) } },
    { upsert: shouldWrite, runValidators: true, setDefaultsOnInsert: true }
  );
  return true;
}

async function importTable(client, table, handler) {
  let offset = 0;
  while (true) {
    const { rows } = await client.query(`SELECT * FROM ${table} ORDER BY created_at ASC LIMIT $1 OFFSET $2`, [batchSize, offset]);
    if (!rows.length) return;
    for (const row of rows) {
      count(table, 'read');
      try {
        if (!shouldWrite) {
          count(table, 'skipped');
          continue;
        }
        const imported = await handler(row);
        count(table, imported === false ? 'skipped' : 'written');
      } catch {
        count(table, 'errors');
      }
    }
    offset += rows.length;
  }
}

async function main() {
  if (!process.env.POSTGRES_MIGRATION_URL) throw new Error('POSTGRES_MIGRATION_URL is required for the offline importer');
  if (!shouldWrite) console.log('Dry-run only. No MongoDB writes will be made.');

  const source = new Client({ connectionString: process.env.POSTGRES_MIGRATION_URL, ssl: process.env.POSTGRES_MIGRATION_SSL === 'true' ? { rejectUnauthorized: false } : undefined });
  await source.connect();
  if (shouldWrite) await connectDB();
  try {
    for (const [table, handler] of [
      ['users', importUsers], ['companies', importCompanies], ['projects', importProjects],
      ['submissions', importSubmissions], ['rankings', importRankings], ['wallets', importWallets],
      ['transactions', importTransactions], ['notifications', importNotifications],
      ['admin_audit_logs', importAuditLogs], ['password_reset_requests', importPasswordResets]
    ]) await importTable(source, table, handler);
    console.log(JSON.stringify({ mode: shouldWrite ? 'write' : 'dry-run', counts }));
  } finally {
    await source.end();
    if (shouldWrite) await closeDB();
  }
}

main().catch((error) => {
  console.error('Migration failed:', error.message);
  process.exitCode = 1;
});
