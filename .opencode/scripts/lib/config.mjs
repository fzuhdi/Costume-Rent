import fs from 'node:fs';
import path from 'node:path';
import { assertRelativeProjectPath, normalizeRelativePath } from './paths.mjs';
import { readJsonFile } from './state-store.mjs';

export const KNOWN_WORKFLOW_MODES = new Set([
  'ui-tracer',
  'light-implementation',
  'strict-tdd',
  'parallel-runtime',
]);

export const KNOWN_WORKFLOW_STAGES = new Set([
  'design-ui',
  'integrate-backend',
  'deployment',
  'workflow-maintenance',
]);

export const KNOWN_QUALITY_POLICIES = new Set([
  'exploratory',
  'light-checks',
  'strict-tdd',
]);

export const LEGACY_WORKFLOW_MODE_MAP = {
  'ui-tracer': { workflow_stage: 'design-ui', quality_policy: 'exploratory' },
  'light-implementation': { workflow_stage: 'integrate-backend', quality_policy: 'light-checks' },
  'strict-tdd': { workflow_stage: 'integrate-backend', quality_policy: 'strict-tdd' },
};

export const DEFAULT_WORKFLOW = {
  enabled_modes: ['ui-tracer', 'light-implementation'],
  default_mode: 'ui-tracer',
  max_parallel: 1,
  product_stages: ['design-ui', 'integrate-backend', 'deployment'],
  internal_stages: ['workflow-maintenance'],
  quality_policies: ['exploratory', 'light-checks', 'strict-tdd'],
  default_stage: 'design-ui',
  default_quality_policy: 'exploratory',
  legacy_mode_map: LEGACY_WORKFLOW_MODE_MAP,
};

export const DEFAULT_ARTIFACTS = {
  root: '.artifacts',
  playwright: {
    output_dir: '.artifacts/playwright/test-results',
    html_report: '.artifacts/playwright/html-report',
    screenshots: '.artifacts/playwright/screenshots',
  },
  playwright_mcp: '.artifacts/playwright-mcp',
  opencode: '.artifacts/opencode',
};

export const DEFAULT_DOCS = {
  root: 'docs',
  acceptance: 'docs/acceptance',
  plans: 'docs/plans',
  tickets: 'docs/tickets',
  workflow_changes: 'docs/workflow-changes',
  runbooks: 'docs/runbooks',
};

function normalizeModeList(value) {
  if (!Array.isArray(value) || value.length === 0) return [...DEFAULT_WORKFLOW.enabled_modes];
  return [...new Set(value.map(item => String(item).trim()).filter(Boolean))];
}

function normalizeStringList(value, fallback, key, known = null) {
  const normalized = Array.isArray(value) && value.length
    ? [...new Set(value.map(item => String(item).trim()).filter(Boolean))]
    : [...fallback];
  if (!normalized.length) throw new Error(`workflow.${key} must contain at least one value.`);
  if (known) {
    for (const item of normalized) {
      if (!known.has(item)) throw new Error(`Unknown workflow.${key} entry: ${item}`);
    }
  }
  return normalized;
}

function normalizeLegacyModeMap(value = {}) {
  const map = { ...LEGACY_WORKFLOW_MODE_MAP, ...value };
  for (const [mode, mapping] of Object.entries(map)) {
    if (!KNOWN_WORKFLOW_MODES.has(mode)) throw new Error(`Unknown workflow.legacy_mode_map entry: ${mode}`);
    if (!mapping || typeof mapping !== 'object' || Array.isArray(mapping)) {
      throw new Error(`workflow.legacy_mode_map.${mode} must be an object.`);
    }
    if (!KNOWN_WORKFLOW_STAGES.has(mapping.workflow_stage)) {
      throw new Error(`workflow.legacy_mode_map.${mode}.workflow_stage is unknown: ${mapping.workflow_stage}`);
    }
    if (!KNOWN_QUALITY_POLICIES.has(mapping.quality_policy)) {
      throw new Error(`workflow.legacy_mode_map.${mode}.quality_policy is unknown: ${mapping.quality_policy}`);
    }
  }
  return map;
}

