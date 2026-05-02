#!/usr/bin/env node

/**
 * sync-bug-reports.js
 *
 * Reads Playwright JSON test results and syncs .opencode/state/bug-reports/
 *
 * Usage:
 *   node test/helpers/sync-bug-reports.js
 *   node test/helpers/sync-bug-reports.js --results test/test-results/results.json
 *   node test/helpers/sync-bug-reports.js --dry-run
 *
 * What it does:
 *   - FAILED test  + no existing report   → create new bug report (open)
 *   - FAILED test  + report is "verified" → reopen bug report
 *   - FAILED test  + report is "open"     → update evidence, leave open
 *   - FAILED test  + report is "sdet-fault" → flag as conflict
 *   - PASSED test  + report is "open"     → mark as verified
 *   - PASSED test  + no report            → do nothing
 */

import fs   from 'fs';
import path from 'path';
import crypto from 'crypto';
import { parseArgs } from 'util';

// ── Config ────────────────────────────────────────────────────────────────────

const DEFAULT_RESULTS  = 'test-results/results.json';
const BUG_REPORTS_DIR  = '../.opencode/state/bug-reports';
const ISO_NOW          = () => new Date().toISOString();

// ── CLI args ──────────────────────────────────────────────────────────────────

const { values: args } = parseArgs({
  options: {
    results:  { type: 'string',  default: DEFAULT_RESULTS },
    'dry-run': { type: 'boolean', default: false },
    verbose:   { type: 'boolean', default: false },
  }
});

const DRY_RUN = args['dry-run'];
const VERBOSE = args['verbose'];
const RESULTS_PATH = args['results'];

// ── Helpers ───────────────────────────────────────────────────────────────────

function log(msg)         { console.log(msg); }
function verbose(msg)     { if (VERBOSE) console.log(`  [verbose] ${msg}`); }
function dryLog(msg)      { if (DRY_RUN) console.log(`  [dry-run] ${msg}`); }

/**
 * Extract feature ID and AC ID from test title.
 * Playwright test titles follow the pattern:
 *   "[AC-001-001] Login with valid credentials"
 *   "[AC-014-001] Delete rental"
 */
// ── AC → Feature map (derived from docs/ACCEPTANCE_CRITERIA.md) ──────────────
// Update this map when new AC ranges are added
const AC_FEATURE_MAP = [
  { from:  1, to:  2,  feature: 'AUTH'       },  // AC-001 to AC-002
  { from:  3, to:  8,  feature: 'CATALOGUE'  },  // AC-003 to AC-008
  { from:  9, to: 14,  feature: 'RENT'       },  // AC-009 to AC-014
  { from: 15, to: 17,  feature: 'CLIENT'     },  // AC-015 to AC-017
  { from: 18, to: 20,  feature: 'NOTIFICATION' }, // AC-018 to AC-020
  { from: 21, to: 24,  feature: 'SETTINGS'   },  // AC-021 to AC-024
  { from: 25, to: 27,  feature: 'NAVIGATION' },  // AC-025 to AC-027
  { from: 28, to: 30,  feature: 'API'        },  // AC-028 to AC-030
];

function featureFromAC(ac) {
  // ac is like "AC-003-001" or "AC-003" — extract the main AC number
  const num = parseInt(ac.replace(/^AC-/, '').split('-')[0], 10);
  const entry = AC_FEATURE_MAP.find(e => num >= e.from && num <= e.to);
  return entry ? entry.feature : 'UNKNOWN';
}

function parseTestTitle(title) {
  // Match [AC-003-001] or AC-003-001 or [AC-003] or AC-003
  const acMatch = title.match(/\[?AC-(\d{3})(?:-(\d{3}))?\]?/i);
  const ac      = acMatch
    ? acMatch[2]
      ? `AC-${acMatch[1]}-${acMatch[2]}`   // AC-003-001
      : `AC-${acMatch[1]}`                  // AC-003
    : null;

  const feature = ac ? featureFromAC(ac) : 'UNKNOWN';
  return { ac, feature };
}

/**
 * Generate a stable bug ID from feature + test ID.
 * Format: BUG-{FEATURE_ID}-{TEST_ID}-{hash}
 * Example: BUG-AUTH-AC001-001-27526D
 */
