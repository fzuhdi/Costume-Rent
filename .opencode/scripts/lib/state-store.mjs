import fs from 'node:fs';
import path from 'node:path';

export function readJsonFile(filePath, fallback = undefined) {
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

export function tryReadJsonFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return { ok: false, value: null, error: `${filePath} is missing` };
  }

  try {
    return { ok: true, value: readJsonFile(filePath), error: null };
  } catch (error) {
    return { ok: false, value: null, error: `${filePath} is invalid JSON: ${error.message}` };
  }
}

export function writeJsonFile(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

export function ensureParentDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}
