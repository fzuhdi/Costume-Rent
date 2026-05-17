const { execSync } = require("child_process");

const feature = process.argv[2];

if (!feature) {
  console.error("❌ Missing feature id");
  process.exit(1);
}

execSync(
  `npx playwright test specs/${feature}.spec.js`,
  { stdio: "inherit" }
);
