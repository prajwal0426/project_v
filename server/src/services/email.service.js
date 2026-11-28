import nodemailer from 'nodemailer';

function smtpConfiguration() {
  const host = process.env.SMTP_HOST?.trim();
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER?.trim();
  const password = process.env.SMTP_PASSWORD;
  const from = process.env.SMTP_FROM?.trim() || user;

  if (!host || !Number.isInteger(port) || port < 1 || port > 65535 || !from) return null;
  if (Boolean(user) !== Boolean(password)) return null;

  return {
    host,
    port,
    secure: process.env.SMTP_SECURE === 'true' || port === 465,
    from,
    ...(user ? { auth: { user, pass: password } } : {})
  };
}

export function isEmailDeliveryConfigured() {
  return Boolean(smtpConfiguration());
}

export async function sendRegistrationCode(email, code) {
  const config = smtpConfiguration();
  if (!config) {
    const error = new Error('Email verification is not configured.');
    error.status = 503;
    throw error;
  }

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    ...(config.auth ? { auth: config.auth } : {})
  });

  const text = [
    'Verify your email address for VERTEX.',
    '',
    `Your verification code is ${code}.`,
    'This code expires in 5 minutes and can only be used once.',
    'Never share this code. VERTEX support will never ask you for it.',
    '',
    'If you did not start this registration, you can ignore this email.'
  ].join('\n');
  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;background:#080711;color:#f7f2ff;font-family:Arial,Helvetica,sans-serif">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#080711;padding:32px 12px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;border:1px solid #59317b;border-radius:12px;background:#11101d">
        <tr><td style="padding:32px 28px;text-align:center">
          <p style="margin:0 0 8px;color:#c58cff;font-size:12px;font-weight:bold;letter-spacing:4px">VERTEX</p>
          <h1 style="margin:0 0 12px;font-size:24px">Verify your email</h1>
          <p style="margin:0 0 24px;color:#c3bbd1;line-height:1.6">Enter this code to continue creating your VERTEX account.</p>
          <div style="display:inline-block;padding:14px 24px;border:1px solid #8a4ed0;border-radius:8px;background:#1b1428;color:#fff;font-size:32px;font-weight:bold;letter-spacing:8px">${code}</div>
          <p style="margin:24px 0 8px;color:#d8d0e4">This code expires in <strong>5 minutes</strong> and can only be used once.</p>
          <p style="margin:0;color:#9991a8;font-size:13px;line-height:1.6">For your security, never share this code. VERTEX support will never ask for it. If you did not start this registration, ignore this email.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  try {
    await transporter.sendMail({
      from: config.from,
      to: email,
      subject: 'Verify Your Email — VERTEX',
      text,
      html
    });
  } catch {
    const error = new Error('Unable to send the verification email. Please try again shortly.');
    error.status = 503;
    throw error;
  }
}
