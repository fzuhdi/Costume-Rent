import path from 'node:path';
import { normalizeProjectConfig, runtimeEnvKey } from './config.mjs';

function abs(root, relativePath) {
  return path.resolve(root, ...relativePath.replace(/\\/g, '/').split('/'));
}

function scoped(basePath, scope) {
  return scope ? path.join(basePath, scope) : basePath;
}

export function playwrightArtifactPaths(projectConfig = {}, root = process.cwd(), scope = '') {
  const config = normalizeProjectConfig(projectConfig);
  const artifacts = config.artifacts;
  const normalizedScope = scope ? String(scope).replace(/[^a-zA-Z0-9_.-]+/g, '-') : '';
  const outputDir = scoped(abs(root, artifacts.playwright.output_dir), normalizedScope);
  const htmlReport = scoped(abs(root, artifacts.playwright.html_report), normalizedScope);
  const screenshots = scoped(abs(root, artifacts.playwright.screenshots), normalizedScope);

  return {
    root: abs(root, artifacts.root),
    outputDir,
    jsonOutput: path.join(outputDir, 'results.json'),
    htmlReport,
    screenshots,
    playwrightMcp: abs(root, artifacts.playwright_mcp),
    opencode: abs(root, artifacts.opencode),
  };
}

export function playwrightEnv(runtimeConfig, projectConfig, root, scope = '') {
  const paths = playwrightArtifactPaths(projectConfig, root, scope);
  return {
    [runtimeEnvKey(runtimeConfig, 'playwright_output_dir', 'PW_OUTPUT_DIR')]: paths.outputDir,
    [runtimeEnvKey(runtimeConfig, 'playwright_json_output', 'PW_JSON_OUTPUT')]: paths.jsonOutput,
    [runtimeEnvKey(runtimeConfig, 'playwright_html_report', 'PW_HTML_REPORT')]: paths.htmlReport,
    [runtimeEnvKey(runtimeConfig, 'playwright_screenshots', 'PW_SCREENSHOT_DIR')]: paths.screenshots,
  };
}
