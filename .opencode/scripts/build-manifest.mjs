#!/usr/bin/env node

/**
 * build-manifest.mjs
 *
 * Builds .opencode/state/feature-manifest.json by parsing
 * docs/ACCEPTANCE_CRITERIA.md and scanning the codebase for files that
 * reference each feature.
 *
 * Usage:
 *   node .opencode/scripts/build-manifest.mjs            (run from project root)
 *   node .opencode/scripts/build-manifest.mjs --check    (only check if stale; exits 0 if fresh, 1 if stale)
 *
 * Auto-rebuild policy:
 *   The orchestrator skill compares mtime(ACCEPTANCE_CRITERIA.md) against
 *   _meta.sourceMtime in the manifest. If the source is newer, run this script.
 */

import fs   from 'fs';
import path from 'path';

const SOURCE      = 'docs/ACCEPTANCE_CRITERIA.md';
const MANIFEST    = '.opencode/state/feature-manifest.json';
const SCAN_ROOTS  = ['backend/handlers', 'backend/routes', 'backend/services', 'frontend/src/pages', 'frontend/src/components', 'frontend/src/api'];
const TEST_DIR    = 'test/specs';

const args = process.argv.slice(2);
const CHECK_ONLY = args.includes('--check');

const log = (msg) => console.log(msg);

// ── Parse ACCEPTANCE_CRITERIA.md ─────────────────────────────────────────────