function normalizeArtifacts(rawArtifacts = {}) {
  const root = normalizeRelativePath(rawArtifacts.root || DEFAULT_ARTIFACTS.root);
  const playwright = rawArtifacts.playwright || {};
  const artifacts = {
    root,
    playwright: {
      output_dir: normalizeRelativePath(playwright.output_dir || path.posix.join(root, 'playwright/test-results')),
      html_report: normalizeRelativePath(playwright.html_report || path.posix.join(root, 'playwright/html-report')),
      screenshots: normalizeRelativePath(playwright.screenshots || path.posix.join(root, 'playwright/screenshots')),
    },
    playwright_mcp: normalizeRelativePath(rawArtifacts.playwright_mcp || path.posix.join(root, 'playwright-mcp')),
    opencode: normalizeRelativePath(rawArtifacts.opencode || path.posix.join(root, 'opencode')),
  };

  for (const [key, value] of [
    ['artifacts.root', artifacts.root],
    ['artifacts.playwright.output_dir', artifacts.playwright.output_dir],
    ['artifacts.playwright.html_report', artifacts.playwright.html_report],
    ['artifacts.playwright.screenshots', artifacts.playwright.screenshots],
    ['artifacts.playwright_mcp', artifacts.playwright_mcp],
    ['artifacts.opencode', artifacts.opencode],
  ]) {
    assertRelativeProjectPath(value, key);
  }

  return artifacts;
}

function normalizeDocs(rawDocs = {}, rawAcceptance = {}) {
  const docs = {
    root: normalizeRelativePath(rawDocs.root || DEFAULT_DOCS.root),
    acceptance: normalizeRelativePath(rawDocs.acceptance || rawAcceptance.dir || DEFAULT_DOCS.acceptance),
    plans: normalizeRelativePath(rawDocs.plans || DEFAULT_DOCS.plans),
    tickets: normalizeRelativePath(rawDocs.tickets || DEFAULT_DOCS.tickets),
    workflow_changes: normalizeRelativePath(rawDocs.workflow_changes || DEFAULT_DOCS.workflow_changes),
    runbooks: normalizeRelativePath(rawDocs.runbooks || DEFAULT_DOCS.runbooks),
  };

  for (const [key, value] of Object.entries(docs)) {
    assertRelativeProjectPath(value, `docs.${key}`);
    if (value === '.opencode' || value.startsWith('.opencode/') || value === '.codex' || value.startsWith('.codex/')) {
      throw new Error(`docs.${key} must live under the project docs root, not inside workflow adapters: ${value}`);
    }
  }

  return docs;
}

