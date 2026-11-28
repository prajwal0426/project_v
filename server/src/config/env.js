import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const environmentFile = path.resolve(currentDirectory, '../../.env');
const emailVerificationWasProvidedByRuntime = Object.hasOwn(process.env, 'EMAIL_VERIFICATION_ENABLED');

// Load server/.env independently of the shell's current working directory.
const environmentResult = dotenv.config({ path: environmentFile });

export const EMAIL_VERIFICATION_SETTING_SOURCE = emailVerificationWasProvidedByRuntime
  ? 'process environment'
  : Object.hasOwn(environmentResult.parsed || {}, 'EMAIL_VERIFICATION_ENABLED')
    ? 'server/.env'
    : 'secure default';
