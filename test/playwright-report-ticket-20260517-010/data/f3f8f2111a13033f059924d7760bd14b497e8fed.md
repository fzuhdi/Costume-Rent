# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: settings.spec.js >> Settings >> [SETTINGS-014] - Settings branding page is mobile usable
- Location: specs\settings.spec.js:131:3

# Error details

```
Error: expect(locator).toHaveValue(expected) failed

Locator:  locator('input[placeholder="Inventory & Rental Management"]')
Expected: "Mobile Preview 1779755637346"
Received: "Inventory & Rental Management"
Timeout:  5000ms

Call log:
  - Expect "toHaveValue" with timeout 5000ms
  - waiting for locator('input[placeholder="Inventory & Rental Management"]')
    9 × locator resolved to <input title="" data-rac="" type="text" tabindex="0" data-slot="input" class="input input--primary" id="react-aria1807411845-_r_c_" value="Inventory & Rental Management" placeholder="Inventory & Rental Management" aria-labelledby="react-aria1807411845-_r_d_"/>
      - unexpected value "Inventory & Rental Management"

```

```
Error: Console errors detected:

[ERROR] Failed to load resource: the server responded with a status of 500 (Internal Server Error)
```

# Page snapshot

```yaml
- generic [ref=e3]:
  - navigation [ref=e4]:
    - generic [ref=e5]:
      - button "Buka menu navigasi" [ref=e7]:
        - img [ref=e8]
      - generic [ref=e9]:
        - button "Beralih ke mode gelap" [ref=e10]:
          - img [ref=e11]
        - button "Notifikasi" [ref=e15] [cursor=pointer]:
          - img
        - button "Profil Admin Tari" [ref=e17]:
          - generic [ref=e19] [cursor=pointer]: AT
  - generic [ref=e20]:
    - generic [ref=e21]:
      - generic [ref=e22]:
        - img [ref=e24]
        - generic [ref=e28]: Costume Rent
      - navigation [ref=e29]:
        - generic [ref=e30]:
          - link "Katalog" [ref=e31] [cursor=pointer]:
            - /url: /catalogue
            - img [ref=e32]
            - generic [ref=e34]: Katalog
          - link "Peminjaman" [ref=e35] [cursor=pointer]:
            - /url: /rents
            - img [ref=e36]
            - generic [ref=e39]: Peminjaman
          - link "Klien" [ref=e40] [cursor=pointer]:
            - /url: /clients
            - img [ref=e41]
            - generic [ref=e46]: Klien
        - link "Pengaturan" [ref=e48] [cursor=pointer]:
          - /url: /settings
          - img [ref=e49]
          - generic [ref=e52]: Pengaturan
    - main [ref=e53]:
      - generic [ref=e54]:
        - heading "Pengaturan Aplikasi" [level=1] [ref=e55]
        - generic [ref=e57]:
          - heading "Branding" [level=2] [ref=e59]
          - generic [ref=e60]:
            - generic [ref=e61]:
              - generic [ref=e62]: Logo Aplikasi
              - generic [ref=e63]:
                - img [ref=e65]
                - generic [ref=e69]:
                  - button "Pilih Logo" [ref=e70] [cursor=pointer]:
                    - img
                    - text: Pilih Logo
                  - paragraph [ref=e71]: "Format: PNG, JPG. Maksimal 2MB"
            - generic [ref=e72]:
              - generic [ref=e73]: Nama Aplikasi*
              - textbox "Nama Aplikasi*" [ref=e74]:
                - /placeholder: Costume Rental
                - text: Mobile Test 1779755637505
            - generic [ref=e75]:
              - generic [ref=e76]: Tagline
              - textbox "Tagline" [ref=e77]:
                - /placeholder: Inventory & Rental Management
                - text: Inventory & Rental Management
            - button "Simpan Perubahan" [ref=e78] [cursor=pointer]:
              - img
              - text: Simpan Perubahan
        - generic [ref=e80]:
          - heading "Preview" [level=2] [ref=e82]
          - generic [ref=e84]: Mobile Test 1779755637505
          - generic [ref=e85]:
            - heading "Mobile Test 1779755637505" [level=3] [ref=e86]
            - paragraph [ref=e87]: Inventory & Rental Management
  - navigation [ref=e88]:
    - link "Katalog" [ref=e89] [cursor=pointer]:
      - /url: /catalogue
      - img [ref=e90]
      - generic [ref=e92]: Katalog
    - link "Peminjaman" [ref=e93] [cursor=pointer]:
      - /url: /rents
      - img [ref=e94]
      - generic [ref=e97]: Peminjaman
    - link "Klien" [ref=e98] [cursor=pointer]:
      - /url: /clients
      - img [ref=e99]
      - generic [ref=e104]: Klien
```

