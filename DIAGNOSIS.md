# 🔍 DIAGNOSIS — School Connect v7 → v8 Expert Audit

A complete, evidence-based audit of the live site
(`hmgtechnologies.github.io/schoolconnectv2/`) and the full source repository,
plus the bugs the client reported directly.

Each finding lists **Severity · Where · Root cause · Impact · Fix · Verification.**

**Severity legend:** 🔴 Critical · 🟠 High · 🟡 Medium · 🔵 Low / hardening.

All fixes below are implemented in this `school connect gen` package and were
**verified** (SQL on a real PostgreSQL 17 server; JS via `node --check` and an
end-to-end generation run in a sandbox).

---

## 🔴 CRITICAL

### D-01 · Schema fails with `42P01: relation "public.profiles" does not exist`  *(client-reported)*
- **Where:** `database/schema.sql`, lines ~15–40 (helper functions) executed before line ~50 (the `profiles` table).
- **Root cause:** `is_staff()`, `is_admin()` and `is_parent_of()` are defined at the **top** of the file. They `select ... from public.profiles` / `public.parent_child`. Those tables are created **lower down**. Postgres executes top-to-bottom, so the very first `create function` referencing a not-yet-created table aborts the whole script.
- **Impact:** **Nobody can install the database.** Every generated school is dead on arrival — no tables, no auth, no app. This is the single most damaging defect.
- **Fix:** Re-architected `schema.sql` into a strict order:
  1. extensions → 2. **all tables** (with `profiles` and `parent_child` created early) → 3. helper functions → 4. new-user trigger → 5. RLS policies → 6. views.
- **Verification:** Ran the file on PostgreSQL 17 against a Supabase-style `auth.users` shim. Result: **`School Connect schema v8 installed successfully ✅`**, exit code 0, and **idempotent** (runs twice with no error). 52 base tables created.

### D-02 · Voting schema fails with the same `42P01` error  *(client-reported)*
- **Where:** `database/voting-schema.sql`.
- **Root cause:** The file creates `polls`/`poll_votes` and policies that reference `public.profiles` and `public.is_staff()`, but it never guarantees those dependencies exist. If a user runs the voting file on its own (the docs implied it was a standalone "upgrade" file), Postgres throws 42P01 on the first reference.
- **Impact:** The headline "Voting & Polls" blueprint feature cannot be installed by anyone who runs the voting file independently.
- **Fix:** Made `voting-schema.sql` **self-contained** — it now creates a minimal `profiles` table and the `is_staff()` helper **only if missing** (`create table if not exists`, `create or replace function`) *before* defining the voting tables and policies.
- **Verification:** Ran on a **fresh, empty** database (no main schema, no profiles): **`Voting schema v8 ready ✅`**, exit code 0, idempotent.

### D-03 · Login does nothing — `App.handleSignIn` is undefined  *(client-reported)*
- **Where:** `assets/js/templates.js` `loginPage()` emits `<form onsubmit="App.handleSignIn(event)">`; `assets/js/generator.js` `appJS()` defined `handleSignIn` as a **bare global function**.
- **Root cause:** `App.handleSignIn` ≠ `handleSignIn`. The form referenced a method that did not exist on the `App` object, so submitting did nothing (the page just reloaded). Same for `handleSignUp`.
- **Impact:** **No user can ever log in or register** on a generated site, even with valid credentials and a configured database. This matches the client's report exactly: "I enter email address but still I am not able to login."
- **Fix:** Moved `handleSignIn`/`handleSignUp` to be **methods of `App`**, added submit-button loading state and clearer error toasts, and kept global aliases for safety.
- **Verification:** Generated `login.html` now references `App.handleSignIn`, `App.handleSignUp`, `App.switchAuthTab`; generated `app.js` defines all three and passes `node --check`.

### D-04 · Login page boot script calls undefined `T.switchAuthTab`
- **Where:** `templates.js` `loginPage()` inline `<script>`: `T.switchAuthTab('signin')`.
- **Root cause:** `T` lives in `templates.js`, which is a **builder-only** file and is **not shipped** to generated sites. On the generated login page, `T` is `undefined`, so the inline script throws and aborts page bootstrap (compounding D-03).
- **Impact:** Even after fixing D-03, the login page's JS would still error on load.
- **Fix:** The login page now calls `App.switchAuthTab` (in the shipped `app.js`). `App.init()` shows the Sign-in tab by default on public pages. A builder-preview-only `T.switchAuthTab` remains for the wizard preview.
- **Verification:** Generated `login.html` contains **zero** `T.switchAuthTab` references; 6/6 balanced `<script>` tags.

### D-05 · Uploaded logo never displays — hard-coded `logo.svg`  *(client-reported)*
- **Where:** `templates.js` (head `<link rel=icon>`, login card `<img>`, sidebar brand, PWA banner) all hard-coded `assets/img/logo.svg`.
- **Root cause:** When a user uploads a PNG/JPG, the generator correctly packages it as `assets/img/logo.png` (or `.jpg`) — but the templates still pointed at `logo.svg`, which doesn't exist for those uploads, so the browser showed a broken/placeholder image (the default badge).
- **Impact:** Branding is broken on every page for every school that uploads a non-SVG logo — including the login page, exactly as reported.
- **Fix:** All templates now emit `logo.${cfg.logoExt}` using the **actual packaged extension**. `bellAndBanner()` now takes `config`; `head()`, `loginPage()`, `renderNav()`, `pageAbout()`, `pageIndex()`, the manifest and the service worker all use the dynamic extension. The icon MIME type is corrected (`image/jpeg` for `.jpg`).
- **Verification:** With an uploaded PNG, the generated site packages `assets/img/logo.png` and every page references `logo.png`.

