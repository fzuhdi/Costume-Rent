import path from 'node:path';
import { readJsonFile, writeJsonFile } from './state-store.mjs';

export function defaultLeaseRegistry(root = process.cwd()) {
  return path.join(root, '.opencode', 'state', 'ticket-leases.json');
}

export function registryPathFor(root, values = {}) {
  return path.resolve(values.leaseRegistry || values.registry || defaultLeaseRegistry(root));
}

export function normalizeLease(lease) {
  if (!lease || !lease.deadlineAt || !['running', 'deadline_expired'].includes(lease.status)) return lease;
  if (Date.parse(lease.deadlineAt) <= Date.now()) return { ...lease, status: 'deadline_expired' };
  return lease;
}

export function loadLeaseRegistry(root, values = {}) {
  const registryPath = registryPathFor(root, values);
  const registry = readJsonFile(registryPath, { schemaVersion: 1, leases: {} });
  if (registry.schemaVersion !== 1 || typeof registry.leases !== 'object' || registry.leases === null) {
    throw new Error(`Invalid ticket lease registry: ${path.relative(root, registryPath).replace(/\\/g, '/')}`);
  }
  return { registryPath, registry };
}

export function saveLeaseRegistry(root, registry, values = {}) {
  const registryPath = registryPathFor(root, values);
  registry.updatedAt = new Date().toISOString();
  if (!values.dryRun) writeJsonFile(registryPath, registry);
  return registryPath;
}