function generateBugId(feature, ac, title) {
  const hash = crypto
    .createHash('md5')
    .update(`${feature}-${ac ?? title}`)
    .digest('hex')
    .slice(0, 6)
    .toUpperCase();
  // Convert AC-001-001 → AC001-001 (remove hyphen only after "AC")
  const testId = ac ? ac.replace(/^AC-/, 'AC') : 'GEN';
  return `BUG-${feature}-${testId}-${hash}`;
}

/**
 * Find an existing bug report file by bug ID.
 */
function findExistingReport(bugId) {
  const filepath = path.join(BUG_REPORTS_DIR, `${bugId}.json`);
  if (fs.existsSync(filepath)) {
    return { filepath, report: JSON.parse(fs.readFileSync(filepath, 'utf8')) };
  }
  return null;
}

/**
 * Write a bug report to disk.
 */
function writeReport(bugId, report) {
  const filepath = path.join(BUG_REPORTS_DIR, `${bugId}.json`);
  if (!DRY_RUN) {
    fs.mkdirSync(BUG_REPORTS_DIR, { recursive: true });
    fs.writeFileSync(filepath, JSON.stringify(report, null, 2));
  }
  return filepath;
}

/**
 * Append a status history entry to a report.
 */
function appendHistory(report, from, to, reason) {
  report.statusHistory.push({
    from,
    to,
    by: 'sdet',
    at: ISO_NOW(),
    reason,
  });
  return report;
}

// ── Failure Reason Extractor ──────────────────────────────────────────────────

/**
 * Extracts a structured, human + AI readable failure reason from a Playwright test result.
 * Pulls: error message, failing assertion, stack trace location, and screenshot path.
 */
function extractFailureDetail(test) {
  const results    = test.results ?? [];
  const lastResult = results[results.length - 1] ?? {};
  const errors     = results.flatMap(r => r.errors ?? []);
  const attachments = lastResult.attachments ?? [];

  // ── Screenshot / trace paths ──────────────────────────────────────────────
  const screenshot = attachments.find(a => a.name === 'screenshot')?.path ?? null;
  const trace      = attachments.find(a => a.name === 'trace')?.path ?? null;

  // ── Duration ──────────────────────────────────────────────────────────────
  const duration = lastResult.duration
    ? `${(lastResult.duration / 1000).toFixed(1)}s`
    : null;

  // ── Parse each error ──────────────────────────────────────────────────────
  const parsedErrors = errors.map((e, i) => {
    const raw     = e.message ?? String(e);
    const stack   = e.stack   ?? '';

    // Extract "Expected" / "Received" from Playwright assertion errors
    // e.g. "expect(received).toBe(expected)\n\nExpected: "foo"\nReceived: "bar""
    const expectedMatch = raw.match(/Expected(?:\s+value)?:\s*(.+)/i);
    const receivedMatch = raw.match(/Received(?:\s+value)?:\s*(.+)/i);

    // Extract first app-code stack frame (skip node_modules / playwright internals)
    const stackLines  = stack.split('\n');
    const appFrame    = stackLines.find(l =>
      l.includes('    at ') &&
      !l.includes('node_modules') &&
      !l.includes('playwright') &&
      !l.includes('internal/')
    );

    // Extract the plain error message (first line only, no stack)
    const messageLine = raw.split('\n')[0].trim();

    return {
      index:     i + 1,
      message:   messageLine,
      expected:  expectedMatch?.[1]?.trim() ?? null,
      received:  receivedMatch?.[1]?.trim() ?? null,
      location:  appFrame?.trim() ?? null,
      fullError: raw.slice(0, 1500),   // cap to keep reports readable
    };
  });

  // ── Build human-readable "actual" block ───────────────────────────────────
  const actualLines = parsedErrors.map((e, i) => {
    const lines = [`Error ${i + 1}: ${e.message}`];
    if (e.expected) lines.push(`  Expected : ${e.expected}`);
    if (e.received) lines.push(`  Received : ${e.received}`);
    if (e.location) lines.push(`  At       : ${e.location}`);
    return lines.join('\n');
  });

  // ── Build "expected" block from assertion if detectable ───────────────────
  const assertionExpected = parsedErrors[0]?.expected
    ? `Assertion expected: ${parsedErrors[0].expected}`
    : 'Test should pass per acceptance criteria';

  return {
    expected:       assertionExpected,
    actual:         actualLines.join('\n\n') || 'Test failed — see Playwright output',
    failureReason:  parsedErrors[0]?.message ?? 'Unknown failure',
    errorDetails:   parsedErrors,
    screenshot,
    trace,
    duration,
    retries:        results.length - 1,
  };
}

