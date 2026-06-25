# 🔍 Correctness Audit & Enhancement Report — School Connect FINAL v2

A full, evidence-based audit of **every file, code path, SQL script, workflow and
process** in the platform, the **bugs found and fixed**, and the **new enterprise
features** added (from a deep review of leading platforms). All free tools, **no AI
APIs**. The build is **cumulative** — FINAL v2 ⊇ FINAL ⊇ v3 ⊇ v2 ⊇ v1 ⊇ source repos.

---

## 1. Audit methodology (how every file was checked)

| Layer | Tool / method | Result |
|-------|---------------|--------|
| All builder JavaScript (14 files) | `node --check` | ✅ all valid |
| All **generated** pages (76 inline-script pages) | extract inline `<script>` → `node --check` + tag-balance | ✅ all valid, balanced |
| Generated standalone JS (app/config/sw/cbt/super/enterprise…) | `node --check` | ✅ all valid |
| `manifest.json`, `vercel.json` | `json.load` | ✅ valid |
| `sitemap.xml` | XML parse | ✅ valid |
| CSS | brace balance | ✅ balanced (184/184) |
| All 5 SQL files | run on **PostgreSQL 17** (standalone + in-order + idempotent) | ✅ exit 0 |
| RLS coverage | query `pg_tables` vs `pg_policies` | ✅ every table has RLS + ≥1 policy |
| CBT scoring engine | 18 unit tests inc. edge cases | ✅ all correct |
| CBT → report-card mapping | live SQL simulation | ✅ 48/50 → 57.6/60 = 96% |
| Timetable generator | live SQL simulation | ✅ 12 periods placed, 0 conflicts |
| Asset & page links | resolve every local `src`/`href` | ✅ none broken |
| Handler references | onclick/onchange/onsubmit vs definitions | ✅ none undefined |

---

## 2. 🐞 Bugs found & fixed

### B-(-2) 🔴 Post-login UI broken / icons disorganised (client-reported)
- **Where:** `assets/css/style.css` vs. the logged-in shell markup in `templates.js`.
- **Root cause:** the entire **app-shell layout had NO CSS**. The dashboard/module pages
  render `<div class="app-layout">`, `<aside class="app-sidebar">`, `<nav class="app-nav">`,
  `<span class="app-nav-icon">`, `<main class="app-main">`, `<header class="app-topbar">`,
  `<div class="app-content">` — but **none of those classes existed in `style.css`**. With
  no layout rules, the sidebar didn't position, nav links stacked raw and the icons floated
  disorganised after login. (Marketing/landing pages looked fine because they use different,
  already-styled classes — which is why only the logged-in view looked "worse".)
- **Verified the gap:** a class-coverage scan showed `app-layout, app-sidebar, app-main,
  app-topbar, app-content, app-brand, app-nav, app-nav-icon, app-page-title` all **MISSING**.
- **Fix:** added a complete **App-Shell stylesheet** (~125 lines) covering:
  - sidebar (sticky, scrollable, branded), with hover/active nav states and **fixed-size,
    aligned `app-nav-icon`** boxes (24×24, centered) so icons line up perfectly;
  - the **top bar**, page title and content container;
  - the **`topnav`** and **`cards`** layout variants;
  - polished cards & data tables;
  - **dark-mode** styling for the whole shell;
  - the **high-contrast** accessibility mode used by `enterprise.js`;
  - a **responsive slide-in sidebar drawer** (hamburger ☰) below 900px.
- **Verification:** rendered the dashboard with the new CSS inlined — `.app-layout` flex
  layout, sidebar, and 24px-aligned nav icons all apply; the generated ZIP bundles the fixed
  CSS; `verify.sh` confirms every app-shell class is now defined.

### B-(-1) 🔴 SQL fails on Supabase re-run: `42P16: cannot drop columns from view` (client-reported)
- **Where:** `schema.sql`, `voting-schema.sql` (`poll_results` view) and
  `reportcard-schema.sql` (`report_subject_totals` view).
