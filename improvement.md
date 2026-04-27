# Project Structure Improvement Plan
**Project:** Costume Rental Management  
**Verified against actual repo:** 2026-04-26  
**Status:** Several items already fixed — remainder listed below

---

## ✅ Already Done — No Action Needed

These items have been confirmed resolved in the current repo:

- `.env.production` is gitignored ✓
- `backend/.env` is gitignored ✓
- `frontend/.env*` is gitignored ✓
- `frontend/dist/` is gitignored and not present ✓
- `frontend/node_modules/` is gitignored ✓
- `nul` is gitignored (rule exists) ✓
- `temp/` is gitignored (rule exists) ✓
- `*.log` is gitignored ✓
- `.opencode/state/` is gitignored via `.opencode/.gitignore` ✓
- `test/test-results/` is not present in the repo ✓
- `docs/` folder now exists with `project-plan.md` and `acceptance-criteria.md` ✓
- `.context/` folder has been removed; content moved to `docs/` and `.opencode/skills/costume-rental/` ✓
- SDET skill (`sdet/SKILL.md`) has been updated with assertion integrity rules ✓

---

## 🔴 Critical — Fix Immediately

### 1. Compiled binary `backend/server` still tracked by git

The file `backend/server` (14MB Go binary) is present in the repo and listed in `.gitignore`. The rule exists but was added after the file was committed, so git is still tracking it.

**Action — run these commands:**
```bash
git rm --cached backend/server
git commit -m "chore: remove compiled binary from tracking"
```

---

### 2. `nul` file still tracked by git

The file `nul` (0-byte Windows artifact) is present in the repo. Same situation as above — gitignored but still tracked.

**Action — run these commands:**
```bash
git rm --cached nul
git commit -m "chore: remove nul artifact"
```

---

### 3. Check git history for committed secrets

The following files contain placeholder secrets and are now gitignored, but may have been committed to history:
```
backend/.env       → JWT_SECRET=your_super_secret_key_here_change_in_production
.env.production    → JWT_SECRET=change_this_to_a_long_random_string
```

**Action — check first, then purge if found:**
```bash
# Check whether they were ever committed
git log --all --full-history -- backend/.env .env.production
```

If the above command returns any commits, run:
```bash
git filter-branch --force --index-filter \
  'git rm --cached --ignore-unmatch backend/.env .env.production' \
  --prune-empty --tag-name-filter cat -- --all
# Then force-push — coordinate with your team before doing this
```

After purging, create safe example files:
```bash
cp backend/.env backend/.env.example
# Open backend/.env.example and blank out all secret values
cp .env.production .env.production.example
# Open .env.production.example and blank out all secret values
```

---

### 4. `go.sum` is gitignored — this is wrong

`backend/go.sum` is listed in `.gitignore` but it must not be. `go.sum` contains cryptographic checksums of all Go dependencies. Ignoring it breaks `go mod verify`, reproducible builds, and offline Docker builds.

**Action — edit `.gitignore` and re-add the file:**

In `.gitignore`, remove this line:
```
backend/go.sum
```

Replace the backend section with:
```gitignore
# Backend
backend/server
backend/*.db
backend/uploads/
backend/.env
# go.sum intentionally NOT ignored — required for reproducible builds
```

Then run:
```bash
git add backend/go.sum
git commit -m "fix: restore go.sum to version control"
```

---

### 5. Engineer skill references a file that does not exist

The file `.opencode/skills/engineer/SKILL.md` contains this instruction:

> Read `.opencode/skills/costume-rental/context.md` for stack details, credentials, API endpoints, and known fixes before starting work.

The file `context.md` does not exist inside `.opencode/skills/costume-rental/`. The actual files there are `SKILL.md`, `project-notes.md`, and `quick-ref.md`. When the Engineer agent follows this instruction it will find nothing and either halt or hallucinate.

**Action — fix the reference in `.opencode/skills/engineer/SKILL.md`:**

Find the line:
```
Read `.opencode/skills/costume-rental/context.md` for stack details ...
```

Replace it with:
```
Read `.opencode/skills/costume-rental/SKILL.md`, `project-notes.md`, and `quick-ref.md` for stack details, credentials, API endpoints, and known fixes before starting work.
```

---

## 🟡 Structural — Fix Before Scaling

### 6. `test/test-log.txt` is still tracked

