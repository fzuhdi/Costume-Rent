#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const agentsDir = path.join(root, '.opencode', 'agents');
const workflowModelsPath = path.join(root, '.opencode', 'workflow-models.json');
const modelCapabilitiesPath = path.join(root, '.opencode', 'model-capabilities.md');

const ALL_ROLES = ['developer', 'sdet', 'orchestrator', 'reviewer'];
const ROLE_AGENT_FILES = {
  sdet: 'sdet.md',
  developer: 'developer.md',
  orchestrator: 'orchestrator.md',
  reviewer: 'reviewer.md',
};

// Capability categories from model-capabilities.md
const CAPABILITY_WEIGHTS = {
  orchestrator: { reasoning: 5, general: 3, 'fast-general': 1, coding: 0, 'fast-coding': 0, light: 0 },
  reviewer: { reasoning: 5, general: 3, 'fast-general': 2, coding: 0, 'fast-coding': 0, light: 0 },
  developer: { reasoning: 2, general: 2, 'fast-general': 1, coding: 5, 'fast-coding': 4, light: 0 },
  sdet: { reasoning: 2, general: 2, 'fast-general': 1, coding: 5, 'fast-coding': 4, light: 0 },
};

function usage() {
  return `Usage: node .opencode/scripts/resolve-agent-models.mjs [--dry-run] [--write] [--json] [--roles sdet,developer] [--set role=model]
  Default: --dry-run --json
  --dry-run    Read-only report; no files modified (default)
  --write      Update agent frontmatter model lines
  --json       Machine-readable JSON output
  --roles      Comma-separated subset of roles (default: all)
  --set        Repeatable explicit role assignment, e.g. --set developer=openai/gpt-5.3-codex`;
}

function parseRoleAssignment(raw) {
  const separator = raw.indexOf('=');
  if (separator === -1) throw new Error(`Expected role=model for --set, got: ${raw}`);
  const role = raw.slice(0, separator).trim();
  const model = raw.slice(separator + 1).trim();
  if (!role || !model) throw new Error(`Expected role=model for --set, got: ${raw}`);
  return { role, model };
}

function addOverride(values, raw) {
  const { role, model } = parseRoleAssignment(raw);
  values.overrides[role] = model;
}

function parseArgs(argv) {
  const values = {
    dryRun: !argv.includes('--write'),
    write: false,
    json: argv.includes('--json'),
    roles: null,
    overrides: {},
    help: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === '--help' || token === '-h') { values.help = true; continue; }
    if (token === '--dry-run') { values.dryRun = true; continue; }
    if (token === '--write') { values.dryRun = false; values.write = true; continue; }
    if (token === '--json') { values.json = true; continue; }
    if (token === '--set') {
      const next = argv[index + 1];
      if (!next || next.startsWith('--')) throw new Error('Missing value for --set');
      addOverride(values, next);
      index += 1;
      continue;
    }
    if (token.startsWith('--set=')) {
      addOverride(values, token.slice('--set='.length));
      continue;
    }
    if (token === '--roles') {
      const next = argv[index + 1];
      if (!next || next.startsWith('--')) throw new Error('Missing value for --roles');
      values.roles = next.split(',').map(r => r.trim()).filter(Boolean);
      index += 1;
      continue;
    }
    if (token.startsWith('--roles=')) {
      values.roles = token.slice('--roles='.length).split(',').map(r => r.trim()).filter(Boolean);
      continue;
    }
    if (token.startsWith('--')) throw new Error(`Unknown option: ${token}`);
  }

  return values;
}

function validateRoles(values) {
  for (const role of values.roles || []) {
    if (!ROLE_AGENT_FILES[role]) throw new Error(`Unknown role in --roles: ${role}`);
  }
  const activeRoles = new Set(values.roles || ALL_ROLES);
  for (const role of Object.keys(values.overrides)) {
    if (!ROLE_AGENT_FILES[role]) throw new Error(`Unknown role in --set: ${role}`);
    if (!activeRoles.has(role)) throw new Error(`Override role ${role} is not included in --roles`);
  }
}

function validateOverrides(values, available) {
  const availableSet = new Set(available.models);
  for (const [role, model] of Object.entries(values.overrides)) {
    if (!availableSet.has(model)) throw new Error(`Override model for ${role} is not available: ${model}`);
  }
}

function runCapture(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd || root,
    env: options.env || process.env,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: false,
    timeout: 120000,
  });
  return {
    ok: !result.error && result.status === 0,
    status: result.status,
    stdout: result.stdout || '',
    stderr: result.stderr || '',
    error: result.error?.message || null,
  };
}

