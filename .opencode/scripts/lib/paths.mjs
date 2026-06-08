import path from 'node:path';

export function toPosixPath(value) {
  return String(value || '').replace(/\\/g, '/');
}

export function repoRelative(root, filePath) {
  return toPosixPath(path.relative(root, filePath));
}

export function isSafeRelativePath(relativePath) {
  if (typeof relativePath !== 'string' || relativePath.trim() === '') return false;
  if (path.isAbsolute(relativePath) || /^[A-Za-z]:[\\/]/.test(relativePath)) return false;
  return !toPosixPath(relativePath).split('/').includes('..');
}

export function assertRelativeProjectPath(relativePath, key = 'path') {
  if (!isSafeRelativePath(relativePath)) {
    throw new Error(`Project adapter field ${key} must be a relative path inside the project: ${relativePath}`);
  }
}

export function resolveProjectPath(root, relativePath, key = 'path') {
  assertRelativeProjectPath(relativePath, key);
  return path.join(root, ...toPosixPath(relativePath).split('/'));
}

export function normalizeRelativePath(relativePath) {
  assertRelativeProjectPath(relativePath);
  return toPosixPath(relativePath).replace(/^\.\/+/, '').replace(/\/+$/, '');
}

export function pathIsUnder(repoPath, rootPath) {
  const normalizedPath = `${toPosixPath(repoPath).replace(/\/+$/, '')}/`;
  const normalizedRoot = `${toPosixPath(rootPath).replace(/\/+$/, '')}/`;
  return normalizedPath === normalizedRoot || normalizedPath.startsWith(normalizedRoot);
}