`test/test-log.txt` is a generated output file that should not be in the repo. `.gitignore` does not yet have a rule for it.

**Action:**
```bash
echo "test/test-log.txt" >> .gitignore
git rm --cached test/test-log.txt
git commit -m "chore: untrack playwright test log"
```

---

### 7. Two acceptance criteria files with different content

```
docs/acceptance-criteria.md      ← 95 lines  (created from .context/ migration)
test/ACCEPTANCE_CRITERIA.md      ← 210 lines (used by SDET agent and test suite)
```

These are out of sync. The SDET skill currently reads from `docs/ACCEPTANCE_CRITERIA.md` (note: uppercase). The 210-line version in `test/` is more complete and should be the single source of truth.

**Action — consolidate into one canonical file:**
```bash
# Copy the complete version to docs/ as the canonical file
cp test/ACCEPTANCE_CRITERIA.md docs/ACCEPTANCE_CRITERIA.md

# Remove the incomplete version
rm docs/acceptance-criteria.md

# Replace the content of test/ACCEPTANCE_CRITERIA.md with a pointer
echo "# Acceptance Criteria" > test/ACCEPTANCE_CRITERIA.md
echo "" >> test/ACCEPTANCE_CRITERIA.md
echo "See /docs/ACCEPTANCE_CRITERIA.md — that is the single source of truth." >> test/ACCEPTANCE_CRITERIA.md

git add docs/ACCEPTANCE_CRITERIA.md docs/acceptance-criteria.md test/ACCEPTANCE_CRITERIA.md
git commit -m "docs: consolidate acceptance criteria into docs/ACCEPTANCE_CRITERIA.md"
```

After this, verify that `.opencode/skills/sdet/SKILL.md` references `docs/ACCEPTANCE_CRITERIA.md` (capital letters). Update the path in the SDET skill if it does not match.

---

### 8. All models in a single file

```
backend/models/
  └── models.go    ← 9 structs in one file: User, Region, Category, Costume,
                      CostumeImage, Client, RentOrder, RentOrderItem, AppSetting
```

**Action — split per domain. Create these files:**

`backend/models/user.go` — move the `User` struct here  
`backend/models/costume.go` — move `Costume`, `CostumeImage`, `Region`, `Category` here  
`backend/models/client.go` — move the `Client` struct here  
`backend/models/rent_order.go` — move `RentOrder`, `RentOrderItem` here  
`backend/models/app_setting.go` — move the `AppSetting` struct here  

Each file must keep the same `package models` declaration at the top. Delete `models.go` once all structs are moved. The Go compiler treats all `.go` files in the same directory as one package, so no import changes are needed elsewhere.

```bash
git add backend/models/
git rm backend/models/models.go
git commit -m "refactor: split models.go into per-domain files"
```

---

### 9. Test files flat with no domain grouping

All Playwright `.test.js` files and the shell script live directly in `test/` with no subdirectory structure.

**Action — reorganise into `e2e/` and `api/` subfolders:**

Target structure:
```
test/
  ├── e2e/
  │   ├── auth.test.js
  │   ├── client.test.js
  │   ├── settings.test.js
  │   ├── notification.test.js
  │   ├── frontend.test.js
  │   ├── catalogue/
  │   │   ├── costume.test.js
  │   │   └── navigation.test.js
  │   └── rental/
  │       └── rental.test.js
  ├── api/
  │   ├── api.test.js
  │   └── api-test.sh
  ├── ACCEPTANCE_CRITERIA.md
  ├── playwright.config.js
  ├── package.json
  └── package-lock.json
```

After moving files, update `playwright.config.js` to set `testDir` to `./e2e` instead of `./` (or `.`). Verify the config picks up the new paths before committing.

```bash
mkdir -p test/e2e/catalogue test/e2e/rental test/api
mv test/auth.test.js test/e2e/
mv test/client.test.js test/e2e/
mv test/settings.test.js test/e2e/
mv test/notification.test.js test/e2e/
mv test/frontend.test.js test/e2e/
mv test/costume.test.js test/e2e/catalogue/
mv test/navigation.test.js test/e2e/catalogue/
mv test/rental.test.js test/e2e/rental/
mv test/api.test.js test/api/
mv test/api-test.sh test/api/
git add test/
git commit -m "refactor: reorganise tests into e2e/ and api/ subfolders"
```

---