function getAvailableModels() {
  if (process.env.RESOLVE_AGENT_MODELS_AVAILABLE) {
    const models = process.env.RESOLVE_AGENT_MODELS_AVAILABLE
      .split(/[\s,]+/)
      .map(l => l.trim())
      .filter(Boolean)
      .sort();
    return { ok: true, models, error: null };
  }

  const result = runCapture('opencode', ['models']);
  if (!result.ok) {
    return { ok: false, models: [], error: result.stderr || result.error || 'opencode models failed' };
  }
  const models = result.stdout
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(Boolean)
    .sort();
  return { ok: true, models, error: null };
}

function readJson(filePath) {
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (e) {
    return null;
  }
}

function parseAgentFrontmatter(filePath) {
  if (!fs.existsSync(filePath)) return null;
  const text = fs.readFileSync(filePath, 'utf8');
  const match = text.match(/^(---\r?\n[\s\S]*?\r?\n---)\r?\n([\s\S]*)$/);
  if (!match) return null;
  return { frontmatter: match[1], body: match[2], content: text };
}

function setModelInFrontmatter(frontmatterBlock, newModel) {
  return frontmatterBlock.replace(
    /^model:\s*\S+.*$/m,
    `model: ${newModel}`
  );
}

function parseModelCapabilities() {
  // Parse the model-capabilities.md table into a map: modelId -> { primary, secondary }
  const capabilities = {};

  if (!fs.existsSync(modelCapabilitiesPath)) return capabilities;

  const text = fs.readFileSync(modelCapabilitiesPath, 'utf8');
  // Find the table rows in the Available Models table
  const lines = text.split(/\r?\n/);
  let inTable = false;

  for (const line of lines) {
    // Detect table separator row (|---|)
    if (/^\|[\s-:]+\|[\s-:]+\|[\s-:]+\|[\s-:]+\|/.test(line)) {
      inTable = true;
      continue;
    }

    if (!inTable) continue;
    if (!line.startsWith('|')) { inTable = false; continue; }

    const cells = line.split('|').map(c => c.trim()).filter(Boolean);
    // Expected: model | primary | secondary | best roles | notes
    if (cells.length < 3) continue;
    const modelId = cells[0].replace(/^`|`$/g, '');
    if (!modelId.includes('/')) continue;
    capabilities[modelId] = {
      primary: cells[1] || 'general',
      secondary: cells[2] || '',
    };
  }

  return capabilities;
}

function scoreModel(role, modelId, capabilities, rolePriorities) {
  const cap = capabilities[modelId];
  if (!cap) return 0;

  const weights = CAPABILITY_WEIGHTS[role];
  if (!weights) return 0;

  const primary = cap.primary;
  const secondary = cap.secondary;

  let score = (weights[primary] || 0) + (weights[secondary] || 0) * 0.5;

  // Bonus for being in the workflow-models.json priority list
  const priority = rolePriorities[role];
  if (priority) {
    const index = priority.indexOf(modelId);
    if (index !== -1) {
      score += 10 + Math.max(0, 5 - index); // earlier in list = bigger bonus
    }
  }

  return score;
}

function buildReport(values, available, capabilities, workflowModels) {
  const rolePriorities = workflowModels?.roles || {};
  const roles = values.roles || ALL_ROLES.filter(r => ROLE_AGENT_FILES[r]);

  const resolved = {};

  for (const role of roles) {
    const agentFile = ROLE_AGENT_FILES[role];
    if (!agentFile) continue;

    const agentPath = path.join(agentsDir, agentFile);
    const current = parseAgentFrontmatter(agentPath);
    const currentModel = current
      ? (current.frontmatter.match(/^model:\s*(\S+)/m) || [])[1] || null
      : null;

    const scored = available.models.map(modelId => ({
      model: modelId,
      score: scoreModel(role, modelId, capabilities, rolePriorities),
      current: modelId === currentModel,
    }));

    // Sort by score descending, then by current (prefer currently set), then alphabetical
    scored.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (a.current !== b.current) return a.current ? -1 : 1;
      return a.model.localeCompare(b.model);
    });

    const preferredPath = rolePriorities[role] || [];
    const availablePreferred = preferredPath.find(m => available.models.includes(m));
    const topMatch = scored[0];
    const currentAvailable = Boolean(currentModel && available.models.includes(currentModel));
    const overrideModel = values.overrides[role] || null;
    const targetModel = overrideModel || (currentAvailable ? currentModel : topMatch?.model || null);

    resolved[role] = {
      currentModel,
      currentAvailable,
      preferredList: preferredPath,
      availablePreferred,
      recommended: topMatch?.model || null,
      overrideModel,
      targetModel,
      candidates: scored.slice(0, 5).map(s => ({
        model: s.model,
        score: Math.round(s.score * 10) / 10,
      })),
      allCandidates: scored,
    };
  }

  return resolved;
}

