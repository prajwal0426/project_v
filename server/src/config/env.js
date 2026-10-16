import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const environmentFile = path.resolve(currentDirectory, '../../.env');

// Load server/.env independently of the shell's current working directory.
dotenv.config({ path: environmentFile });
