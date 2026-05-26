import { test as base, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const IGNORED_AXE_RULES = [
  'color-contrast',
  'scrollable-region-focusable',
];

function allowedConsoleErrorPatterns(testInfo) {
  // Tests that intentionally mock browser errors must opt in with a regex annotation.
  return testInfo.annotations
    .filter(annotation => annotation.type === 'allow-console-error' && annotation.description)
    .map(annotation => new RegExp(annotation.description, 'i'));
}

export const test = base.extend({

  // ── Console Guard ──────────────────────────────────────────────────────────
  // Captures ERRORS only (warnings are covered by axe a11yGuard below)
  // Deduplicates by type::text key, tracks occurrence count
  consoleGuard: [async ({ page }, use, testInfo) => {
    const seen   = new Map();   // key: "type::text" → count
    const issues = [];          // { key, label } — unique entries only

    page.on('console', (msg) => {
      if (msg.type() !== 'error') return;

      const text = msg.text();
      const key  = `error::${text}`;

      if (!seen.has(key)) {
        seen.set(key, 1);
        issues.push({ key, text, label: `[ERROR] ${text}` });
      } else {
        seen.set(key, seen.get(key) + 1);
      }
    });

    // Capture uncaught page exceptions (separate from console.error)
    page.on('pageerror', (err) => {
      const text = err.message;
      const key  = `pageerror::${text}`;

      if (text.includes('concurrent rendering') || text.includes('React was able to recover')) return;

      if (!seen.has(key)) {
        seen.set(key, 1);
        issues.push({ key, text, label: `[PAGEERROR] ${text}` });
      } else {
        seen.set(key, seen.get(key) + 1);
      }
    });

    await use();

    const testAllowedPatterns = allowedConsoleErrorPatterns(testInfo);
    const unallowedIssues = issues.filter(issue => !testAllowedPatterns.some(pattern => pattern.test(issue.text)));

    if (unallowedIssues.length > 0) {
      throw new Error(
        `Console errors detected:\n\n${
          unallowedIssues
            .map(i => {
              const count = seen.get(i.key);
              return `${i.label}${count > 1 ? ` (×${count})` : ''}`;
            })
            .join('\n\n')
        }`
      );
    }
  }, { auto: true }],

  // ── Accessibility Guard ────────────────────────────────────────────────────
  // Covers warnings via axe-core (aria-label, contrast, role violations etc.)
  // Only flags critical and serious violations
  a11yGuard: [async ({ page }, use, testInfo) => {
    await use();

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'best-practice'])
      .disableRules(IGNORED_AXE_RULES)
      .analyze();

    const violations = results.violations
      .filter(v => v.impact === 'critical' || v.impact === 'serious')
      .map(v => ({
        id:             v.id,
        description:    v.description,
        impact:         v.impact,
        failureSummary: v.nodes.map(n => n.failureSummary).join('\n\n'),
        help:           v.help,
        tags:           v.tags,
      }));

    if (violations.length > 0) {
      testInfo.attach('axe-violations', {
        body:        JSON.stringify(violations, null, 2),
        contentType: 'application/json',
      });
      expect(violations).toEqual(
        [],
        `Accessibility violations detected. See attached 'axe-violations' for details.`
      );
    }
  }, { auto: true }],
});

export { expect } from '@playwright/test';
