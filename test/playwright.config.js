const { defineConfig } = require('@playwright/test');

const baseURL = process.env.PLAYWRIGHT_BASE_URL || process.env.PW_BASE_URL || 'http://localhost:5173';
const outputDir = process.env.PLAYWRIGHT_OUTPUT_DIR || process.env.PW_OUTPUT_DIR || 'test-results';
const jsonOutputFile = process.env.PLAYWRIGHT_JSON_OUTPUT || process.env.PW_JSON_OUTPUT || `${outputDir}/results.json`;
const htmlReportDir = process.env.PLAYWRIGHT_HTML_REPORT || process.env.PW_HTML_REPORT;

const htmlReportOptions = { open: 'never' };

if (htmlReportDir) {
  htmlReportOptions.outputFolder = htmlReportDir;
}

module.exports = defineConfig({
  testDir: './specs',
  outputDir,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,  // Set to 0 for exactly 1 screenshot per test
  workers: process.env.CI ? 1 : undefined,
  
  // Reporters for good reporting
  reporter: [
    ['list'],                           // Console output
    ['html', htmlReportOptions],      // HTML report with screenshots
    ['json', { outputFile: jsonOutputFile }]  // JSON for CI
  ],
  
  timeout: 30000,
  use: {
    baseURL,
    trace: 'on-first-retry',
    video: 'on',
    
    // Screenshot: Captures EXACTLY 1 screenshot when test ends
    // Stored in: test-results/<test-name>/screenshot.png
    screenshot: 'on',
    
    actionTimeout: 5000,
  },
});
