import { randomUUID } from 'node:crypto';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';

const allowedExtensions = new Set(['.pdf', '.png', '.jpg', '.jpeg', '.webp', '.zip']);

export async function storeVerifiedRegistrationFile(file) {
  if (!file?.buffer) return undefined;

  const extension = path.extname(file.originalname || '').toLowerCase();
  if (!allowedExtensions.has(extension)) {
    const error = new Error('Unsupported registration document type.');
    error.status = 422;
    throw error;
  }

  const directory = path.resolve(process.cwd(), 'uploads');
  await mkdir(directory, { recursive: true });
  const filePath = path.join(directory, `${Date.now()}-${randomUUID()}${extension}`);
  await writeFile(filePath, file.buffer, { flag: 'wx', mode: 0o600 });
  return filePath;
}

export async function removeRegistrationFile(filePath) {
  if (filePath) await unlink(filePath).catch(() => {});
}
