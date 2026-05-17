#!/usr/bin/env node

/**
 * Reads Playwright JSON output from an impacted-spec regression run and creates
 * or updates durable review bug tickets on the same plan.
 *
 * This helper is intended for plan-completion regression only. It must not be
 * used for intentional RED runs because RED failures are expected by design.
 */

import fs from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';

const DEFAULT_RESULTS = 'test-results/results.json';

const AC_FEATURE_MAP = [
  { from: 1, to: 2, feature: 'AUTH', testFile: 'test/specs/auth.spec.js' },
  { from: 3, to: 8, feature: 'CATALOGUE', testFile: 'test/specs/catalogue.spec.js' },
  { from: 9, to: 14, feature: 'RENT', testFile: 'test/specs/rental.spec.js' },
  { from: 15, to: 17, feature: 'CLIENT', testFile: 'test/specs/clients.spec.js' },
  { from: 18, to: 20, feature: 'NOTIFICATION', testFile: 'test/specs/notifications.spec.js' },
  { from: 21, to: 24, feature: 'SETTINGS', testFile: 'test/specs/settings.spec.js' },
  { from: 25, to: 27, feature: 'NAVIGATION', testFile: 'test/specs/navigation.spec.js' },
  { from: 28, to: 30, feature: 'API', testFile: 'test/specs/api.spec.js' },
  { from: 31, to: 32, feature: 'CATALOGUE', testFile: 'test/specs/catalogue.spec.js' },
  { from: 33, to: 34, feature: 'RENT', testFile: 'test/specs/rental.spec.js' },
  { from: 35, to: 40, feature: 'API', testFile: 'test/specs/api.spec.js' },
  { from: 41, to: 41, feature: 'NAVIGATION', testFile: 'test/specs/navigation.spec.js' },
  { from: 42, to: 42, feature: 'CLIENT', testFile: 'test/specs/clients.spec.js' },
];

const FAILING_STATUSES = new Set(['failed', 'timedOut', 'unexpected', 'interrupted']);

const { values: args, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    plan: { type: 'string' },
    results: { type: 'string', default: DEFAULT_RESULTS },
    'run-command': { type: 'string' },
    'dry-run': { type: 'boolean', default: false },
    verbose: { type: 'boolean', default: false },
  },
});

const dryRun = args['dry-run'];
const verbose = args.verbose;

function log(message = '') {
  console.log(message);
}

function debug(message) {
  if (verbose) console.log(`[verbose] ${message}`);
}

function fail(message) {
  console.error(`sync-regression-bugs: ${message}`);
  process.exit(2);
}

function findRepoRoot(start) {
  let current = start;

  while (true) {
    if (fs.existsSync(path.join(current, 'AGENTS.md')) && fs.existsSync(path.join(current, '.git'))) {
      return current;
    }

    const parent = path.dirname(current);
    if (parent === current) return start;
    current = parent;
  }
}

const root = findRepoRoot(process.cwd());
const planId = args.plan ?? positionals[0];

if (!planId) fail('missing required --plan PLAN-YYYYMMDD-name');

function resolvePath(input) {
  if (path.isAbsolute(input)) return input;
  const cwdPath = path.resolve(process.cwd(), input);
  if (fs.existsSync(cwdPath)) return cwdPath;
  return path.resolve(root, input);
}

const resultsPath = resolvePath(args.results);
const planPath = path.join(root, 'docs', 'plans', `${planId}.md`);
const ticketsDir = path.join(root, 'docs', 'tickets');

if (!fs.existsSync(planPath)) fail(`plan not found: ${path.relative(root, planPath)}`);
if (!fs.existsSync(resultsPath)) fail(`results file not found: ${path.relative(root, resultsPath)}`);

function toPosix(filePath) {
  return filePath.split(path.sep).join('/');
}

function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  if (!match) return {};

  const frontmatter = {};
  for (const line of match[1].split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!kv) continue;
    let value = kv[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    frontmatter[kv[1]] = value;
  }
  return frontmatter;
}

function replaceFrontmatterStatus(content, status) {
  if (/^status:\s*.+$/m.test(content)) {
    return content.replace(/^status:\s*.+$/m, `status: ${status}`);
  }

  return content.replace(/^---\r?\n/, `---\nstatus: ${status}\n`);
}

function featureInfoFromAc(ac) {
  const num = Number.parseInt(ac.replace(/^AC-/, '').split('-')[0], 10);
  const entry = AC_FEATURE_MAP.find((item) => num >= item.from && num <= item.to);
  return entry ?? { feature: 'UNKNOWN', testFile: 'test/specs/unknown.spec.js' };
}