- **Root cause:** the client's Supabase already had an **older version** of these views
  (from a previous schema run) whose column set differed. `CREATE OR REPLACE VIEW` cannot
  add/remove/retype columns of an existing view, so Postgres raised `42P16`.
- **Reproduced** on PostgreSQL 17 by pre-creating an older 5-column `poll_results`, then
  running our `CREATE OR REPLACE VIEW` → exact `ERROR: cannot drop columns from view`.
- **Fix:** added **`DROP VIEW IF EXISTS … CASCADE;`** immediately before every
  `CREATE … VIEW`, making view (re)creation fully idempotent on any prior state.

### B-(-1b) 🔴 Related: `ERROR: column "voter_id" does not exist` on re-run
- **Root cause:** `CREATE TABLE IF NOT EXISTS` does **not** add missing columns to a table
  that already exists from an older version. A pre-existing `poll_votes` without `voter_id`
  made the RLS policy `auth.uid() = voter_id` fail. (Same class of upgrade bug as the view.)
- **Fix:** added an idempotent **column-backfill block** (`ALTER TABLE … ADD COLUMN IF NOT
  EXISTS`, guarded by `exception when undefined_table`) in `schema.sql` and `voting-schema.sql`
  covering every column the policies/views reference (`voter_id`, `candidate_id`, `poll_id`,
  `role`, `status`, `student_id`, `from_id`, `to_id`, `submitted_by`, `parent_id`, `user_id`, …).
- **Verification (PostgreSQL 17):** all 5 SQL files now run clean (a) on a fresh DB, (b) each
  standalone, (c) **against a simulated client DB with old views + missing columns**, and
  (d) **twice** (idempotent) — every run EXIT=0.

### B-0 🔴 Wizard navigation broke — "Next" / step indicators / preset buttons (client-reported)
- **Where:** `wizard.js` `bindUI()` dispatcher.
- **Root cause:** the click handler did `Wizard[a.dataset.wizard]` with the **raw string**,
  so it only worked for argument-less actions (`next`, `prev`). Any parameterised action —
  `showStep(2)`, `usePreset('secondary')`, `load(this)` — resolved to `Wizard["showStep(2)"]`
  = **undefined**, so step-indicator clicks and preset buttons silently did nothing.
  Additionally, if `init()` threw before `bindUI()` ran (e.g. `?preset=` in the URL calling a
  not-yet-defined `toast`), **no** button bound at all — making even "Next" appear dead.
- **Fix (3 parts):**
  1. Rewrote the dispatcher to **parse `method(arg1, 'arg2', this)`** — numbers, quoted
     strings, booleans and `this` (element) are passed correctly; unknown actions warn.
  2. Hardened `init()` to **bind the UI first** and wrap every later step in try/catch so one
     failure can never disable navigation; `showStep()` is range-checked and its per-step
     setup is guarded.
  3. Added a built-in, dependency-free **`toast()`** for the builder so `applyPreset()` and
     other actions always have feedback and never throw a `ReferenceError`.
- **Verification:** jsdom reproduction — `next`→2, `showStep(4)`→4, `prev`→3, `showStep(1)`→1,
  `usePreset('secondary')`→loads 34 modules + advances; also verified the fragile `?preset=`
  + missing-`toast` scenario now keeps "Next" working.

### B-1 🟠 `robots.txt` referenced a non-existent `sitemap-pages.xml`
- **Where:** builder `robots.txt`. **Impact:** crawlers hit a 404 for a declared sitemap.
- **Fix:** removed the dead reference; kept the real `sitemap.xml`.

### B-2 🟠 Modern (Node/Express) build used fragile JSZip internals
- **Where:** `generator.js` `buildType === 'modern'` block used `fileObj._data` and
  `fileObj.options.binary` (private API) to move files into `public/` — could corrupt
  binary files (e.g. uploaded PNG logos) and break on JSZip upgrades.