function writeAgentModels(resolved, availableModels) {
  const modified = [];
  const availableSet = new Set(availableModels);

  for (const [role, data] of Object.entries(resolved)) {
    const agentFile = ROLE_AGENT_FILES[role];
    if (!agentFile) continue;

    const agentPath = path.join(agentsDir, agentFile);
    const parsed = parseAgentFrontmatter(agentPath);
    if (!parsed) {
      modified.push({ role, file: agentFile, status: 'skipped', reason: 'cannot parse frontmatter' });
      continue;
    }

    const newModel = data.targetModel;
    if (!newModel) {
      modified.push({ role, file: agentFile, status: 'skipped', reason: 'no target model' });
      continue;
    }
    if (!availableSet.has(newModel)) {
      modified.push({ role, file: agentFile, status: 'skipped', reason: `target model unavailable: ${newModel}` });
      continue;
    }
    if (data.currentModel === newModel) {
      modified.push({
        role,
        file: agentFile,
        status: 'unchanged',
        currentModel: newModel,
        reason: data.overrideModel ? 'override already set' : 'already available',
      });
      continue;
    }

    const newFrontmatter = setModelInFrontmatter(parsed.frontmatter, newModel);
    if (newFrontmatter === parsed.frontmatter) {
      modified.push({ role, file: agentFile, status: 'unchanged', currentModel: newModel });
      continue;
    }

    const newContent = newFrontmatter + '\n' + parsed.body;
    fs.writeFileSync(agentPath, newContent, 'utf8');
    modified.push({
      role,
      file: agentFile,
      status: 'updated',
      oldModel: data.currentModel,
      newModel,
      reason: data.overrideModel ? 'explicit override' : 'recommended fallback',
    });
  }

  return modified;
}

function buildNotes(values, modified) {
  if (!modified) return ['Read-only report. Use --write to apply changes.'];
  if (modified.some(m => m.status === 'updated')) return ['Agent frontmatter updated. OpenCode restart required.'];
  if (modified.some(m => m.status === 'skipped')) return ['Write completed with skipped roles; inspect modified entries.'];
  return ['Write completed. No agent frontmatter changes were needed.'];
}

function printReport(values, available, resolved, modified) {
  if (values.json) {
    console.log(JSON.stringify({
      outcome: 'resolved',
      mode: values.dryRun ? 'dry-run' : 'write',
      availableModels: available.models,
      overrides: values.overrides,
      resolved,
      modified: modified || [],
      notes: buildNotes(values, modified),
    }, null, 2));
    return;
  }

  console.log('=== Model Resolution Report ===');
  console.log(`Available models (${available.models.length}): ${available.models.join(', ')}`);
  console.log('');

  for (const [role, data] of Object.entries(resolved)) {
    console.log(`--- ${role} ---`);
    console.log(`  Current:     ${data.currentModel || '(none)'}`);
    console.log(`  Preferred:   ${data.preferredList.join(' → ') || '(none)'}`);
    console.log(`  Available:   ${data.availablePreferred || '(none from priority list)'}`);
    console.log(`  Recommended: ${data.recommended}`);
    if (data.overrideModel) console.log(`  Override:    ${data.overrideModel}`);
    console.log(`  Target:      ${data.targetModel || '(none)'}`);
    console.log(`  Top candidates:`);
    for (const c of data.candidates) {
      const marker = c.model === data.recommended ? ' ← recommended' : '';
      console.log(`    ${c.score.toFixed(1).padStart(5)}  ${c.model}${marker}`);
    }
    console.log('');
  }

  if (modified) {
    console.log('=== Modified Files ===');
    for (const m of modified) {
      if (m.status === 'updated') {
        console.log(`  UPDATED ${m.file}: ${m.oldModel} → ${m.newModel}`);
      } else if (m.status === 'unchanged') {
        console.log(`  OK      ${m.file}: already ${m.currentModel}`);
      } else {
        console.log(`  SKIPPED ${m.file}: ${m.reason}`);
      }
    }
    if (modified.some(m => m.status === 'updated')) {
      console.log('');
      console.log('RESTART REQUIRED: OpenCode must reload updated agent definitions.');
    } else {
      console.log('No agent frontmatter changes were needed.');
    }
  }
}

function main() {
  const values = parseArgs(process.argv.slice(2));

  if (values.help) {
    console.log(usage());
    process.exit(0);
  }

  validateRoles(values);

  const available = getAvailableModels();
  if (!available.ok) {
    console.error(JSON.stringify({ outcome: 'error', error: available.error }));
    process.exit(1);
  }
  validateOverrides(values, available);

  const workflowModels = readJson(workflowModelsPath);
  if (!workflowModels) {
    console.error(JSON.stringify({ outcome: 'error', error: `Cannot read ${workflowModelsPath}` }));
    process.exit(1);
  }

  const capabilities = parseModelCapabilities();
  const resolved = buildReport(values, available, capabilities, workflowModels);

  if (values.dryRun) {
    printReport(values, available, resolved, null);
  } else {
    const modified = writeAgentModels(resolved, available.models);
    printReport(values, available, resolved, modified);
  }
}

main();