function parseTestTitle(title) {
  const acMatch = title.match(/\[?AC-(\d{3})(?:-(\d{3}))?\]?/i);
  const ac = acMatch ? (acMatch[2] ? `AC-${acMatch[1]}-${acMatch[2]}` : `AC-${acMatch[1]}`) : null;
  const info = ac ? featureInfoFromAc(ac) : null;
  return {
    ac,
    feature: info?.feature ?? 'UNKNOWN',
    mappedTestFile: info?.testFile ?? 'test/specs/unknown.spec.js',
  };
}

function collectTests(suites, parentTitle = '', acc = []) {
  for (const suite of suites ?? []) {
    const suiteTitle = parentTitle ? `${parentTitle} > ${suite.title}` : suite.title;
    for (const spec of suite.specs ?? []) {
      for (const test of spec.tests ?? []) {
        acc.push({
          title: spec.title,
          suite: suiteTitle,
          file: spec.file ?? suite.file ?? null,
          status: test.status,
          results: test.results ?? [],
        });
      }
    }
    collectTests(suite.suites, suiteTitle, acc);
  }
  return acc;
}

function extractFailureDetail(test) {
  const results = test.results ?? [];
  const lastResult = results[results.length - 1] ?? {};
  const errors = results.flatMap((result) => result.errors ?? []);
  const attachments = lastResult.attachments ?? [];
  const firstError = errors[0] ?? {};
  const raw = firstError.message ?? String(firstError.value ?? 'Unknown failure');
  const stack = firstError.stack ?? '';
  const appFrame = stack.split('\n').find((line) =>
    line.includes(' at ') &&
    !line.includes('node_modules') &&
    !line.includes('playwright') &&
    !line.includes('internal/')
  );

  return {
    summary: raw.split('\n')[0].trim() || 'Unknown failure',
    location: appFrame?.trim() ?? null,
    screenshot: attachments.find((attachment) => attachment.name === 'screenshot')?.path ?? null,
    trace: attachments.find((attachment) => attachment.name === 'trace')?.path ?? null,
    duration: lastResult.duration ? `${(lastResult.duration / 1000).toFixed(1)}s` : null,
  };
}

function normalizeTestFile(file, fallback) {
  if (!file) return fallback;

  const normalized = toPosix(file);
  if (normalized.startsWith('test/specs/')) return normalized;
  if (normalized.startsWith('specs/')) return `test/${normalized}`;

  const relativeToRoot = toPosix(path.relative(root, path.isAbsolute(file) ? file : path.resolve(process.cwd(), file)));
  if (relativeToRoot.startsWith('test/specs/')) return relativeToRoot;
  if (relativeToRoot.startsWith('specs/')) return `test/${relativeToRoot}`;

  return fallback;
}

function listTicketFiles() {
  if (!fs.existsSync(ticketsDir)) return [];
  return fs.readdirSync(ticketsDir)
    .filter((name) => /^TICKET-\d{8}-\d{3}\.md$/.test(name))
    .map((name) => path.join(ticketsDir, name));
}

function loadTickets() {
  return listTicketFiles().map((filePath) => {
    const content = fs.readFileSync(filePath, 'utf8');
    return { filePath, content, frontmatter: parseFrontmatter(content) };
  });
}

function nextTicketId() {
  const ymd = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const max = listTicketFiles().reduce((currentMax, filePath) => {
    const match = path.basename(filePath).match(/^TICKET-(\d{8})-(\d{3})\.md$/);
    if (!match || match[1] !== ymd) return currentMax;
    return Math.max(currentMax, Number.parseInt(match[2], 10));
  }, 0);
  return `TICKET-${ymd}-${String(max + 1).padStart(3, '0')}`;
}

function nextPriority(tickets) {
  return tickets
    .filter((ticket) => ticket.frontmatter.plan_id === planId)
    .reduce((max, ticket) => Math.max(max, Number.parseInt(ticket.frontmatter.priority, 10) || 0), 0) + 1;
}

function yamlValue(value) {
  return JSON.stringify(String(value));
}

function ticketTitle(failure) {
  return `${failure.feature} regression for ${failure.ac}`;
}

function renderEvidence(failure, existing = false) {
  const timestamp = new Date().toISOString();
  const lines = [
    `## Regression Evidence${existing ? ` - ${timestamp}` : ''}`,
    `- Source plan: ${planId}`,
    `- Slice: ${failure.ac}`,
    `- Test file: \`${failure.testFile}\``,
    `- Test title: ${failure.title}`,
    `- Status: ${failure.status}`,
    `- Failure: ${failure.detail.summary}`,
  ];

  if (args['run-command']) lines.push(`- Regression command: \`${args['run-command']}\``);
  if (failure.detail.location) lines.push(`- Location: \`${failure.detail.location}\``);
  if (failure.detail.screenshot) lines.push(`- Screenshot: \`${failure.detail.screenshot}\``);
  if (failure.detail.trace) lines.push(`- Trace: \`${failure.detail.trace}\``);
  if (failure.detail.duration) lines.push(`- Duration: ${failure.detail.duration}`);

  return lines.join('\n');
}

