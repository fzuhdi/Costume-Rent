#!/usr/bin/env node

/**
 * sync-failure-log.js
 *
 * Reads Playwright JSON test results and appends iteration sections to
 * .opencode/state/feature-{id}/failures.md (one file per feature).
 *
 * Replaces sync-bug-reports.js (per-bug JSON files) with a much simpler
 * append-only markdown log per feature.
 *
 * Usage:
 *   node test/helpers/sync-failure-log.js
 *   node test/helpers/sync-failure-log.js --results test/test-results/results.json
 *   node test/helpers/sync-failure-log.js --dry-run
 *
 * Behavior per AC test outcome:
 *   - FAILED + last status was [open]      → append [open] (still failing)
 *   - FAILED + last status was [verified]  → append [open] (regression)
 *   - FAILED + last status was [sdet-fault]→ append [sdet-fault] (conflict — escalate)
 *   - FAILED + no prior status             → append [open] (new failure)
 *   - PASSED + last status was [open]      → append [verified] (auto)
 *   - PASSED + no prior status             → no entry (clean run, nothing to log)
 *
 * Exits 1 if any test cases latest status is [open] or [todo] (signals orchestrator).
 */

import fs   from 'fs';
import path from 'path';
import { parseArgs } from 'util';

// ── Config ────────────────────────────────────────────────────────────────────

const DEFAULT_RESULTS = 'test-results/results.json';
const STATE_DIR       = '../.opencode/state';
const ISO_NOW         = () => new Date().toISOString();

// ── CLI args ──────────────────────────────────────────────────────────────────

const { values: args } = parseArgs({
  options: {
    results:   { type: 'string',  default: DEFAULT_RESULTS },
    'dry-run': { type: 'boolean', default: false },
    verbose:   { type: 'boolean', default: false },
  }
});

const DRY_RUN      = args['dry-run'];
const VERBOSE      = args['verbose'];
const RESULTS_PATH = args['results'];

const log     = (msg) => console.log(msg);
const verbose = (msg) => { if (VERBOSE) console.log(`  [verbose] ${msg}`); };
const dryLog  = (msg) => { if (DRY_RUN) console.log(`  [dry-run] ${msg}`); };

// ?? test_case_id parsing ?????????????????????????????????????????????????????

function parseTestTitle(title) {
  const idMatch = title.match(/\[([A-Z][A-Z0-9_]*-\d{3})\]/);
  const ac = idMatch ? idMatch[1] : null;
  const feature = ac ? ac.split('-')[0] : 'UNKNOWN';
  return { ac, feature };
}

// ── Failure Reason Extractor (preserved from sync-bug-reports.js) ───────────

function extractFailureDetail(test) {
  const results     = test.results ?? [];
  const lastResult  = results[results.length - 1] ?? {};
  const errors      = results.flatMap(r => r.errors ?? []);
  const attachments = lastResult.attachments ?? [];

  const screenshot = attachments.find(a => a.name === 'screenshot')?.path ?? null;
  const trace      = attachments.find(a => a.name === 'trace')?.path ?? null;
  const duration   = lastResult.duration ? `${(lastResult.duration / 1000).toFixed(1)}s` : null;

  const parsed = errors.map((e) => {
    const raw   = e.message ?? String(e);
    const stack = e.stack   ?? '';
    const expectedMatch = raw.match(/Expected(?:\s+value)?:\s*(.+)/i);
    const receivedMatch = raw.match(/Received(?:\s+value)?:\s*(.+)/i);
    const stackLines = stack.split('\n');
    const appFrame   = stackLines.find(l =>
      l.includes('    at ') &&
      !l.includes('node_modules') &&
      !l.includes('playwright') &&
      !l.includes('internal/')
    );
    return {
      message:  raw.split('\n')[0].trim(),
      expected: expectedMatch?.[1]?.trim() ?? null,
      received: receivedMatch?.[1]?.trim() ?? null,
      location: appFrame?.trim() ?? null,
    };
  });

  const first = parsed[0] ?? {};
  const summary = first.message ?? 'Unknown failure';
  const detailLine = [];
  if (first.expected) detailLine.push(`expected ${first.expected}`);
  if (first.received) detailLine.push(`got ${first.received}`);
  const detail = detailLine.length ? ` — ${detailLine.join(', ')}` : '';

  return {
    summary,
    detail,
    location: first.location ?? null,
    screenshot,
    trace,
    duration,
    retries: results.length - 1,
  };
}

