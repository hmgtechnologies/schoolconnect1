# 🔧 Connect Repair v3 — Diagnosis, Fixes & Enhancements (16 issues)

Cumulative build (Repair v3 ⊇ Repair v1 ⊇ … ⊇ source repos). **Nothing removed.**
Free tools, **no AI APIs**. All fixes verified (PostgreSQL 17 + node --check + full generation).

| # | Issue | Fix |
|---|-------|-----|
| 1 | Re-typing already-registered data; time typed | New CRUD field types **`ref`** (dropdown from students/classes/subjects/staff), **`lookup`** (terms/sessions/audiences), **`time`** (time picker). Selecting a student **auto-fills** related fields. No more retyping. |
| 2 | Manual admission/parent IDs | DB triggers **auto-generate** admission numbers (`STD/2026/0001`) on student insert and **member IDs** for parents/staff (`PAR/…`, `STF/…`) when approved. |
| 3 | Weak assistant | Assistant expanded to **29 KB topics + 23 per-page explanations**; **ℹ️ Help** button on every page; explains pages, processes, FAQs; answers "what is this page", "where do dropdowns come from", etc. |
| 4 | Some pages (e.g. results) not generated | `results` (and others) removed from the "dedicated-skip" list so they now generate as full CRUD pages. **80 pages generate.** |
| 5 | Scheme of work weekly tracking | SoW form has a **"Taught this week (confirm)"** checkbox + `confirmed`/`confirmed_at` columns so admins monitor covered vs uncovered topics. |
| 6 | Report card / broadsheet / scoresheet | Report-Cards page now generates printable **Student Report Card**, **Class Broadsheet**, and **Teacher Scoresheet** from recorded scores. |
| 7 | Timetable timing first | **Step 1 · Period & break configuration** sets number of periods, length, start time, short/long breaks (with times) before generation. |
| 8 | "Module has no editable form" | A flexible **`module_records`** table + a **GENERIC** schema give every previously-broken module (messages, inbox, broadcast, reports, calendar, lost&found, PTA, LMS, front desk, finance helpers, etc.) a real Add/Edit/Delete form. |
| 9 | Announcement audience typed | Audience is now a **dropdown** (all/students/parents/staff/a class) from the lookups table. |
| 10 | Birthdays | "🎂 **Import student birthdays**" pulls DOBs from student records; the add form auto-fills DOB when a student is picked. |
| 11 | ID card photo | ID card renders the **student's photo** (Google-Drive links auto-converted to direct image URLs) with an initial-avatar fallback; bulk **Print ALL** added. |
| 12 | Certificate designer | Certificates page now offers **colours, fonts, layout, border, and signature upload**, live preview, print, and **save design templates**. |
| 13 | Admissions & enrollment | Admins **generate a public application link**; prospects fill **`apply.html`** (no account) via a secure RPC; admin reviews and **Accept & Extract** auto-creates the student record. |
| 14 | Analytics coverage | Analytics expanded to **18+ KPIs** (students, staff, CBT, attendance, fees, donations, polls, complaints, admissions, assignments, library, events, announcements, check-ins, leave, visitors, tickets) + charts. |
| 15 | Anonymous CBT | Exam taker has a **"Continue as Guest (anonymous)"** option; blank names auto-assign an anonymous ID. |
| 16 | Logo not showing | Logo packager accepts **any image format** (png/jpg/webp/gif/svg/ico/inline-svg); every page references the exact file; added an **onerror fallback** to the school initial. (Old deployed sites must be regenerated.) |

## New / changed files
- `assets/js/crud.js` — relational/lookup/time fields, generic-module engine, birthday import.
- `assets/js/super.js` — per-page help, Drive photo support on ID cards.
- `assets/js/analytics.js` — expanded KPIs.
- `assets/js/generator.js` — results page fix, timetable period config, report outputs,
  certificate designer, admissions+apply pages, anonymous CBT, ID-card photo/print-all, logo formats.
- `assets/js/templates.js` — ℹ️ Help button, logo onerror fallback, module extra buttons.
- `database/enhancements-schema.sql` — **NEW (6th SQL file)**: settings, lookups, auto-ID
  triggers, timetable_config, certificate_designs, admission_links, module_records, RPCs.

## Deployment (now SIX SQL files, in order — each idempotent)
1. Create a free Supabase project.
2. In the SQL Editor run in order: `schema.sql` → `voting-schema.sql` → `cbt-schema.sql`
   → `reportcard-schema.sql` → `enterprise-schema.sql` → **`enhancements-schema.sql`**.
3. Paste your Project URL + anon key into `assets/js/config.js`.
4. **Static:** host the folder (GitHub Pages / Netlify / Cloudflare / Vercel).
   **Full-stack/SaaS:** `npm install && npm start` (or Docker / render.yaml), set
   `SUPABASE_URL` + `SUPABASE_SERVICE_KEY` env vars.
5. Sign up → promote yourself to admin → approve others from **Approvals**.
6. Generate admission links from **Admissions** and share `apply.html?token=…` with parents.

## Verification
- All 15 builder JS valid; **79 generated pages valid**; 6 SQL files clean + idempotent on
  PostgreSQL 17; admission link→submit→extract and auto-ID triggers tested live;
  `verify.sh` **126/126**. Cumulative: nothing dropped.
