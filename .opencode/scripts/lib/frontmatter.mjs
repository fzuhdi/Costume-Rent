import fs from 'node:fs';
import path from 'node:path';

function parseScalar(value) {
  const trimmed = String(value || '').trim();
  const quoted = trimmed.match(/^(['"])([\s\S]*)\1$/);
  if (quoted) return quoted[2];

  const inlineArray = trimmed.match(/^\[(.*)\]$/);
  if (inlineArray) {
    const body = inlineArray[1].trim();
    if (!body) return [];
    return body.split(',')
      .map(item => parseScalar(item))
      .filter(item => item !== '');
  }

  if (trimmed === 'null') return null;
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;
  if (/^-?\d+$/.test(trimmed)) return Number(trimmed);
  return trimmed;
}

export function parseFrontmatterText(text, label = 'document') {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return { ok: false, data: null, error: `${label} has no frontmatter` };

  const data = {};
  const errors = [];
  const lines = match[1].split(/\r?\n/);
  let currentListKey = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const listItem = line.match(/^\s+-\s*(.*)$/);
    if (listItem) {
      if (!currentListKey) {
        errors.push(`Unsupported frontmatter list item in ${label}: ${trimmed}`);
        continue;
      }
      if (!Array.isArray(data[currentListKey])) data[currentListKey] = data[currentListKey] ? [data[currentListKey]] : [];
      data[currentListKey].push(parseScalar(listItem[1]));
      continue;
    }

    const item = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*):\s*(.*)$/);
    if (!item) {
      errors.push(`Unsupported frontmatter line in ${label}: ${trimmed}`);
      currentListKey = null;
      continue;
    }

    const key = item[1];
    const value = item[2].trim();
    if (value === '') {
      data[key] = [];
      currentListKey = key;
      continue;
    }

    data[key] = parseScalar(value);
    currentListKey = null;
  }

  if (errors.length) return { ok: false, data, error: errors.join('; ') };
  return { ok: true, data, error: null };
}

export function parseFrontmatterFile(filePath, root = process.cwd()) {
  if (!fs.existsSync(filePath)) {
    return { ok: false, data: null, error: `${path.relative(root, filePath).replace(/\\/g, '/')} is missing` };
  }

  const label = path.relative(root, filePath).replace(/\\/g, '/');
  return parseFrontmatterText(fs.readFileSync(filePath, 'utf8'), label);
}
