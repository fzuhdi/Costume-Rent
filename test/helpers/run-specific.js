const { execSync } = require("child_process");

const keyword = process.argv.slice(2).join(" ");

if (!keyword) {
  console.error("❌ Missing test keyword / AC id");
  process.exit(1);
}

execSync(
  `npx playwright test --grep "${keyword}"`,
  { stdio: "inherit" }
);