// ── Core Logic ────────────────────────────────────────────────────────────────

function handleFailedTest(test, suite) {
  const title    = test.title;
  const { ac, feature } = parseTestTitle(title);
  const bugId    = generateBugId(feature, ac, title);
  const existing = findExistingReport(bugId);
  const detail   = extractFailureDetail(test);

  if (!existing) {
    // ── NEW BUG ────────────────────────────────────────────────────────────
    const report = {
      id:            bugId,
      feature:       feature,
      ac:            ac ?? title,
      title:         `[${ac ?? 'GEN'}] ${title}`,
      status:        'open',
      raisedBy:      'sdet',
      resolvedBy:    null,
      iteration:     0,
      statusHistory: [],

      // ── Failure detail (the key addition) ──────────────────────────────
      failureReason:  detail.failureReason,
      expected:       detail.expected,
      actual:         detail.actual,
      errorDetails:   detail.errorDetails,   // structured per-error breakdown

      // ── Evidence ───────────────────────────────────────────────────────
      screenshot:    detail.screenshot,
      trace:         detail.trace,
      duration:      detail.duration,
      retries:       detail.retries,

      analysis:      null,
    };
    appendHistory(report, null, 'open', `Test failed: ${detail.failureReason}`);
    writeReport(bugId, report);
    dryLog(`Would create: ${bugId}.json`);
    log(`  ✚ CREATED  ${bugId} — ${title}`);
    log(`             Reason: ${detail.failureReason}`);
    return 'created';
  }

  const { filepath, report } = existing;

  if (report.status === 'verified') {
    // ── REOPEN ────────────────────────────────────────────────────────────
    const prev = report.status;
    report.status         = 'open';
    report.resolvedBy     = null;
    report.failureReason  = detail.failureReason;
    report.actual         = detail.actual;
    report.errorDetails   = detail.errorDetails;
    report.screenshot     = detail.screenshot ?? report.screenshot;
    report.trace          = detail.trace      ?? report.trace;
    appendHistory(report, prev, 'open', `Regression: ${detail.failureReason}`);
    writeReport(bugId, report);
    dryLog(`Would reopen: ${bugId}.json`);
    log(`  ↺ REOPENED ${bugId} — ${title}`);
    log(`             Reason: ${detail.failureReason}`);
    return 'reopened';
  }

  if (report.status === 'sdet-fault') {
    // ── CONFLICT ──────────────────────────────────────────────────────────
    report.failureReason = detail.failureReason;
    report.actual        = detail.actual;
    report.errorDetails  = detail.errorDetails;
    report.screenshot    = detail.screenshot ?? report.screenshot;
    appendHistory(report, 'sdet-fault', 'sdet-fault',
      `Still failing after sdet-fault: ${detail.failureReason} — conflict, human review required`);
    writeReport(bugId, report);
    dryLog(`Would flag conflict: ${bugId}.json`);
    log(`  ⚠ CONFLICT  ${bugId} — ${title}`);
    log(`              Reason: ${detail.failureReason}`);
    return 'conflict';
  }

  if (report.status === 'open' || report.status === 'todo') {
    // ── UPDATE EVIDENCE ───────────────────────────────────────────────────
    report.failureReason = detail.failureReason;
    report.actual        = detail.actual;
    report.errorDetails  = detail.errorDetails;
    report.screenshot    = detail.screenshot ?? report.screenshot;
    report.trace         = detail.trace      ?? report.trace;
    appendHistory(report, report.status, report.status,
      `Still failing: ${detail.failureReason}`);
    writeReport(bugId, report);
    dryLog(`Would update: ${bugId}.json`);
    verbose(`  ~ UPDATED  ${bugId} — ${detail.failureReason}`);
    return 'updated';
  }

  return 'skipped';
}

