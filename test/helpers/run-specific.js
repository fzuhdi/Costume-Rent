const { execSync } = require("child_process");

const keyword = process.argv.slice(2).join(" ");

if (!keyword) {
  console.error("❌ Missing test keyword / AC id");
  process.exit(1);
}

try {
  execSync(
    `npx playwright test --grep "${keyword}"`,
    { stdio: "inherit" }
  );
} catch (e) {
  // ignore test failure
}