function parseAcceptanceCriteria() {
  const md = fs.readFileSync(SOURCE, 'utf8');

  // 1. Parse the mapping table at the top to get feature → spec file
  // | `AUTH` | Authentication | AC-001 to AC-003 | `test/specs/auth.spec.js` |
  const tableRowRe = /^\|\s*`([A-Z_]+)`\s*\|\s*([^|]+?)\s*\|\s*AC-(\d{3})\s*to\s*AC-(\d{3})\s*\|\s*`([^`]+)`/gm;
  const features = {};
  let m;
  while ((m = tableRowRe.exec(md)) !== null) {
    const [, id, title, , , specFile] = m;
    features[id] = {
      title:        title.trim(),
      ac_ids:       [],
      test_file:    specFile.trim(),
      test_exists:  fs.existsSync(specFile.trim()),
      implementation_files: { backend: [], frontend: [] },
      implementation_exists: false,
    };
  }

  // 2. Parse AC IDs from the body sections (### AC-NNN: title; sub-bullets imply AC-NNN-NNN)
  // Section start pattern: ## N. Title [FEATURE_ID]
  const sectionRe = /^##\s+\d+\.\s+[^[]+\[([A-Z_]+)\]/gm;
  const sections  = [];
  while ((m = sectionRe.exec(md)) !== null) {
    sections.push({ feature: m[1], start: m.index });
  }
  for (let i = 0; i < sections.length; i++) {
    const start = sections[i].start;
    const end   = sections[i + 1]?.start ?? md.length;
    const body  = md.slice(start, end);
    const acIds = [...body.matchAll(/### AC-(\d{3})/g)].map(x => `AC-${x[1]}`);
    const feat  = features[sections[i].feature];
    if (feat) {
      // For each AC, count its bullets to derive AC-NNN-NNN sub-IDs
      for (const acHeader of body.matchAll(/### AC-(\d{3})[\s\S]*?(?=### AC-|\n## |$)/g)) {
        const acNum   = acHeader[1];
        const subBody = acHeader[0];
        const bulletCount = (subBody.match(/^\s*-\s*\[/gm) ?? []).length;
        if (bulletCount === 0) {
          feat.ac_ids.push(`AC-${acNum}`);
        } else {
          for (let n = 1; n <= bulletCount; n++) {
            feat.ac_ids.push(`AC-${acNum}-${String(n).padStart(3, '0')}`);
          }
        }
      }
    }
  }

  return features;
}

// ── Scan codebase for files referencing each feature ─────────────────────────

function* walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === 'dist' || entry.name === 'build') continue;
    const fp = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(fp);
    else yield fp;
  }
}

function classifyFile(fp) {
  if (fp.startsWith('backend/'))  return 'backend';
  if (fp.startsWith('frontend/')) return 'frontend';
  return null;
}

// Lowercase noun fragments per feature for scanning file CONTENT and PATHS
const FEATURE_KEYWORDS = {
  AUTH:         ['auth', 'login', 'logout', 'jwt', 'session'],
  CATALOGUE:    ['catalogue', 'catalog', 'costume'],
  RENT:         ['rent', 'rental'],
  CLIENT:       ['client'],
  NOTIFICATION: ['notif', 'notification'],
  SETTINGS:     ['setting'],
  NAVIGATION:   ['nav', 'router', 'route', 'sidebar', 'menu'],
  API:          [], // too generic — skipped, will rely on path heuristics
};

function scanForFeatureFiles(features) {
  const allFiles = [];
  for (const root of SCAN_ROOTS) {
    for (const fp of walk(root)) {
      const ext = path.extname(fp);
      if (!['.go', '.jsx', '.tsx', '.js', '.ts'].includes(ext)) continue;
      allFiles.push(fp);
    }
  }

  for (const fp of allFiles) {
    const layer = classifyFile(fp);
    if (!layer) continue;
    const lower = fp.toLowerCase();
    let content = '';
    try { content = fs.readFileSync(fp, 'utf8').toLowerCase(); } catch { continue; }

    for (const [featureId, kws] of Object.entries(FEATURE_KEYWORDS)) {
      if (!kws.length) continue;
      const feat = features[featureId];
      if (!feat) continue;
      const pathHit    = kws.some(k => lower.includes(k));
      const contentHit = kws.some(k => content.includes(k));
      if (pathHit || contentHit) {
        if (!feat.implementation_files[layer].includes(fp)) {
          feat.implementation_files[layer].push(fp);
        }
      }
    }
  }

  // implementation_exists = both backend and frontend have at least one file
  for (const feat of Object.values(features)) {
    feat.implementation_exists =
      feat.implementation_files.backend.length  > 0 &&
      feat.implementation_files.frontend.length > 0;
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────

function main() {
  if (!fs.existsSync(SOURCE)) {
    console.error(`ERROR: ${SOURCE} not found.`);
    process.exit(2);
  }

  const sourceMtime = fs.statSync(SOURCE).mtime.toISOString();

  // --check mode: report stale or fresh, do nothing else
  if (CHECK_ONLY) {
    if (!fs.existsSync(MANIFEST)) {
      console.log('STALE: manifest does not exist');
      process.exit(1);
    }
    const existing = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
    if (existing._meta?.sourceMtime !== sourceMtime) {
      console.log(`STALE: source mtime ${sourceMtime} ≠ manifest sourceMtime ${existing._meta?.sourceMtime ?? 'none'}`);
      process.exit(1);
    }
    console.log('FRESH');
    process.exit(0);
  }

  log('Parsing acceptance criteria...');
  const features = parseAcceptanceCriteria();
  const featureCount = Object.keys(features).length;
  const acCount      = Object.values(features).reduce((n, f) => n + f.ac_ids.length, 0);
  log(`  ${featureCount} features, ${acCount} AC IDs`);

  log('Scanning codebase for implementation files...');
  scanForFeatureFiles(features);
  for (const [id, f] of Object.entries(features)) {
    log(`  ${id.padEnd(14)} backend=${f.implementation_files.backend.length}  frontend=${f.implementation_files.frontend.length}  test=${f.test_exists ? '✓' : '✗'}  impl=${f.implementation_exists ? '✓' : '✗'}`);
  }

  const manifest = {
    _meta: {
      generatedAt: new Date().toISOString(),
      sourceMtime,
      sourceFile:  SOURCE,
    },
    ...features,
  };

  fs.mkdirSync(path.dirname(MANIFEST), { recursive: true });
  fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2));
  log(`\nWrote ${MANIFEST}`);
}

main();