### 10. `sample.js` is an orphaned prototype at the project root

`sample.js` (463 lines) is a React component with hardcoded costume/rental data and no imports from the actual application. It appears to be an early UI mockup.

**Action — decide and execute one of these:**

Option A — preserve as a design reference:
```bash
mkdir -p docs/prototypes
mv sample.js docs/prototypes/costume-list-mockup.jsx
git add docs/prototypes/costume-list-mockup.jsx
git rm sample.js
git commit -m "chore: move sample.js prototype to docs/prototypes/"
```

Option B — delete it entirely:
```bash
git rm sample.js
git commit -m "chore: remove orphaned sample.js prototype"
```

---

### 11. `temp/` contains a bug log that should be preserved

```
temp/manual-test/rent-new page.md
```

This file documents 5 real bugs on the `/rents/new` page including an actual API error payload. The bug `costume not found: 0` on form submit matches `bug-rental-001.json` in `.opencode/state/bug-reports/`. This is not throwaway content — move it before deleting `temp/`.

**Action:**
```bash
mkdir -p docs/manual-test-notes
mv "temp/manual-test/rent-new page.md" docs/manual-test-notes/rents-new-bugs.md
rmdir temp/manual-test temp/
git add docs/manual-test-notes/rents-new-bugs.md
git rm -r temp/
git commit -m "chore: preserve manual test notes, remove temp/"
```

> Before archiving, check `.opencode/state/bug-reports/bug-rental-001.json` to confirm whether the `costume not found: 0` bug is resolved or still open.

---

## 🟢 Recommended Additions

### 12. `.opencode/.gitignore` is hiding `skills/` from git

`.opencode/.gitignore` currently ignores both `skills/` and `state/`. Ignoring `state/` is correct. Ignoring `skills/` means your entire agent pipeline is not committed to the remote — if you lose the local copy, the agents are gone.

**Action — edit `.opencode/.gitignore`:**

Remove the line:
```
skills/
```

Also remove:
```
opencode.json
```

`opencode.json` is configuration, not state — it should be committed. The file currently contains your permission settings for the agent skills and should be in version control.

After editing, commit the skills folder:
```bash
git add .opencode/skills/ .opencode/opencode.json
git commit -m "chore: commit agent skills and opencode config to version control"
```

---

### 13. Add `AGENTS.md` and context filters to `opencode.json`

Without an `AGENTS.md`, every new OpenCode session starts cold and may scan the entire project — including the 14MB binary — before doing any real work.

**Step 1 — create `AGENTS.md` at the project root.** Keep it under 100 lines. Suggested content:

```markdown
# AGENTS.md — Costume Rental

## Stack
- Backend: Go (Fiber), SQLite (CGO required — set CGO_ENABLED=1)
- Frontend: React + Vite
- Tests: Playwright (JS), shell scripts for API tests
- Orchestration: OpenCode with Engineer / SDET / Orchestrator skills

## Agent Skills
Skills live in `.opencode/skills/`. Load them by name:
- `/orchestrator [feature-id]` — runs full feature dev loop
- `/engineer` — fixes bugs in application code only
- `/sdet` — writes and runs tests, files bug reports

For stack details, credentials, and known fixes:
read `docs/dev/runbook.md` and `docs/dev/project-notes.md`

## Running Tests
```bash
cd test && npx playwright test          # all e2e tests
cd test && npx playwright test e2e/auth # single suite
cd test && bash api/api-test.sh         # API smoke tests
```

## Known Issues
- SQLite requires CGO: always build with `CGO_ENABLED=1 go build`
- Auth hook: use the pattern in `frontend/src/context/AuthContext.jsx`
- Bug `costume not found: 0` on /rents/new — see `.opencode/state/bug-reports/bug-rental-001.json`

## State Files
`.opencode/state/orchestrator-progress.json` — current feature and iteration  
`.opencode/state/bug-reports/` — one JSON file per open bug
```

```bash
git add AGENTS.md
git commit -m "docs: add AGENTS.md for OpenCode session context"
```

**Step 2 — add context filters to `.opencode/opencode.json`:**

Replace the current content of `.opencode/opencode.json` with:
```json
{
  "$schema": "https://opencode.ai/config.json",
  "permission": {
    "skill": {
      "sdet": "allow",
      "engineer": "allow",
      "orchestrator": "allow",
      "*": "allow"
    }
  },
  "context": {
    "include": ["backend/", "frontend/src/", "test/", "docs/", ".opencode/skills/"],
    "exclude": ["backend/server", "frontend/node_modules/", "test/test-results/", "*.db", "*.webm"]
  },
  "autoCompact": true
}
```