### D-06 · Generated `app.js` had a JavaScript syntax error
- **Where:** `appJS()` "pending approval" message string.
- **Root cause:** `You\'ll`/`it\'s` apostrophes inside a single-quoted output string broke escaping when emitted, producing `'...You'll...'` → `SyntaxError: Unexpected identifier 'll'`.
- **Impact:** The **entire runtime fails to parse**, breaking role-gating, dark mode, sign-out, dashboards — every page.
- **Fix:** Re-worded to plain ASCII ("You will receive an email once it is activated").
- **Verification:** Generated `app.js` passes `node --check`.

---

## 🟠 HIGH

### D-07 · RLS policy loop references a non-existent table `sow`
- **Where:** `schema.sql` `do $$ ... unnest(array[... 'sow' ...])`.
- **Root cause:** The table is named `scheme_of_work`; the loop used the UI alias `'sow'`. `format('... public.%I', 'sow')` produces `public.sow` → `relation "public.sow" does not exist`.
- **Impact:** Even after fixing D-01, the policy loop would still abort at `sow`, leaving later tables without policies.
- **Fix:** Loop now lists `scheme_of_work` (and the new v8 tables). Verified by a clean full run.

### D-08 · `poll_results` view references a missing column
- **Where:** `voting-schema.sql` / `schema.sql` view `poll_results`.
- **Root cause:** `count(v.id)` — but the lateral subquery only selects `candidate_id, count(*) as c`; there is no `v.id`.
- **Impact:** Creating the view fails (`column v.id does not exist`), aborting the script tail.
- **Fix:** Uses `coalesce(sum(v.c),0)` for totals and a null-filtered `jsonb_agg` for the breakdown. Verified the view creates and queries.

### D-09 · Sign-out button hidden from non-admins
- **Where:** `templates.js` topbar: `<button ... onclick="App.signOut()" data-admin-only>`.
- **Root cause:** `data-admin-only` hides the element for everyone except admins, so parents/students/teachers had **no way to sign out**.
- **Fix:** Sign-out now uses `data-signout` and is shown for any logged-in user.

### D-10 · `data-admin-only` actually applied staff-level visibility
- **Where:** `appJS()` `applyRoleVisibility()`.
- **Root cause:** Both `[data-admin-only]` and `[data-staff-only]` were toggled by the same `isStaff` flag, so "admin only" controls were visible to all staff.
- **Fix:** `[data-admin-only]` now uses `isAdmin`; `[data-staff-only]` uses `isStaff`. `bursar` added to the staff set to match the DB role check constraint.

---

## 🟡 MEDIUM

### D-11 · `DEPLOYMENT-GUIDE.md` promised in a toast was never in the ZIP
- **Where:** `wizard.js` success toast says "See DEPLOYMENT-GUIDE.md in the ZIP," but `generator.js` only added `README.md`.
- **Fix:** The generator now writes `README.md`, **`DEPLOYMENT-GUIDE.md`** and **`TROUBLESHOOTING.md`** into every ZIP — all detailed and step-by-step.

### D-12 · Inaccurate themes/fonts/modules counts
- **Where:** `catalog.js` / `config.js` console + chatbot ("14 themes, 8 fonts, 54 modules").
- **Reality:** 86 themes, 42 fonts, and (after v8 additions) **62 modules**, with **no duplicate module IDs** (verified programmatically).
- **Fix:** Strings corrected; version bumped to v8.

### D-13 · Manifest icon MIME type wrong for JPG logos
- **Where:** `generator.js` manifest icons used `image/jpg`.
- **Fix:** Now emits the correct `image/jpeg` for `.jpg` (and `image/svg+xml` for SVG).

### D-14 · `applyRoleVisibility()` crashed in demo mode
- **Where:** `appJS()` called `sb.auth.getUser()` with no null-check.
- **Fix:** Guarded — if `sb` is `null` (keys not yet pasted), it no longer throws; clearer "Database not configured" guidance is shown on login.

---

## 🔵 LOW / HARDENING

- **D-15 · `pgcrypto` extension** added (alongside `uuid-ossp`) for `gen_random_uuid()` portability.
- **D-16 · Variable shadowing:** `toggleSidebar()` declared a local `const sb` that shadowed the global Supabase client; renamed to `el`.
- **D-17 · Attendance RLS** now also resolves parents via `parent_child` (not only by `guardian_email`), matching the rest of the policy set.
- **D-18 · Idempotency:** confirmed both SQL files can be re-run safely (every object uses `if not exists` / `drop ... if exists` / `create or replace`).

---

## ✅ Verification summary

| Check | Tool | Result |
|-------|------|--------|
| `schema.sql` runs clean on empty DB | PostgreSQL 17 | ✅ exit 0, success message |
| `schema.sql` idempotent (run x2) | PostgreSQL 17 | ✅ exit 0 |
| `voting-schema.sql` runs **standalone** | PostgreSQL 17 | ✅ exit 0, no 42P01 |
| `poll_results` view query | PostgreSQL 17 | ✅ returns rows |
| All builder JS parses | `node --check` | ✅ all pass |
| Generated `app.js` / `config.js` / `sw.js` parse | `node --check` | ✅ all pass |
| End-to-end ZIP generation | sandboxed Node run | ✅ 36 files, all non-empty |
| Generated login wiring | grep | ✅ `App.handleSignIn/SignUp/switchAuthTab`, 0 `T.` refs |
| Uploaded-logo path | grep | ✅ every page → `logo.png` |
