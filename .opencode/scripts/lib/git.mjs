import { spawnSync } from 'node:child_process';

export function runCapture(command, args, options = {}) {
  const useShell = options.shell ?? (process.platform === 'win32' && /\.cmd$/i.test(command));
  const result = spawnSync(command, args, {
    cwd: options.cwd || process.cwd(),
    env: options.env || process.env,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: false,
    shell: useShell,
    timeout: options.timeout,
  });

  if (result.error) {
    return {
      ok: false,
      status: result.status,
      stdout: result.stdout || '',
      stderr: result.stderr || result.error.message,
    };
  }

  return {
    ok: result.status === 0,
    status: result.status,
    stdout: result.stdout || '',
    stderr: result.stderr || '',
  };
}

export function gitTrackedPaths(root = process.cwd()) {
  const result = runCapture('git', ['ls-files'], { cwd: root });
  if (!result.ok) return new Set();
  return new Set(result.stdout.split(/\r?\n/).map(line => line.trim()).filter(Boolean).map(line => line.replace(/\\/g, '/')));
}

export function gitCheckIgnored(root, relativePath) {
  const result = runCapture('git', ['check-ignore', '--no-index', '-q', relativePath], { cwd: root });
  return result.status === 0;
}

export function gitDirtyPaths(root = process.cwd()) {
  const result = runCapture('git', ['status', '--porcelain'], { cwd: root });
  if (!result.ok) return null;
  return result.stdout.split(/\r?\n/).filter(Boolean);
}