function renderNewTicket(id, failure, priority) {
  const testInterface = failure.testFile.endsWith('/api.spec.js') || failure.testFile.endsWith('\\api.spec.js') ? 'api' : 'e2e';
  const sourcePlan = `docs/plans/${planId}.md`;

  return `---
id: ${id}
plan_id: ${planId}
type: bug
status: review
feature: ${failure.feature}
slice_id: ${failure.ac}
priority: ${priority}
source_plan: ${sourcePlan}
test_file: ${failure.testFile}
expected_outcome: ${yamlValue(`Impacted regression slice ${failure.ac} passes for ${failure.feature}.`)}
test_interface: ${testInterface}
red_expectation: ${yamlValue(`The existing ${failure.ac} regression test fails with the captured product failure.`)}
green_expectation: ${yamlValue(`The same ${failure.ac} regression test passes after the bug fix.`)}
generated_from: impacted-regression
---

# ${ticketTitle(failure)}

## Expected Outcome
Impacted regression slice \`${failure.ac}\` passes for \`${failure.feature}\`.

## Acceptance Criterion
- Restore the existing \`${failure.ac}\` acceptance behavior proven by \`${failure.testFile}\`.

## Public Test Interface
\`${testInterface}\`, because the failing impacted regression test already exercises this behavior through the public test boundary.

## RED Expectation
The existing \`${failure.ac}\` regression test fails with the captured product failure.

## GREEN Expectation
The same \`${failure.ac}\` regression test passes after the bug fix.

## Smallest End-To-End Path
1. Run the targeted regression command for \`${failure.ac}\`.
2. Observe the captured failure.
3. Fix the smallest product behavior gap so the same test passes.

## Bug Details
- Expected: \`${failure.ac}\` passes during impacted-spec regression.
- Actual: ${failure.detail.summary}
- Repro: Run from \`test/\`: \`npx playwright test ${failure.testFile.replace(/^test\//, '')} --grep "${failure.ac}"\`

${renderEvidence(failure)}

## Definition Of Ready
- Feature and slice are mapped.
- Exactly one acceptance criterion is present.
- Expected outcome, public test interface, RED expectation, and GREEN expectation are present.
- Deferred work is explicit.
- No prerequisite ticket dependency remains.

## Definition Of Done
- SDET RED test exists and includes \`${failure.ac}\`.
- RED failed for the expected reason or already-green coverage was reviewer-approved.
- GREEN passes the same recorded test.
- Final reviewer audit approved scope and test integrity.

## Targeted Test
Run from \`test/\`: \`npx playwright test ${failure.testFile.replace(/^test\//, '')} --grep "${failure.ac}"\`

## Deferred Work
- none

## Open Questions
- Reviewer must confirm this regression failure is product behavior, not test/setup noise.

## Orchestrator Pickup
\`/engineering/orchestrator ${id}\`
`;
}

function appendEvidence(ticket, failure) {
  const updated = ticket.content.replace(/^status:\s*complete$/m, 'status: review');
  return `${updated.trimEnd()}\n\n${renderEvidence(failure, true)}\n`;
}

function upsertTicketForFailure(failure, tickets, createdTickets) {
  const existing = tickets.find((ticket) =>
    ticket.frontmatter.plan_id === planId &&
    ticket.frontmatter.type === 'bug' &&
    ticket.frontmatter.slice_id === failure.ac &&
    ticket.frontmatter.status !== 'complete'
  );

  if (existing) {
    const nextContent = appendEvidence(existing, failure);
    if (!dryRun) fs.writeFileSync(existing.filePath, nextContent);
    log(`updated ${path.relative(root, existing.filePath)} for ${failure.ac}`);
    return { action: 'updated', id: existing.frontmatter.id };
  }

  const id = nextTicketId();
  const priority = nextPriority([...tickets, ...createdTickets]);
  const filePath = path.join(ticketsDir, `${id}.md`);
  const content = renderNewTicket(id, failure, priority);
  const ticket = { filePath, content, frontmatter: parseFrontmatter(content) };

  if (!dryRun) fs.writeFileSync(filePath, content);
  createdTickets.push(ticket);
  log(`created ${path.relative(root, filePath)} for ${failure.ac}`);
  return { action: 'created', id };
}