// ── failures.md parsing & writing ────────────────────────────────────────────

function failuresPath(feature) {
  return path.join(STATE_DIR, `feature-${feature}`, 'failures.md');
}

function readFailures(feature) {
  const fp = failuresPath(feature);
  if (!fs.existsSync(fp)) return '';
  return fs.readFileSync(fp, 'utf8');
}

/**
 * Determine the latest status marker for each test_case_id by scanning the markdown.
 * Latest entry wins (file is read top-to-bottom; last match per test_case_id is current).
 *
 * Returns: Map<ac_id, 'open' | 'verified' | 'sdet-fault' | 'todo'>
 */
function parseLatestStatuses(content) {
  const statuses = new Map();
  if (!content) return statuses;
  // Match lines like:  - **LEGACY-014-001** [open] ...
  const lineRe = /^\s*-\s*\*\*([A-Z][A-Z0-9_]*-\d{3})\*\*\s*\[(open|verified|sdet-fault|todo)\]/gm;
  let match;
  while ((match = lineRe.exec(content)) !== null) {
    statuses.set(match[1], match[2]); // last match wins
  }
  return statuses;
}

/**
 * Determine the next iteration number by counting `## Iteration N` headers.
 */
function nextIteration(content) {
  if (!content) return 1;
  const matches = [...content.matchAll(/^##\s+Iteration\s+(\d+)/gm)];
  if (!matches.length) return 1;
  const max = Math.max(...matches.map(m => parseInt(m[1], 10)));
  return max + 1;
}

function ensureFeatureDir(feature) {
  const dir = path.join(STATE_DIR, `feature-${feature}`);
  if (!DRY_RUN) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function appendSection(feature, section) {
  const fp = failuresPath(feature);
  ensureFeatureDir(feature);
  const existing = readFailures(feature);
  const header = existing ? '' : `# Feature ${feature} — Failure Log\n\n`;
  const sep    = existing.endsWith('\n\n') || !existing ? '' : '\n';
  if (!DRY_RUN) {
    fs.writeFileSync(fp, header + existing + sep + section + '\n');
  }
  dryLog(`Would append section to ${fp}`);
}

// ── Build a section from accumulated entries ─────────────────────────────────

function renderSection(iter, entries) {
  const ts = ISO_NOW();
  const lines = [`## Iteration ${iter} — ${ts} (sdet)`, ''];
  for (const e of entries) {
    const tag = `[${e.status}]`;
    let line = `- **${e.ac}** ${tag} ${e.summary}${e.detail || ''}`;
    if (e.note) line += ` (${e.note})`;
    lines.push(line);
    const sub = [];
    if (e.location)   sub.push(`Test: \`${e.location}\``);
    if (e.screenshot) sub.push(`Screenshot: \`${e.screenshot}\``);
    if (e.trace)      sub.push(`Trace: \`${e.trace}\``);
    if (e.duration)   sub.push(`Duration: ${e.duration}, retries: ${e.retries}`);
    for (const s of sub) lines.push(`  - ${s}`);
  }
  return lines.join('\n');
}

// ── Main ─────────────────────────────────────────────────────────────────────

function collectTests(suites, parentTitle = '', acc = []) {
  for (const suite of suites ?? []) {
    const suiteTitle = parentTitle ? `${parentTitle} > ${suite.title}` : suite.title;
    for (const spec of suite.specs ?? []) {
      for (const test of spec.tests ?? []) {
        acc.push({
          title:   spec.title,
          suite:   suiteTitle,
          status:  test.status,
          results: test.results,
        });
      }
    }
    collectTests(suite.suites, suiteTitle, acc);
  }
  return acc;
}

function main() {
  log('');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  log('  sync-failure-log — Playwright → failures.md');
  if (DRY_RUN) log('  MODE: DRY RUN (no files written)');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  log('');

  if (!fs.existsSync(RESULTS_PATH)) {
    log(`ERROR: Results file not found: ${RESULTS_PATH}`);
    log(`Run: cd test && npx playwright test --reporter=json > test-results/results.json`);
    process.exit(1);
  }

  const results = JSON.parse(fs.readFileSync(RESULTS_PATH, 'utf8'));
  const allTests = collectTests(results.suites);
  log(`Found ${allTests.length} tests in ${RESULTS_PATH}`);
  log('');

  // Group entries by feature
  const byFeature = new Map(); // feature -> { entries: [], priorStatuses: Map }

  function getBucket(feature) {
    if (!byFeature.has(feature)) {
      const content = readFailures(feature);
      byFeature.set(feature, {
        entries: [],
        priorStatuses: parseLatestStatuses(content),
        priorContent: content,
      });
    }
    return byFeature.get(feature);
  }

  const summary = { open: 0, verified: 0, regression: 0, conflict: 0, skipped: 0, ignored: 0 };

  for (const test of allTests) {
    const { ac, feature } = parseTestTitle(test.title);
    if (!ac || feature === 'UNKNOWN') {
      verbose(`  - SKIP (no test_case_id) — ${test.title}`);
      summary.ignored++;
      continue;
    }

    const bucket = getBucket(feature);
    const prior  = bucket.priorStatuses.get(ac) ?? null;

    if (test.status === 'failed' || test.status === 'timedOut' || test.status === 'unexpected') {
      const detail = extractFailureDetail(test);
      let status = 'open';
      let note   = null;
      if (prior === 'verified') { status = 'open'; note = 'regression'; summary.regression++; }
      else if (prior === 'sdet-fault') { status = 'sdet-fault'; note = 'still failing — conflict, human review required'; summary.conflict++; }
      else if (prior === 'open' || prior === 'todo') { note = 'still failing'; summary.open++; }
      else summary.open++;

      bucket.entries.push({
        ac, status, note,
        summary:  detail.summary,
        detail:   detail.detail,
        location: detail.location,
        screenshot: detail.screenshot,
        trace:      detail.trace,
        duration:   detail.duration,
        retries:    detail.retries,
      });
    } else if (test.status === 'passed') {
      if (prior === 'open' || prior === 'todo') {
        bucket.entries.push({
          ac, status: 'verified', note: 'auto', summary: 'now passing in Playwright run',
        });
        summary.verified++;
      } else {
        verbose(`  ✓ PASS (no prior failure) — ${test.title}`);
        summary.skipped++;
      }
    } else if (test.status === 'skipped') {
      verbose(`  - SKIPPED — ${test.title}`);
    }
  }

  // Write a section per feature (only if there are entries)
  for (const [feature, bucket] of byFeature.entries()) {
    if (!bucket.entries.length) continue;
    const iter    = nextIteration(bucket.priorContent);
    const section = renderSection(iter, bucket.entries);
    appendSection(feature, section);
    log(`  ✚ ${feature}: appended iteration ${iter} (${bucket.entries.length} entries)`);
  }

  // Summary
  log('');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  log('  Summary');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  log(`  ✚ New/still open  ${summary.open}`);
  log(`  ↺ Regressions     ${summary.regression}`);
  log(`  ✔ Auto-verified   ${summary.verified}`);
  log(`  ⚠ Conflicts       ${summary.conflict}`);
  log(`  - Clean passes    ${summary.skipped}`);
  if (summary.ignored) log(`  ? No-AC ignored   ${summary.ignored}`);
  log('');

  if (summary.conflict > 0) {
    log('  ⚠ CONFLICTS DETECTED — see disputes.md / human review required.');
    log('');
  }

  if (DRY_RUN) {
    log('  Dry run complete — no files were written.');
    log('');
    process.exit(0);
  }

  // Re-scan all features to determine if any [open]/[todo] remain — orchestrator signal.
  let openCount = 0;
  if (fs.existsSync(STATE_DIR)) {
    for (const entry of fs.readdirSync(STATE_DIR)) {
      if (!entry.startsWith('feature-')) continue;
      const fp = path.join(STATE_DIR, entry, 'failures.md');
      if (!fs.existsSync(fp)) continue;
      const statuses = parseLatestStatuses(fs.readFileSync(fp, 'utf8'));
      for (const s of statuses.values()) {
        if (s === 'open' || s === 'todo') openCount++;
      }
    }
  }

  if (openCount > 0) {
    log(`  ${openCount} AC(s) currently in [open] or [todo] status.`);
    log('');
    process.exit(1); // signals orchestrator that bug-fixing is required
  }

  log('  All ACs in [verified] status.');
  log('');
  process.exit(0);
}

main();