This prevents the agent from ever reading the binary, test videos, or node_modules.

---

### 14. `.opencode/skills/costume-rental/` is not a skill — move it to `docs/`

The `costume-rental` folder inside `.opencode/skills/` contains three files:

```
.opencode/skills/costume-rental/
  ├── SKILL.md          ← dev runbook: docker commands, common bug fixes, API endpoint list
  ├── project-notes.md  ← detailed log of every bug fixed during initial build
  └── quick-ref.md      ← quick-start commands and credential reminder
```

None of these files define agent behaviour. There is no decision logic, no tool orchestration, no input/output schema. They are project documentation — the kind of thing that belongs in `docs/`, not alongside real agent skills like `engineer/`, `sdet/`, and `orchestrator/`. Placing them in `.opencode/skills/` misleads OpenCode into treating them as an invokable agent and clutters the skill namespace.

The only agent that reads this folder is the Engineer, and only via the broken `context.md` reference fixed in item 5. Orchestrator and SDET do not reference it at all.

**Action — move all three files to `docs/` and remove the folder:**

```bash
mkdir -p docs/dev
mv .opencode/skills/costume-rental/SKILL.md docs/dev/runbook.md
mv .opencode/skills/costume-rental/project-notes.md docs/dev/project-notes.md
mv .opencode/skills/costume-rental/quick-ref.md docs/dev/quick-ref.md
rm -r .opencode/skills/costume-rental/

git add docs/dev/
git rm -r .opencode/skills/costume-rental/
git commit -m "chore: move costume-rental docs from skills/ to docs/dev/"
```

**After moving, update the Engineer skill reference (item 5 must be done first, or combine them):**

In `.opencode/skills/engineer/SKILL.md`, update the context line to:
```
Read `docs/dev/runbook.md`, `docs/dev/project-notes.md`, and `docs/dev/quick-ref.md` for stack details, credentials, API endpoints, and known fixes before starting work.
```

**Also update `AGENTS.md` (item 13) to point to the new paths:**
```markdown
For stack details, credentials, and known fixes:
read `docs/dev/runbook.md` and `docs/dev/project-notes.md`
```

**Also remove `costume-rental` from the `opencode.json` permissions block**, since it is no longer a skill:

```json
"permission": {
  "skill": {
    "sdet": "allow",
    "engineer": "allow",
    "orchestrator": "allow",
    "*": "allow"
  }
}
```

> Note: items 5, 13, and 14 all touch related paths. If running with OpenCode, do all three in the same session to avoid a state where the Engineer skill points to a path that no longer exists.

---

## Execution Order

Run these in sequence. Each step is independent — if one fails, the others are not affected.

Items 5, 13, and 14 are linked — they all touch paths related to the `costume-rental` folder. Do them in the same session.

| # | Task | Where | Time |
|---|------|--------|------|
| 1 | `git rm --cached backend/server` | CLI | 2 min |
| 2 | `git rm --cached nul` | CLI | 1 min |
| 3 | Check git history for committed `.env` files | CLI | 5 min |
| 4 | Remove `backend/go.sum` from `.gitignore`, re-add file | Editor + CLI | 5 min |
| 5 + 14 | Move `costume-rental/` to `docs/dev/`, fix Engineer skill reference | CLI + editor | 10 min |
| 6 | Untrack `test/test-log.txt` | CLI | 1 min |
| 7 | Consolidate acceptance criteria into `docs/ACCEPTANCE_CRITERIA.md` | CLI | 5 min |
| 8 | Split `backend/models/models.go` into domain files | Editor + CLI | 30 min |
| 9 | Reorganise `test/` into `e2e/` and `api/` | CLI + config edit | 20 min |
| 10 | Move or delete `sample.js` | CLI | 2 min |
| 11 | Preserve `temp/` bug log in `docs/manual-test-notes/` | CLI | 3 min |
| 12 | Remove `skills/` and `opencode.json` from `.opencode/.gitignore` | Editor + CLI | 3 min |
| 13 | Create `AGENTS.md` and update `opencode.json` with context filters | Editor + CLI | 15 min |
