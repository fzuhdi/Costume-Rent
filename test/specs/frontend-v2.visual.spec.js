const fs = require('node:fs/promises');
const path = require('node:path');
const { test, expect } = require('@playwright/test');

let FrontendV2VisualPage;
let frontendV2VisualStates;
let seedStorage;
let viewportProfiles;

test.beforeAll(async () => {
  const pageModule = await import('../support/frontend-v2-visual/FrontendV2VisualPage.mjs');
  const stateModule = await import('../support/frontend-v2-visual/FrontendV2VisualStates.mjs');
  FrontendV2VisualPage = pageModule.FrontendV2VisualPage;
  seedStorage = pageModule.seedStorage;
  viewportProfiles = pageModule.viewportProfiles;
  frontendV2VisualStates = stateModule.frontendV2VisualStates;
});

test.describe.configure({ mode: 'serial' });
test.setTimeout(180000);

test.describe('Frontend v2 deterministic visual states', () => {
  for (const viewportProfileName of ['mobile', 'tablet', 'desktop']) {
    test(`[NAVIGATION-015] - Capture frontend v2 ${viewportProfileName} visual states @visual`, async ({ browser }, testInfo) => {
      const viewportProfile = viewportProfiles.find((profile) => profile.name === viewportProfileName);
      expect(viewportProfile).toBeTruthy();

      const context = await browser.newContext(viewportProfile.contextOptions);
      await seedStorage(context);
      const page = await context.newPage();
      const baseUrl = process.env.PLAYWRIGHT_BASE_URL || process.env.PW_BASE_URL || 'http://127.0.0.1:5174';
      const app = new FrontendV2VisualPage(page, baseUrl);
      const blockers = [];

      try {
        for (const state of frontendV2VisualStates()) {
          try {
            await app.goto(state.path, state.ready);
            if (state.action) await state.action(app);
            await expectNoHorizontalOverflow(page, state.name);
            await saveSnapshot(page, testInfo, viewportProfile, state.name);
          } catch (error) {
            blockers.push(`${viewportProfile.name}/${state.name}: ${error.message}`);
          }
        }
      } finally {
        await context.close();
      }

      await testInfo.attach('frontend-v2-visual-blockers', {
        body: JSON.stringify(blockers, null, 2),
        contentType: 'application/json',
      });
      expect(blockers).toEqual([]);
    });
  }
});

async function saveSnapshot(page, testInfo, viewportProfile, stateName) {
  const filePrefix = viewportProfile.filePrefix ? `${viewportProfile.filePrefix}-` : '';
  const snapshotPath = testInfo.snapshotPath(`${filePrefix}${stateName}.png`);
  await fs.mkdir(path.dirname(snapshotPath), { recursive: true });
  await page.screenshot({
    path: snapshotPath,
    fullPage: false,
    animations: 'disabled',
    caret: 'hide',
  });
}

async function expectNoHorizontalOverflow(page, label) {
  const metrics = await page.evaluate(() => ({
    bodyClientWidth: document.body.clientWidth,
    bodyScrollWidth: document.body.scrollWidth,
    docClientWidth: document.documentElement.clientWidth,
    docScrollWidth: document.documentElement.scrollWidth,
  }));
  const extraBody = metrics.bodyScrollWidth - metrics.bodyClientWidth;
  const extraDoc = metrics.docScrollWidth - metrics.docClientWidth;
  expect(
    Math.max(extraBody, extraDoc),
    `${label} should not create horizontal page overflow`,
  ).toBeLessThanOrEqual(1);
}
