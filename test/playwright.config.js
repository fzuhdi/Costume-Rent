const path = require('node:path');
const { defineConfig } = require('@playwright/test');

const repoRoot = path.resolve(__dirname, '..');
const artifactRoot = path.resolve(repoRoot, '.artifacts');
const playwrightRoot = path.join(artifactRoot, 'playwright');

function artifactPath(...parts) {
  return path.join(playwrightRoot, ...parts);
}

const baseURL = process.env.PLAYWRIGHT_BASE_URL || process.env.PW_BASE_URL || 'http://localhost:5173';
const outputDir = path.resolve(process.env.PLAYWRIGHT_OUTPUT_DIR || process.env.PW_OUTPUT_DIR || artifactPath('test-results'));
const jsonOutputFile = path.resolve(process.env.PLAYWRIGHT_JSON_OUTPUT || process.env.PW_JSON_OUTPUT || path.join(outputDir, 'results.json'));
const htmlReportDir = path.resolve(process.env.PLAYWRIGHT_HTML_REPORT || process.env.PW_HTML_REPORT || artifactPath('html-report'));
const screenshotDir = path.resolve(process.env.PW_SCREENSHOT_DIR || artifactPath('screenshots'));

module.exports = defineConfig({
  testDir: path.join(__dirname, 'specs'),
  outputDir,
  snapshotPathTemplate: path.join(screenshotDir, '{testFilePath}', '{arg}{ext}'),
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: htmlReportDir }],
    ['json', { outputFile: jsonOutputFile }],
  ],
  projects: [
    {
      name: 'ui:smoke',
      testIgnore: /api\.spec\.js/,
      grepInvert: /@visual|@ui-review/,
    },
    {
      name: 'ui:review',
      testIgnore: /api\.spec\.js/,
      grep: /@ui-review/,
    },
    {
      name: 'e2e:tdd',
      testIgnore: /api\.spec\.js/,
      grepInvert: /@visual|@ui-review/,
    },
    {
      name: 'api',
      testMatch: /api\.spec\.js/,
    },
    {
      name: 'visual',
      grep: /@visual/,
    },
  ],
  timeout: 30000,
  use: {
    baseURL,
    trace: 'retain-on-failure',
    video: 'off',
    screenshot: 'only-on-failure',
    actionTimeout: 5000,
  },
});