# Test source

```ts
  1   | import { test as base, expect } from '@playwright/test';
  2   | import AxeBuilder from '@axe-core/playwright';
  3   | 
  4   | const IGNORED_AXE_RULES = [
  5   |   'color-contrast',
  6   |   'scrollable-region-focusable',
  7   | ];
  8   | 
  9   | export const test = base.extend({
  10  | 
  11  |   // ── Console Guard ──────────────────────────────────────────────────────────
  12  |   // Captures ERRORS only (warnings are covered by axe a11yGuard below)
  13  |   // Deduplicates by type::text key, tracks occurrence count
  14  |   consoleGuard: [async ({ page }, use) => {
  15  |     const seen   = new Map();   // key: "type::text" → count
  16  |     const issues = [];          // { key, label } — unique entries only
  17  | 
  18  |     page.on('console', (msg) => {
  19  |       if (msg.type() !== 'error') return;
  20  | 
  21  |       const text = msg.text();
  22  |       const key  = `error::${text}`;
  23  | 
  24  |       if (text.includes('401') || text.includes('404')) return;
  25  | 
  26  |       if (!seen.has(key)) {
  27  |         seen.set(key, 1);
  28  |         issues.push({ key, label: `[ERROR] ${text}` });
  29  |       } else {
  30  |         seen.set(key, seen.get(key) + 1);
  31  |       }
  32  |     });
  33  | 
  34  |     // Capture uncaught page exceptions (separate from console.error)
  35  |     page.on('pageerror', (err) => {
  36  |       const text = err.message;
  37  |       const key  = `pageerror::${text}`;
  38  | 
  39  |       if (text.includes('concurrent rendering') || text.includes('React was able to recover')) return;
  40  | 
  41  |       if (!seen.has(key)) {
  42  |         seen.set(key, 1);
  43  |         issues.push({ key, label: `[PAGEERROR] ${text}` });
  44  |       } else {
  45  |         seen.set(key, seen.get(key) + 1);
  46  |       }
  47  |     });
  48  | 
  49  |     await use();
  50  | 
  51  |     if (issues.length > 0) {
> 52  |       throw new Error(
      |             ^ Error: Console errors detected:
  53  |         `Console errors detected:\n\n${
  54  |           issues
  55  |             .map(i => {
  56  |               const count = seen.get(i.key);
  57  |               return `${i.label}${count > 1 ? ` (×${count})` : ''}`;
  58  |             })
  59  |             .join('\n\n')
  60  |         }`
  61  |       );
  62  |     }
  63  |   }, { auto: true }],
  64  | 
  65  |   // ── Accessibility Guard ────────────────────────────────────────────────────
  66  |   // Covers warnings via axe-core (aria-label, contrast, role violations etc.)
  67  |   // Only flags critical and serious violations
  68  |   a11yGuard: [async ({ page }, use, testInfo) => {
  69  |     await use();
  70  | 
  71  |     const results = await new AxeBuilder({ page })
  72  |       .withTags(['wcag2a', 'wcag2aa', 'best-practice'])
  73  |       .disableRules(IGNORED_AXE_RULES)
  74  |       .analyze();
  75  | 
  76  |     const violations = results.violations
  77  |       .filter(v => v.impact === 'critical' || v.impact === 'serious')
  78  |       .map(v => ({
  79  |         id:             v.id,
  80  |         description:    v.description,
  81  |         impact:         v.impact,
  82  |         failureSummary: v.nodes.map(n => n.failureSummary).join('\n\n'),
  83  |         help:           v.help,
  84  |         tags:           v.tags,
  85  |       }));
  86  | 
  87  |     if (violations.length > 0) {
  88  |       testInfo.attach('axe-violations', {
  89  |         body:        JSON.stringify(violations, null, 2),
  90  |         contentType: 'application/json',
  91  |       });
  92  |       expect(violations).toEqual(
  93  |         [],
  94  |         `Accessibility violations detected. See attached 'axe-violations' for details.`
  95  |       );
  96  |     }
  97  |   }, { auto: true }],
  98  | });
  99  | 
  100 | export { expect } from '@playwright/test';
  101 | 
```