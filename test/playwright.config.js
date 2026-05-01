const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './specs',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,  // Set to 0 for exactly 1 screenshot per test
  workers: process.env.CI ? 1 : undefined,
  
  // Reporters for good reporting
  reporter: [
    ['list'],                           // Console output
    ['html', { open: 'never' }],      // HTML report with screenshots
    ['json', { outputFile: 'test-results.json' }]  // JSON for CI
  ],
  
  timeout: 30000,
  use: {
    baseURL: 'http://localhost',
    trace: 'on-first-retry',
    video: 'on',
    
    // Screenshot: Captures EXACTLY 1 screenshot when test ends
    // Stored in: test-results/<test-name>/screenshot.png
    screenshot: 'on',
    
    actionTimeout: 5000,
  },
});