function handlePassedTest(test) {
  const title    = test.title;
  const { ac, feature } = parseTestTitle(title);
  const bugId    = generateBugId(feature, ac, title);
  const existing = findExistingReport(bugId);

  if (!existing) {
    verbose(`  ✓ PASS (no report) — ${title}`);
    return 'no-report';
  }

  const { report } = existing;

  if (report.status === 'open' || report.status === 'todo') {
    const prev        = report.status;
    report.status     = 'verified';
    report.resolvedBy = 'playwright';
    appendHistory(report, prev, 'verified', 'Test now passing in Playwright run');
    writeReport(bugId, report);
    dryLog(`Would verify: ${bugId}.json`);
    log(`  ✔ VERIFIED  ${bugId} — ${title}`);
    return 'verified';
  }

  verbose(`  ✓ PASS (status: ${report.status}) — ${title}`);
  return 'skipped';
}

// ── Main ──────────────────────────────────────────────────────────────────────

function main() {
  log('');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  log('  sync-bug-reports — Playwright → Bug Reports');
  if (DRY_RUN) log('  MODE: DRY RUN (no files written)');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  log('');

  // ── Read Playwright results ──────────────────────────────────────────────
  if (!fs.existsSync(RESULTS_PATH)) {
    log(`ERROR: Results file not found: ${RESULTS_PATH}`);
    log(`Run: cd test && npx playwright test --reporter=json > test-results/results.json`);
    process.exit(1);
  }

  const raw     = fs.readFileSync(RESULTS_PATH, 'utf8');
  const results = JSON.parse(raw);

  // Playwright JSON structure: results.suites[].suites[].specs[].tests[]
  const allTests = [];

  function collectTests(suites, parentTitle = '') {
    for (const suite of suites ?? []) {
      const suiteTitle = parentTitle ? `${parentTitle} > ${suite.title}` : suite.title;
      for (const spec of suite.specs ?? []) {
        for (const test of spec.tests ?? []) {
          allTests.push({
            title:  spec.title,
            suite:  suiteTitle,
            status: test.status,   // 'passed' | 'failed' | 'skipped' | 'timedOut'
            results: test.results,
          });
        }
      }
      collectTests(suite.suites, suiteTitle);
    }
  }

  collectTests(results.suites);

  log(`Found ${allTests.length} tests in ${RESULTS_PATH}`);
  log('');

  // ── Process each test ────────────────────────────────────────────────────
  const summary = {
    created:  0,
    reopened: 0,
    verified: 0,
    conflict: 0,
    updated:  0,
    skipped:  0,
  };

  for (const test of allTests) {
    const status = test.status;

    if (status === 'failed' || status === 'timedOut' || status === 'unexpected') {
      const outcome = handleFailedTest(test, test.suite);
      summary[outcome] = (summary[outcome] ?? 0) + 1;
    } else if (status === 'passed') {
      const outcome = handlePassedTest(test);
      if (outcome in summary) summary[outcome]++;
    } else if (status === 'skipped') {
      verbose(`  - SKIPPED — ${test.title}`);
    } else {
      verbose(`  - UNKNOWN STATUS (${status}) — ${test.title}`);
    }
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  log('');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  log('  Summary');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  log(`  ✚ Created   ${summary.created}`);
  log(`  ↺ Reopened  ${summary.reopened}`);
  log(`  ✔ Verified  ${summary.verified}`);
  log(`  ⚠ Conflicts ${summary.conflict}`);
  log('');

  if (summary.conflict > 0) {
    log('  ⚠ CONFLICTS DETECTED — human review required.');
    log(`    Check: ${BUG_REPORTS_DIR}/`);
    log('');
  }

  if (DRY_RUN) {
    log('  Dry run complete — no files were written.');
  } else {
    log(`  Bug reports synced to: ${BUG_REPORTS_DIR}/`);
  }
  log('');

  // Exit with error code if any open bugs remain (useful for CI)
  const openBugs = fs.existsSync(BUG_REPORTS_DIR)
    ? fs.readdirSync(BUG_REPORTS_DIR)
        .filter(f => f.endsWith('.json'))
        .map(f => JSON.parse(fs.readFileSync(path.join(BUG_REPORTS_DIR, f), 'utf8')))
        .filter(r => r.status === 'open' || r.status === 'todo')
    : [];

  if (openBugs.length > 0) {
    log(`  ${openBugs.length} open/todo bug(s) remain.`);
    log('');
    process.exit(1); // signals to CI / orchestrator that bugs remain
  }

  process.exit(0);
}

main();