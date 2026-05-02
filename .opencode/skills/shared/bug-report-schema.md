# Bug Report Schema — Canonical Definition
**Location:** `.opencode/skills/shared/bug-report-schema.md`  
**Last Updated:** 2026-04-26  
**Owner:** sync-bug-reports.js (auto-generated) + Engineer (manual updates)

All agents MUST use this exact schema.  
Do NOT add fields without updating this file.  
Do NOT write bug reports manually — run `npm run test` in `test/` to auto-generate.

---

## File Naming Convention
```
.opencode/state/bug-reports/BUG-[FEATURE_ID]-[TEST_ID]-[HASH].json
```
- `FEATURE_ID`: matches the Feature ID in `docs/ACCEPTANCE_CRITERIA.md` (e.g., `AUTH`, `CATALOGUE`, `RENT`)
- `TEST_ID`: the test identifier in `AC###-###` format (no hyphen after AC, e.g., `AC001-001` for test 1 of AC-001)
- `HASH`: 6-character MD5 hash for uniqueness

Examples:
```
BUG-AUTH-AC001-001-27526D.json          ← test 1 of AC-001 (Authentication)
BUG-CATALOGUE-AC003-001-883D9D.json     ← test 1 of AC-003 (Costume Management)
BUG-RENT-AC014-001-A3F2B1.json          ← test 1 of AC-014 (Rental System)
BUG-SETTINGS-AC022-001-B4C8E2.json      ← test 1 of AC-022 (Settings)
```

---

## Full Schema

```json
{
  // ── Identity ──────────────────────────────────────────────────────────────
  "id":          "BUG-[FEATURE_ID]-[TEST_ID]-[HASH]",        // e.g. BUG-RENT-AC014-001-A3F2B1
  "feature":     "RENT",                                     // matches feature ID in ACCEPTANCE_CRITERIA.md
  "ac":          "AC-014",                                   // which acceptance criterion failed
  "title":       "[AC-014-001] Delete rental removes from database",

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  "status":      "open",                          // see Status Values below
  "raisedBy":    "sdet",                          // always "sdet" — set by sync script
  "resolvedBy":  null,                            // set by engineer on verify, or "playwright" on auto-verify
  "iteration":   0,                               // orchestrator iteration when this was raised

  // ── Failure Detail (set by sync-bug-reports.js) ───────────────────────────
  "failureReason": "expect(received).toBe(expected)",  // first line of error — short, readable
  "expected":      "Assertion expected: 201",           // what the test asserted should happen
  "actual":        "Error 1: expect(received).toBe(expected)\n  Expected : 201\n  Received : 404\n  At       : rental.test.js:42",

  "errorDetails": [                               // one entry per error (usually 1, retries may have more)
    {
      "index":    1,
      "message":  "expect(received).toBe(expected)",  // plain error message, no stack
      "expected": "201",                              // extracted from assertion output
      "received": "404",                              // extracted from assertion output
      "location": "rental.test.js:42",               // first app-code stack frame
      "fullError": "..."                              // full raw error, capped at 1500 chars
    }
  ],

  // ── Evidence (set by sync-bug-reports.js) ─────────────────────────────────
  "screenshot":  "test/test-results/rental-AC-014/screenshot.png",  // null if not captured
  "trace":       "test/test-results/rental-AC-014/trace.zip",       // null if not captured
  "duration":    "3.2s",                          // how long the test ran before failing
  "retries":     1,                               // number of retries before final failure

  // ── Engineer Analysis (set by engineer agent) ─────────────────────────────
  "analysis":    null,                            // populated by engineer when fixing or escalating

  // ── Audit Trail (append-only, never delete entries) ───────────────────────
  "statusHistory": [
    {
      "from":   null,
      "to":     "open",
      "by":     "sdet",
      "at":     "2026-04-26T06:14:12.000Z",
      "reason": "Test failed: expect(received).toBe(expected)"
    }
  ]
}
```

---

## Status Values