export function normalizeProjectConfig(rawConfig = {}) {
  const rawWorkflow = rawConfig.workflow || {};
  const enabledModes = normalizeModeList(rawWorkflow.enabled_modes);
  for (const mode of enabledModes) {
    if (!KNOWN_WORKFLOW_MODES.has(mode)) throw new Error(`Unknown workflow.enabled_modes entry: ${mode}`);
  }

  const defaultMode = rawWorkflow.default_mode || DEFAULT_WORKFLOW.default_mode;
  if (!KNOWN_WORKFLOW_MODES.has(defaultMode)) throw new Error(`Unknown workflow.default_mode: ${defaultMode}`);
  if (!enabledModes.includes(defaultMode)) {
    throw new Error(`workflow.default_mode must be present in workflow.enabled_modes: ${defaultMode}`);
  }

  const maxParallel = Number(rawWorkflow.max_parallel ?? DEFAULT_WORKFLOW.max_parallel);
  if (!Number.isInteger(maxParallel) || maxParallel < 1) {
    throw new Error('workflow.max_parallel must be a positive integer.');
  }

  const productStages = normalizeStringList(rawWorkflow.product_stages, DEFAULT_WORKFLOW.product_stages, 'product_stages', KNOWN_WORKFLOW_STAGES);
  const internalStages = normalizeStringList(rawWorkflow.internal_stages, DEFAULT_WORKFLOW.internal_stages, 'internal_stages', KNOWN_WORKFLOW_STAGES);
  const qualityPolicies = normalizeStringList(rawWorkflow.quality_policies, DEFAULT_WORKFLOW.quality_policies, 'quality_policies', KNOWN_QUALITY_POLICIES);
  const defaultStage = rawWorkflow.default_stage || DEFAULT_WORKFLOW.default_stage;
  const defaultQualityPolicy = rawWorkflow.default_quality_policy || DEFAULT_WORKFLOW.default_quality_policy;
  const knownConfiguredStages = new Set([...productStages, ...internalStages]);
  if (!knownConfiguredStages.has(defaultStage)) {
    throw new Error(`workflow.default_stage must be declared in product_stages or internal_stages: ${defaultStage}`);
  }
  if (!qualityPolicies.includes(defaultQualityPolicy)) {
    throw new Error(`workflow.default_quality_policy must be declared in quality_policies: ${defaultQualityPolicy}`);
  }

  return {
    ...rawConfig,
    workflow: {
      enabled_modes: enabledModes,
      default_mode: defaultMode,
      max_parallel: maxParallel,
      product_stages: productStages,
      internal_stages: internalStages,
      quality_policies: qualityPolicies,
      default_stage: defaultStage,
      default_quality_policy: defaultQualityPolicy,
      legacy_mode_map: normalizeLegacyModeMap(rawWorkflow.legacy_mode_map),
    },
    docs: normalizeDocs(rawConfig.docs, rawConfig.acceptance),
    artifacts: normalizeArtifacts(rawConfig.artifacts),
  };
}

export function loadProjectConfig(root = process.cwd()) {
  const file = path.join(root, '.opencode', 'project.json');
  const raw = fs.existsSync(file) ? readJsonFile(file) : {};
  return {
    file,
    raw,
    config: normalizeProjectConfig(raw),
  };
}

export function workflowModeEnabled(config, mode) {
  return Boolean(config?.workflow?.enabled_modes?.includes(mode));
}

export function requireWorkflowMode(config, mode, context = 'workflow') {
  if (!workflowModeEnabled(config, mode)) {
    throw new Error(`${context} requires workflow mode "${mode}" to be enabled in .opencode/project.json.`);
  }
}

export function requiredObject(value, key) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`Missing required .opencode/project.json ${key} object`);
  }
  return value;
}

export function requiredString(value, key) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`Missing required .opencode/project.json ${key} string`);
  }
  return value;
}

export function requiredNumber(value, key) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    throw new Error(`Missing required numeric .opencode/project.json ${key}`);
  }
  return number;
}

export function requiredStringArray(value, key) {
  if (!Array.isArray(value) || value.length === 0 || value.some(item => typeof item !== 'string' || item.trim() === '')) {
    throw new Error(`Missing required non-empty .opencode/project.json ${key} array`);
  }
  return value;
}

export function assertRuntimeFileIsSafeToCopy(relativePath) {
  assertRelativeProjectPath(relativePath, 'runtime.runtime_files');
  const normalized = relativePath.replace(/\\/g, '/');
  const basename = path.posix.basename(normalized).toLowerCase();
  if (basename === '.env' || basename.startsWith('.env.')) {
    throw new Error(`Project adapter runtime.runtime_files must not copy env file ${relativePath}; use runtime.generated_env_files for dev-only ticket env.`);
  }
}

export function runtimeEnvKey(runtimeConfig, name, fallback) {
  return runtimeConfig.env_keys?.[name] || fallback;
}

export function interpolateRuntimeValue(value, env) {
  return String(value).replace(/\{([A-Z0-9_]+)\}/g, (_, key) => env[key] ?? '');
}
