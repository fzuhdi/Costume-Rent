const { execSync } = require("child_process");

const feature = process.argv[2];

if (!feature) {
  console.error("❌ Missing feature id");
  process.exit(1);
}

try {
  execSync(
    `npx playwright test test/specs/${feature}.spec.js`,
    { stdio: "inherit" }
  );
} catch (e) {
  // ignore test failure
}

execSync(`node helpers/sync-bug-reports.js`, {
  stdio: "inherit",
});