| Status | Set by | Meaning |
|---|---|---|
| `open` | sync script / sdet | Test failed, needs engineer fix |
| `todo` | engineer | Fix blocked — requires out-of-scope change |
| `sdet-fault` | engineer | Test assertion contradicts the AC (high bar, must quote AC) |
| `verified` | sync script / engineer | Test now passes, fix confirmed |

### Transition Rules
```
null       → open        (sync script: new failure)
open       → verified    (sync script: test now passing)
open       → todo        (engineer: blocked)
open       → sdet-fault  (engineer: test is wrong, not code)
verified   → open        (sync script: regression detected)
sdet-fault → open        (sdet: engineer was wrong, assertion is correct)
todo       → open        (engineer or human: blocker resolved)
sdet-fault → sdet-fault  (sync script: conflict — human review required)
```

### Forbidden Transitions
- `verified → sdet-fault` — if it passed, the test is not faulty
- `sdet-fault → verified` — engineer cannot self-verify a sdet-fault claim
- Any status → `verified` without the test actually passing in Playwright

---

## Field Rules

**Fields set ONLY by `sync-bug-reports.js` (do not manually edit):**
- `id`, `feature`, `ac`, `raisedBy`
- `failureReason`, `actual`, `errorDetails`
- `screenshot`, `trace`, `duration`, `retries`
- `statusHistory` entries where `by === "sdet"` or `by === "playwright"`

**Fields set ONLY by engineer agent:**
- `analysis` — required when setting status to `sdet-fault` or `todo`
- `resolvedBy` — set to `"engineer"` when manually verifying
- `statusHistory` entries where `by === "engineer"`

**Fields set by orchestrator:**
- `iteration` — updated to current orchestrator iteration when bug is first raised

---

## sdet-fault High Bar

Engineer may only set `status: "sdet-fault"` if ALL of the following are true:

1. The application behaviour matches the AC **exactly**
2. The test assertion contradicts the AC — not just the engineer's interpretation
3. The `analysis` field quotes the **specific AC line** that the test misrepresents

Example of valid `analysis` for sdet-fault:
```
AC-014 states: "system saves the rental and returns HTTP 201".
Test asserts: response.status === 200.
The AC explicitly requires 201, not 200. The assertion is checking the wrong status code.
```

---

## Example — Full Populated Report

```json
{
  "id": "BUG-RENT-AC014-001-A3F2B1",
  "feature": "RENT",
  "ac": "AC-014",
  "title": "[AC-014-001] Delete rental removes from database",
  "status": "verified",
  "raisedBy": "sdet",
  "resolvedBy": "engineer",
  "iteration": 2,
  "failureReason": "expect(received).toBe(expected)",
  "expected": "Assertion expected: 201",
  "actual": "Error 1: expect(received).toBe(expected)\n  Expected : 201\n  Received : 404\n  At       : rent_handler.go route not registered",
  "errorDetails": [
    {
      "index": 1,
      "message": "expect(received).toBe(expected)",
      "expected": "201",
      "received": "404",
      "location": "rental.test.js:42",
      "fullError": "Error: expect(received).toBe(expected)\n\nExpected: 201\nReceived: 404\n    at rental.test.js:42"
    }
  ],
  "screenshot": "test/test-results/rental-AC-014/screenshot.png",
  "trace": "test/test-results/rental-AC-014/trace.zip",
  "duration": "3.2s",
  "retries": 1,
  "analysis": "Root cause: POST /api/rents route was not registered in routes/routes.go. Fix: added route registration in the authenticated group.",
  "statusHistory": [
    {
      "from": null,
      "to": "open",
      "by": "sdet",
      "at": "2026-04-26T06:14:12.000Z",
      "reason": "Test failed: expect(received).toBe(expected)"
    },
    {
      "from": "open",
      "to": "verified",
      "by": "engineer",
      "at": "2026-04-26T07:02:45.000Z",
      "reason": "Root cause fixed: route was missing from routes.go"
    }
  ]
}
```