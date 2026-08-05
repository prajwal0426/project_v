import bcrypt from 'bcryptjs';
import { query } from '../config/db.js';
import { hasLatestLegalConsent, LEGAL_VERSIONS, validateLegalAcceptance } from '../services/legal.service.js';
import { signToken } from '../services/token.service.js';
import { OAuth2Client } from 'google-auth-library';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

function assertAdult(dateOfBirth) {
  const ageMs = Date.now() - new Date(dateOfBirth).getTime();
  const age = new Date(ageMs).getUTCFullYear() - 1970;
  if (age < 18) {
    const error = new Error('VERTEX requires users to be 18 or older');
    error.status = 403; 
    throw error;
  }
}

async function createAccount({ table, role, body, idFile }) {
  const legalConsent = validateLegalAcceptance(body);

  if (role === 'user') {
    assertAdult(body.dateOfBirth);
  }

  const passwordHash = await bcrypt.hash(body.password, 12);
  const fields = table === 'companies'
    ? ['name', 'email', 'password_hash', 'verification_file', 'privacy_policy_accepted', 'terms_accepted', 'age_confirmed', 'legal_accepted_at', 'privacy_policy_version', 'terms_version']
    : ['name', 'email', 'password_hash', 'date_of_birth', 'government_id_file', 'privacy_policy_accepted', 'terms_accepted', 'age_confirmed', 'legal_accepted_at', 'privacy_policy_version', 'terms_version'];
  const values = table === 'companies'
    ? [body.name, body.email, passwordHash, idFile?.path, legalConsent.privacyPolicyAccepted, legalConsent.termsAccepted, legalConsent.ageConfirmed, new Date(), LEGAL_VERSIONS.privacyPolicy, LEGAL_VERSIONS.terms]
    : [body.name, body.email, passwordHash, body.dateOfBirth, idFile?.path, legalConsent.privacyPolicyAccepted, legalConsent.termsAccepted, legalConsent.ageConfirmed, new Date(), LEGAL_VERSIONS.privacyPolicy, LEGAL_VERSIONS.terms];
  const placeholders = values.map((_, index) => `$${index + 1}`).join(', ');

  const { rows } = await query(
    `insert into ${table} (${fields.join(', ')}) values (${placeholders}) returning id, name, email`,
    values
  );

  const account = rows[0];
  return {
    account,
    token: signToken({ id: account.id, role, email: account.email })
  };
}

async function loginAccount({ table, role, email, password }) {
  const { rows } = await query(`select * from ${table} where email = $1`, [email]);
  const account = rows[0];

  if (!account || !(await bcrypt.compare(password, account.password_hash))) {
    const error = new Error('Invalid email or password');
    error.status = 401;
    throw error;
  }

  if ((role === 'user' || role === 'company') && !hasLatestLegalConsent(account)) {
    const error = new Error('Latest Privacy Policy, Terms & Conditions, and age confirmation must be accepted before accessing VERTEX');
    error.status = 403;
    throw error;
  }

  return {
    account: { id: account.id, name: account.name, email: account.email },
    token: signToken({ id: account.id, role, email: account.email })
  };
}

export async function registerUser(req, res, next) {
  try {
    res.status(201).json(await createAccount({ table: 'users', role: 'user', body: req.body, idFile: req.file }));
  } catch (error) {
    next(error);
  }
}

export async function loginUser(req, res, next) {
  try {
    res.json(await loginAccount({ table: 'users', role: 'user', ...req.body }));
  } catch (error) {
    next(error);
  }
}

export async function registerCompany(req, res, next) {
  try {
    res.status(201).json(await createAccount({ table: 'companies', role: 'company', body: req.body, idFile: req.file }));
  } catch (error) {
    next(error);
  }
}

export async function loginCompany(req, res, next) {
  try {
    res.json(await loginAccount({ table: 'companies', role: 'company', ...req.body }));
  } catch (error) {
    next(error);
  }
}

export async function loginAdmin(req, res, next) {
  try {
    res.json(await loginAccount({ table: 'admins', role: 'admin', ...req.body }));
  } catch (error) {
    next(error);
  }
}

export async function appleLogin(_req, res) {
  res.json({
    message: 'Apple login endpoint ready. Verify Apple identity token server-side before issuing JWT.',
    clientId: process.env.APPLE_CLIENT_ID
  });
}

export async function googleLogin(req, res, next) {
  try {
    const { credential, access_token } = req.body;

    if (!credential && !access_token) {
      return res.status(400).json({
        message: 'Google credential or access token is required'
      });
    }

    let email, name;

    if (credential) {
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID
      });

      const payload = ticket.getPayload();
      email = payload.email;
      name = payload.name;
    } else {
      const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: {
          Authorization: `Bearer ${access_token}`
        }
      });
      if (!response.ok) {
        return res.status(400).json({
          message: 'Failed to verify Google access token'
        });
      }
      const payload = await response.json();
      email = payload.email;
      name = payload.name;
    }

    let result = await query(
      `SELECT * FROM users WHERE email = $1`,
      [email]
    );

    let user = result.rows[0];

    if (!user) {
      result = await query(
        `
        INSERT INTO users
        (
          name,
          email,
          password_hash,
          date_of_birth,
          privacy_policy_accepted,
          terms_accepted,
          age_confirmed,
          legal_accepted_at,
          privacy_policy_version,
          terms_version
        )
        VALUES
        (
          $1,
          $2,
          '',
          '2000-01-01',
          true,
          true,
          true,
          now(),
          $3,
          $4
        )
        RETURNING *
        `,
        [
          name,
          email,
          LEGAL_VERSIONS.privacyPolicy,
          LEGAL_VERSIONS.terms
        ]
      );

      user = result.rows[0];
    }

    const token = signToken({
      id: user.id,
      role: "user",
      email: user.email
    });

    res.json({
      token,
      account: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });

  } catch (err) {
    next(err);
  }
}

export async function acceptLatestLegal(req, res, next) {
  try {
    if (!['user', 'company'].includes(req.user?.role)) {
      return res.status(403).json({ message: 'Legal consent update is available for user and company accounts only' });
    }

    const consent = validateLegalAcceptance(req.body);
    const table = req.user.role === 'company' ? 'companies' : 'users';
    const { rows } = await query(
      `update ${table}
       set privacy_policy_accepted = $1,
           terms_accepted = $2,
           age_confirmed = $3,
           legal_accepted_at = now(),
           privacy_policy_version = $4,
           terms_version = $5,
           updated_at = now()
       where id = $6
       returning id, name, email, privacy_policy_version, terms_version, legal_accepted_at`,
      [consent.privacyPolicyAccepted, consent.termsAccepted, consent.ageConfirmed, LEGAL_VERSIONS.privacyPolicy, LEGAL_VERSIONS.terms, req.user.id]
    );

    return res.json({ account: rows[0] });
  } catch (error) {
    return next(error);
  }
}
