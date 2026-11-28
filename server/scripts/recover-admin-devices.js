import { timingSafeEqual } from 'node:crypto';
import '../src/config/env.js';
import { closeDB, connectDB } from '../src/config/db.js';
import { AdminDevice, AdminSession } from '../src/models/index.js';
import { recordAdminDeviceRecovery } from '../src/services/admin-device.service.js';

function safeEqual(left, right) {
  const leftBytes = Buffer.from(String(left));
  const rightBytes = Buffer.from(String(right));
  return leftBytes.length === rightBytes.length && timingSafeEqual(leftBytes, rightBytes);
}

function promptHidden(label) {
  const input = process.stdin;
  if (!input.isTTY || typeof input.setRawMode !== 'function') {
    throw new Error('Run recovery from an interactive server terminal.');
  }

  return new Promise((resolve, reject) => {
    let value = '';
    process.stdout.write(label);
    input.setRawMode(true);
    input.resume();

    const finish = (error) => {
      input.off('data', onData);
      input.setRawMode(false);
      input.pause();
      process.stdout.write('\n');
      if (error) reject(error);
      else resolve(value);
    };

    const onData = (buffer) => {
      for (const character of buffer.toString('utf8')) {
        if (character === '\u0003') {
          finish(new Error('Recovery cancelled.'));
          return;
        }
        if (character === '\r' || character === '\n') {
          finish();
          return;
        }
        if (character === '\u007f' || character === '\b') {
          value = [...value].slice(0, -1).join('');
        } else {
          value += character;
        }
      }
    };

    input.on('data', onData);
  });
}

async function main() {
  const configuredUsername = process.env.ADMIN_USERNAME;
  const configuredPassword = process.env.ADMIN_PASSWORD;
  if (!configuredUsername || !configuredPassword) {
    throw new Error('Admin recovery requires ADMIN_USERNAME and ADMIN_PASSWORD in server/.env.');
  }

  const username = await promptHidden('Admin username: ');
  const password = await promptHidden('Admin password (input hidden): ');
  if (!safeEqual(username.trim(), configuredUsername) || !safeEqual(password, configuredPassword)) {
    throw new Error('Admin recovery verification failed.');
  }

  const confirmation = await promptHidden('Type RECOVER VERTEX ADMIN DEVICES to continue: ');
  if (confirmation !== 'RECOVER VERTEX ADMIN DEVICES') {
    throw new Error('Recovery confirmation did not match. No devices were changed.');
  }

  await connectDB();
  const now = new Date();
  const [deviceResult] = await Promise.all([
    AdminDevice.updateMany(
      { adminKey: 'env-admin', status: 'active' },
      { $set: { status: 'revoked', revokedAt: now, revokedBy: configuredUsername } }
    ),
    AdminSession.updateMany(
      { revokedAt: null },
      { $set: { revokedAt: now } }
    )
  ]);

  await recordAdminDeviceRecovery(configuredUsername, deviceResult.modifiedCount);
  process.stdout.write(`Recovery complete. Revoked ${deviceResult.modifiedCount} device registration(s) and all Admin sessions.\n`);
}

main()
  .catch((error) => {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeDB().catch(() => {});
  });
