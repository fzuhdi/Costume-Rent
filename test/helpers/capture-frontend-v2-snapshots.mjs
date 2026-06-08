import playwright from '../node_modules/playwright/index.js';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  FrontendV2VisualPage,
  seedStorage,
  viewportProfiles,
} from '../support/frontend-v2-visual/FrontendV2VisualPage.mjs';
import { frontendV2VisualStates } from '../support/frontend-v2-visual/FrontendV2VisualStates.mjs';

const { chromium } = playwright;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const baseUrl = process.env.PLAYWRIGHT_BASE_URL || process.env.PW_BASE_URL || 'http://127.0.0.1:5174';
const screenshotRoot = path.resolve(__dirname, '..', 'screenshots', 'frontend-v2');
const snapshotDir = process.env.PW_SCREENSHOT_DIR
  ? path.resolve(process.env.PW_SCREENSHOT_DIR, 'frontend-v2')
  : path.join(screenshotRoot, 'current');
const baselineDir = process.env.PW_BASELINE_DIR
  ? path.resolve(process.env.PW_BASELINE_DIR, 'frontend-v2')
  : path.join(screenshotRoot, 'baseline');

async function ensureDirs() {
  await fs.mkdir(baselineDir, { recursive: true });
  await fs.mkdir(snapshotDir, { recursive: true });
  await clearCurrentSnapshots();
}

async function clearCurrentSnapshots() {
  const entries = await fs.readdir(snapshotDir, { withFileTypes: true });
  await Promise.all(entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.png'))
    .map((entry) => fs.unlink(path.join(snapshotDir, entry.name))));
}

async function screenshot(page, name, viewportProfile) {
  const fileName = viewportProfile.filePrefix ? `${viewportProfile.filePrefix}-${name}.png` : `${name}.png`;
  const currentPath = path.join(snapshotDir, fileName);
  const baselinePath = path.join(baselineDir, fileName);
  await page.screenshot({
    path: currentPath,
    fullPage: false,
    animations: 'disabled',
    caret: 'hide',
  });

  try {
    await fs.access(baselinePath);
    return { viewport: viewportProfile.name, name, current: currentPath, baseline: baselinePath, baselineWritten: false };
  } catch {
    await fs.copyFile(currentPath, baselinePath);
    return { viewport: viewportProfile.name, name, current: currentPath, baseline: baselinePath, baselineWritten: true };
  }
}

async function captureState(app, viewportProfile, state) {
  try {
    await app.goto(state.path, state.ready);
    if (state.action) await state.action(app);
    return { result: await screenshot(app.page, state.name, viewportProfile), blocker: null };
  } catch (error) {
    return { result: null, blocker: `${viewportProfile.name}/${state.name}: ${error.message}` };
  }
}

async function captureViewport(browser, viewportProfile) {
  const context = await browser.newContext(viewportProfile.contextOptions);
  await seedStorage(context);
  const page = await context.newPage();
  const app = new FrontendV2VisualPage(page, baseUrl);
  const results = [];
  const blockers = [];

  try {
    for (const state of frontendV2VisualStates()) {
      const stateSummary = await captureState(app, viewportProfile, state);
      if (stateSummary.result) results.push(stateSummary.result);
      if (stateSummary.blocker) blockers.push(stateSummary.blocker);
    }
  } finally {
    await context.close();
  }

  return { viewport: viewportProfile.name, results, blockers };
}

async function main() {
  await ensureDirs();
  const browser = await chromium.launch();
  const summary = [];
  try {
    for (const viewportProfile of viewportProfiles) {
      summary.push(await captureViewport(browser, viewportProfile));
    }
  } finally {
    await browser.close();
  }

  console.log(JSON.stringify(summary, null, 2));
  if (summary.some((entry) => entry.blockers.length > 0)) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
