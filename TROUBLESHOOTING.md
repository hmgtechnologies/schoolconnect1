# 🩺 TROUBLESHOOTING — School Connect Gen v8

Find your exact symptom below and apply the fix. (Every generated ZIP also ships a
school-specific copy of this file.)

---

### ❌ `ERROR: 42P01: relation "public.profiles" does not exist` (running the schema)
**Cause:** an old `schema.sql` declared helper functions before the tables they use.
**Fix:** run **`database/schema.sql` from this package** — it creates tables first,
then functions, then policies. It is idempotent (safe to re-run). Verified on
PostgreSQL 17. Do **not** run `voting-schema.sql` before the main schema; the main
schema already contains voting.

---

### ❌ `ERROR: 42P01: relation "public.profiles" does not exist` (running the voting query)
**Cause:** the old voting file assumed `profiles`/`is_staff()` already existed.
**Fix:** use **`database/voting-schema.sql` from this package** — it is now
self-contained and creates those dependencies if they are missing. It runs cleanly
even on a brand-new, empty database.

---

### ❌ I enter my email & password but I'm not logged in
1. **Keys pasted?** Open `assets/js/config.js`. If it still shows
   `YOUR_SUPABASE_URL`, login is disabled — paste your real URL + anon key.
2. **Email confirmed?** Click the Supabase confirmation link from sign-up.
3. **Approved?** New accounts are `pending`. Promote yourself via SQL
   (`update public.profiles set role='admin', status='approved' where email='...';`).
4. **Console (F12)** for red errors. "Database not configured" = item 1.

> Fixed in v8: the buttons are wired to `App.handleSignIn` / `App.handleSignUp` and
> the tabs to `App.switchAuthTab` (all in the shipped `assets/js/app.js`). The old
> version pointed at functions that didn't exist on the generated site.

---

### ❌ My uploaded logo doesn't show (a default badge appears)
**Cause (old version):** pages hard-coded `logo.svg` while your upload was packaged
as `logo.png`/`logo.jpg`.
**Fix (v8):** every page references the actual packaged file
(`assets/img/logo.<your-extension>`). To change the logo later, replace that file
(same name) and re-upload.

---

### ❌ Voting page stuck on "Loading polls…"
- Confirm the schema ran (creates `polls`/`poll_votes`).
- You must be **logged in** — polls require a session.
- If a tally doesn't auto-update, just refresh; it still works without realtime.

---

### ❌ Push notifications never appear
- **Install the app** (PWA banner), then on Notifications click **Enable Push** and
  **Allow** in the browser prompt.
- iOS: add to Home Screen first (Safari → Share → Add to Home Screen).

---

### ❌ The in-app preview looks unstyled
Sandboxed previews may block external CSS/fonts. The **hosted/downloaded** site
loads them normally in a real browser.

---

### ❌ GitHub Pages shows a blank page or 404
- Ensure the empty **`.nojekyll`** file is in the repo root.
- Ensure `index.html` is at the **root**, and Pages is set to branch `main`, `/ (root)`.
- For a Modern (Node) build, static hosts should serve the **`public/`** folder.

Still stuck? Contact HMG Concepts — https://hmgconcepts.pages.dev/
