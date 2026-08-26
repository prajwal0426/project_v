import crypto from 'crypto';
import { query } from '../config/db.js';

const ACCOUNT_TYPES = {
  users: {
    table: 'users',
    type: 'USER',
    searchColumns: ['name', 'email'],
    detailSelect: `
      id, email as username, name, email, date_of_birth, government_id_file, id_verification_status,
      role, account_status, blocked_at, blocked_by, restricted_at, restricted_by,
      restriction_data, suspended_at, suspended_by, suspension_reason, suspension_until,
      token_version, last_login_at, password_reset_requested_at,
      created_at, updated_at, privacy_policy_version, terms_version
    `,
    listSelect: `
      u.id, u.email as username, u.name, u.email, u.role, u.account_status, u.last_login_at,
      u.created_at, u.blocked_at, u.suspension_until, u.restriction_data,
      coalesce(count(s.id) filter (where s.status = 'completed'), 0)::int as completed_projects
    `,
    joins: 'left join submissions s on s.user_id = u.id',
    groupBy: 'u.id'
  },
  companies: {
    table: 'companies',
    type: 'COMPANY',
    searchColumns: ['name', 'email', 'profile'],
    detailSelect: `
      id, email as username, name, email, verification_file, profile, status as verification_status,
      account_status, blocked_at, blocked_by, restricted_at, restricted_by,
      restriction_data, suspended_at, suspended_by, suspension_reason, suspension_until,
      token_version, last_login_at, password_reset_requested_at,
      created_at, updated_at, privacy_policy_version, terms_version
    `,
    listSelect: `
      c.id, c.email as username, c.name, c.email, c.profile, c.status as verification_status,
      c.account_status, c.last_login_at, c.created_at, c.blocked_at,
      c.suspension_until, c.restriction_data,
      coalesce(count(p.id), 0)::int as project_count
    `,
    joins: 'left join projects p on p.company_id = c.id',
    groupBy: 'c.id'
  }
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

function targetConfig(kind) {
  const config = ACCOUNT_TYPES[kind];
  if (!config) {
    throw badRequest('Unsupported account type');
  }
  return config;
}

async function writeAudit({ req, config, targetId, action, reason, metadata = {} }) {
  await query(
    `insert into admin_audit_logs (admin_id, target_id, target_type, action, reason, metadata)
     values ($1, $2, $3, $4, $5, $6)`,
    [adminId(req), targetId, config.type, action, reason || null, metadata]
  );
}

function buildListQuery(config, { search = '', status = '' }) {
  const alias = config.table === 'users' ? 'u' : 'c';
  const values = [];
  const conditions = [];

  if (search) {
    values.push(`%${search.toLowerCase()}%`);
    const searchSql = config.searchColumns
      .map((column) => `lower(coalesce(${alias}.${column}::text, '')) like $${values.length}`)
      .join(' or ');
    conditions.push(`(${searchSql})`);
  }

  if (status) {
    values.push(status.toUpperCase());
    conditions.push(`${alias}.account_status = $${values.length}`);
  }

  const where = conditions.length ? `where ${conditions.join(' and ')}` : '';
  const sql = `
    select ${config.listSelect}
    from ${config.table} ${alias}
    ${config.joins}
    ${where}
    group by ${config.groupBy}
    order by ${alias}.created_at desc
    limit 100
  `;

  return { sql, values };
}

export async function listManagedAccounts(req, res, next) {
  try {
    const config = targetConfig(req.params.kind);
    const { sql, values } = buildListQuery(config, req.query);
    const { rows } = await query(sql, values);
    res.json({ rows });
  } catch (error) {
    next(error);
  }
}

export async function getManagedAccount(req, res, next) {
  try {
    const config = targetConfig(req.params.kind);
    const { rows } = await query(
      `select ${config.detailSelect} from ${config.table} where id = $1`,
      [req.params.id]
    );

    if (!rows[0]) {
      return res.status(404).json({ message: 'Account not found' });
    }

    return res.json({ account: rows[0] });
  } catch (error) {
    return next(error);
  }
}

export async function updateManagedStatus(req, res, next) {
  try {
    const config = targetConfig(req.params.kind);
    const status = String(req.body.status || '').toUpperCase();
    const reason = req.body.reason || '';
    const suspensionUntil = req.body.permanent ? null : req.body.suspensionUntil || null;

    if (!VALID_STATUSES.has(status)) {
      throw badRequest('Invalid account status');
    }

    const values = [status, req.params.id];
    let updates = ['account_status = $1', 'updated_at = now()'];

    if (status === 'BLOCKED') {
      values.push(adminId(req));
      updates.push(`blocked_at = now()`, `blocked_by = $${values.length}`, 'token_version = token_version + 1');
    } else if (status === 'SUSPENDED') {
      values.push(adminId(req), reason || null, suspensionUntil);
      updates.push(`suspended_at = now()`, `suspended_by = $${values.length - 2}`, `suspension_reason = $${values.length - 1}`, `suspension_until = $${values.length}`, 'token_version = token_version + 1');
    } else {
      updates.push(
        'blocked_at = null',
        'blocked_by = null',
        'restricted_at = null',
        'restricted_by = null',
        "restriction_data = '{}'::jsonb",
        'suspended_at = null',
        'suspended_by = null',
        'suspension_reason = null',
        'suspension_until = null'
      );
    }

    const { rows } = await query(
      `update ${config.table} set ${updates.join(', ')}
       where id = $2
       returning ${config.detailSelect}`,
      values
    );

    if (!rows[0]) {
      return res.status(404).json({ message: 'Account not found' });
    }

    await writeAudit({ req, config, targetId: req.params.id, action: `${config.type}_${status}`, reason, metadata: { status, suspensionUntil } });
    return res.json({ account: rows[0] });
  } catch (error) {
    return next(error);
  }
}

export async function updateManagedRestrictions(req, res, next) {
  try {
    const config = targetConfig(req.params.kind);
    const restrictions = req.body.restrictions && typeof req.body.restrictions === 'object' ? req.body.restrictions : {};
    const hasRestrictions = Object.values(restrictions).some(Boolean);
    const current = await query(`select account_status from ${config.table} where id = $1`, [req.params.id]);

    if (!current.rows[0]) {
      return res.status(404).json({ message: 'Account not found' });
    }

    const currentStatus = current.rows[0].account_status || 'ACTIVE';
    const status = hasRestrictions ? 'RESTRICTED' : currentStatus === 'RESTRICTED' ? 'ACTIVE' : currentStatus;

    const { rows } = await query(
      `update ${config.table}
       set restriction_data = $1,
           account_status = $2,
           restricted_at = ${hasRestrictions ? 'now()' : 'null'},
           restricted_by = $3,
           updated_at = now()
       where id = $4
       returning ${config.detailSelect}`,
      [restrictions, status, hasRestrictions ? adminId(req) : null, req.params.id]
    );

    if (!rows[0]) {
      return res.status(404).json({ message: 'Account not found' });
    }

    await writeAudit({
      req,
      config,
      targetId: req.params.id,
      action: hasRestrictions ? `${config.type}_RESTRICTED` : `${config.type}_RESTRICTIONS_REMOVED`,
      metadata: { restrictions }
    });
    return res.json({ account: rows[0] });
  } catch (error) {
    return next(error);
  }
}

export async function forceLogoutManagedAccount(req, res, next) {
  try {
    const config = targetConfig(req.params.kind);
    const { rows } = await query(
      `update ${config.table}
       set token_version = token_version + 1, updated_at = now()
       where id = $1
       returning id, token_version`,
      [req.params.id]
    );

    if (!rows[0]) {
      return res.status(404).json({ message: 'Account not found' });
    }

    await writeAudit({ req, config, targetId: req.params.id, action: `${config.type}_FORCE_LOGOUT` });
    return res.json({ message: 'Active sessions invalidated' });
  } catch (error) {
    return next(error);
  }
}

export async function requestManagedPasswordReset(req, res, next) {
  try {
    const config = targetConfig(req.params.kind);
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    const exists = await query(`select id from ${config.table} where id = $1`, [req.params.id]);
    if (!exists.rows[0]) {
      return res.status(404).json({ message: 'Account not found' });
    }

    await query(
      `insert into password_reset_requests (target_id, target_type, requested_by, token_hash, expires_at)
       values ($1, $2, $3, $4, $5)`,
      [req.params.id, config.type, adminId(req), tokenHash, expiresAt]
    );
    await query(`update ${config.table} set password_reset_requested_at = now() where id = $1`, [req.params.id]);
    await writeAudit({ req, config, targetId: req.params.id, action: `${config.type}_PASSWORD_RESET_REQUESTED` });

    return res.json({
      message: 'Password reset requested. Send the reset workflow through your configured email/SMS provider.',
      expiresAt
    });
  } catch (error) {
    return next(error);
  }
}

export async function listAuditLogs(_req, res, next) {
  try {
    const { rows } = await query(
      `select id, admin_id, target_id, target_type, action, reason, metadata, created_at
       from admin_audit_logs
       order by created_at desc
       limit 100`
    );
    res.json({ rows });
  } catch (error) {
    next(error);
  }
}