- **Fix:** rewritten to re-read each entry via the official `await zip.files[k].async('uint8array')`
  API, and to correctly **keep at root**: `package.json`, `server.js`, `.gitignore`,
  `_headers`, `vercel.json`, all `database/*` and all `*.md`. Verified: index/assets move
  to `public/`, root files stay, no leftovers, binaries intact.

### B-3 🟡 Dashboard doughnut chart could render `NaN`
- **Where:** `appJS` dashboard chart used `students.count - feesLen` where `students.count`
  may be `null` on a failed query → `NaN` slice.
- **Fix:** null-safe (`var _sc = students.count || 0; Math.max(0, _sc - _fp)`).

### Confirmed NOT bugs (verified correct during audit)
- Negative marking does **not** penalise skipped or partial-credit answers (verified).
- Every RLS table has a policy (no accidental lockouts).
- All SQL files are idempotent and order-safe (no `42P01`).
- All generated login/logo wiring correct (`App.handleSignIn`, `logo.png`).

---

## 3. ✨ New enterprise features (from competitor research, free + no AI)

Sourced from Fedena, OpenEduCat, Kinderpedia, eSchool SaaS, Edumerge, Smart School ERP
and others. Added **cumulatively** (nothing removed):

| Feature | What it does | Why (competitor parity) | Files |
|---------|--------------|--------------------------|-------|
| 🗓️ **Conflict-free Timetable Generator** | Deterministic scheduler builds a timetable with **no class/teacher double-booking** from each subject's weekly period demand. | "Timetable generator with conflict detection" (Fedena, OpenEduCat) — **without** the paid "AI auto-timetable" add-on. | `enterprise-schema.sql` (`generate_timetable` fn), `timetable-generator.html`, `enterprise.js` |
| 📲 **QR / code Self Check-in** | Students check in by scanning their **ID-card QR** (or typing admission no) — reuses the existing ID-card QR. | "QR/geofence/biometric attendance" — biometric-free, hardware-free. | `attendance_checkins`, `checkin.html` |
| 📔 **Student Diary** | Daily homework/classwork/behaviour log; parents view & acknowledge. | eSchool "student diary" (v1.6.0). | `student_diary`, `diary.html` |
| 🗒️ **Surveys & Forms** | Anonymous-optional feedback forms with response collection (distinct from elections). | Kinderpedia "Survey & Polls". | `surveys`, `survey_responses`, `surveys.html` |
| 🍽️ **Menu / Meal Planner** | Weekly meals with allergen notes for parents. | Kinderpedia "Menu Planner". | `menu_planner`, `menu.html` |
| 🔐 **2-Factor Auth (free email OTP)** | Optional 2FA via Supabase email OTP — **no SMS/AI cost**; per-user toggle + login audit. | eSchool 2FA, Edumerge security. | `security_prefs`, `login_audit`, `settings.html` |
| 🌍 **Multi-language + ♿ Accessibility** | UI labels in English, French, Kiswahili, **Hausa, Yoruba, Igbo**; font scaling + high-contrast. | "Multi-language & accessibility" trend (2025). | `i18n_strings`, `settings.html`, `enterprise.js` |

All wired into the sidebar nav, the **Ctrl+K command palette**, the service-worker cache,
and the **full interactive preview**, keeping every page interconnected.

---

## 4. Deployment impact (still simple)

The generated ZIP now ships **5** one-click SQL files. Run them in this order in the
Supabase SQL Editor (each prints a success message and is idempotent):

1. `database/schema.sql`
2. `database/voting-schema.sql`
3. `database/cbt-schema.sql`
4. `database/reportcard-schema.sql`
5. `database/enterprise-schema.sql`   ← **new**

Everything else in `DEPLOYMENT-GUIDE.md` is unchanged.

---

## 5. Totals

- **Modules:** 71 (was 65) · **Themes:** 86 · **Fonts:** 42
- **DB tables:** 68 · **RLS policies:** 127 · **SQL functions:** 50+
- **Generated files per school:** 108 (77 HTML pages)
- **`verify.sh`:** all checks pass.
- **No feature removed.** Cumulative guarantee intact.