function ticketLine(ticket, content) {
  const title = content.match(/^#\s+(.+)$/m)?.[1] ?? ticket.frontmatter.id;
  return `- ${ticket.frontmatter.id} - ${ticket.frontmatter.status} - ${ticket.frontmatter.type} - ${title}`;
}

function updatePlanTickets(planContent, planTickets) {
  const lines = planTickets
    .sort((a, b) => a.frontmatter.id.localeCompare(b.frontmatter.id))
    .map((ticket) => ticketLine(ticket, ticket.content));

  const block = `## Tickets\n${lines.join('\n')}`;
  if (/## Tickets\r?\n[\s\S]*?(?=\r?\n## |$)/.test(planContent)) {
    return planContent.replace(/## Tickets\r?\n[\s\S]*?(?=\r?\n## |$)/, block);
  }

  return `${planContent.trimEnd()}\n\n${block}\n`;
}

function updatePlanSummary(planContent, planTickets) {
  const counts = { draft: 0, review: 0, ready: 0, in_progress: 0, blocked: 0, complete: 0 };
  for (const ticket of planTickets) {
    const status = ticket.frontmatter.status;
    if (Object.prototype.hasOwnProperty.call(counts, status)) counts[status]++;
  }

  const block = [
    '## Status Summary',
    `- draft: ${counts.draft}`,
    `- review: ${counts.review}`,
    `- ready: ${counts.ready}`,
    `- in_progress: ${counts.in_progress}`,
    `- blocked: ${counts.blocked}`,
    `- complete: ${counts.complete}`,
  ].join('\n');

  if (/## Status Summary\r?\n[\s\S]*?(?=\r?\n## |$)/.test(planContent)) {
    return planContent.replace(/## Status Summary\r?\n[\s\S]*?(?=\r?\n## |$)/, block);
  }

  return `${planContent.trimEnd()}\n\n${block}\n`;
}

function main() {
  log('sync-regression-bugs - Playwright results -> review bug tickets');
  if (dryRun) log('mode: dry-run');

  const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8').replace(/^\uFEFF/, ''));
  const tests = collectTests(results.suites);
  const failures = [];
  const unmapped = [];

  for (const test of tests) {
    if (!FAILING_STATUSES.has(test.status)) continue;

    const parsed = parseTestTitle(test.title);
    if (!parsed.ac || parsed.feature === 'UNKNOWN') {
      unmapped.push(test.title);
      continue;
    }

    failures.push({
      ac: parsed.ac,
      feature: parsed.feature,
      title: test.title,
      status: test.status,
      testFile: normalizeTestFile(test.file, parsed.mappedTestFile),
      detail: extractFailureDetail(test),
    });
  }

  log(`tests found: ${tests.length}`);
  log(`mapped failures: ${failures.length}`);
  log(`unmapped failures: ${unmapped.length}`);

  if (unmapped.length > 0) {
    for (const title of unmapped) log(`unmapped failure: ${title}`);
    fail('unmapped failing tests block plan completion; repair test titles/setup before generating product bug tickets');
  }

  if (failures.length === 0) {
    log('no mapped failures; impacted regression can complete');
    process.exit(0);
  }

  const uniqueFailuresBySlice = new Map();
  for (const failure of failures) {
    if (!uniqueFailuresBySlice.has(failure.ac)) uniqueFailuresBySlice.set(failure.ac, failure);
  }
  const uniqueFailures = [...uniqueFailuresBySlice.values()];
  if (uniqueFailures.length !== failures.length) {
    log(`deduped failures by slice_id: ${failures.length} -> ${uniqueFailures.length}`);
  }

  fs.mkdirSync(ticketsDir, { recursive: true });

  const tickets = loadTickets();
  const createdTickets = [];
  const outcomes = [];

  for (const failure of uniqueFailures) {
    debug(`${failure.ac}: ${failure.detail.summary}`);
    outcomes.push(upsertTicketForFailure(failure, tickets, createdTickets));
  }

  const refreshedTickets = [...loadTickets(), ...createdTickets.filter((ticket) => dryRun)];
  const planTickets = refreshedTickets.filter((ticket) => ticket.frontmatter.plan_id === planId);
  let planContent = fs.readFileSync(planPath, 'utf8');
  planContent = replaceFrontmatterStatus(planContent, 'in_progress');
  planContent = updatePlanTickets(planContent, planTickets);
  planContent = updatePlanSummary(planContent, planTickets);

  if (!dryRun) fs.writeFileSync(planPath, planContent);
  log(`updated ${path.relative(root, planPath)} as in_progress`);

  const created = outcomes.filter((outcome) => outcome.action === 'created').length;
  const updated = outcomes.filter((outcome) => outcome.action === 'updated').length;
  log(`review bug tickets created: ${created}`);
  log(`review bug tickets updated: ${updated}`);
  log('impacted regression failures block plan completion');
  process.exit(1);
}

main();
