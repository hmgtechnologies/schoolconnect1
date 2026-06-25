# 🔧 Connect Repair v1 — Diagnosis, Fixes & Enhancements

Addresses the six client-reported issues, makes **every page interconnected and
functional**, adds an **approval workflow**, and upgrades the generator to produce a
**hardened full-stack / SaaS** option. All free tools, **no AI APIs**. Build is
**cumulative** — Repair v1 ⊇ Repair ⊇ … ⊇ source repos. **Nothing removed.**

---

## 1–4. 🐞 "Add new" only showed *"Form will be generated for …"* (FIXED)

**Root cause:** module pages (Students, Staff, Classes, Attendance, …) rendered a static,
never-loaded table, and the **Add-new** button called a placeholder that printed
`Form will be generated for "<module>"`. There was **no real CRUD**.

**Fix — a complete generic CRUD engine (`assets/js/crud.js`):**
- A field-schema registry maps **every module to its real Supabase table** with proper,
  typed fields (text/number/date/select/checkbox/email/tel/textarea).
- Each module page now **loads live records** into the table and offers **Add / Edit /
  Delete / Export CSV** with a real validated form.
- `openAddModal()` now opens the real form; `App.loadPageData()` auto-renders the list for
  any module that has a schema. Wired into the page shell, the index/about pages and the
  service-worker cache; bundled into every ZIP.
- Result: **Students, Staff, Classes, Subjects, Attendance, Results, Fees, Library,
  Announcements, Events, Admissions, HR, Hostel, Alumni, Inventory, Diary, Donations, …**
  (40+ modules) are now fully working data screens.

## 5. 📷 QR Check-in by camera (ADDED)

**Before:** check-in only by typing the admission number.
**Now (`checkin.html`):** a **camera scanner** using the device camera (`getUserMedia`) +
the free **jsQR** library decodes the ID-card QR live (with vibration + de-dup), and a
manual-entry panel remains as fallback. Works on phones/tablets/laptops, no hardware, no AI.

## 6. 🖼️ School logo not showing (FIXED + hardened)

**Root cause:** the packager only accepted `png/jpeg/jpg` data-URLs — any other format
(webp/gif/svg/etc.) was **silently discarded** and replaced by a placeholder, and older
builds hard-coded `logo.svg`.
**Fix:** the logo packager now accepts **any image MIME** (png, jpg/jpeg, webp, gif, bmp,
svg+xml, ico) and inline `<svg>` markup, maps it to the correct extension, and **every
page + the manifest + service worker reference the exact packaged file** (`logo.<ext>`).
Verified: a JPG upload packages `logo.jpg` and all pages reference `logo.jpg`.
> Your live `gosa` site is an older build — regenerate it from this build to show the logo.

---

## ✅ Approval workflow (admin approves prospects from the dashboard)

New **Approvals** page (`approvals.html`, admin-only):
- Lists **account-access requests** (people who chose *Request access* on the login page —
  the `handle_new_user` trigger creates them as **pending**). Admin can **set their role**
  and **Approve / Suspend / Delete**.
- Lists **pending admissions applications** and lets admin **Accept / Enroll / Reject**.
- Fully interconnected: *Request access → pending profile → Approvals → approved → can log in.*

## ✅ Interconnection / no brokenness
- Every module page now loads real data and links through the same sidebar, the **Ctrl+K
  command palette**, the **help chatbot**, and notifications — all sharing one Supabase DB.
- All 77 generated pages' inline JS validated; logo, labels and CRUD wired consistently.

## ✅ Full-stack / SaaS / well-secured generation
The **Modern** build type now emits a hardened scaffold:
- `server.js` — Express with **helmet**, **compression**, **rate-limiting**, JSON limits,
  CORS, a **health check**, and an example **service-role** endpoint (the secret key stays
  on the server, never in the browser) + SPA fallback.
- `.env.example`, `Dockerfile`, `.dockerignore`, `render.yaml` for free container/SaaS
  hosting (Render/Railway/Fly.io). Front-end served from `public/`; SQL/docs stay at root.
- Security model unchanged for the static build: Supabase **Row-Level Security** on every
  table, anon key safe to publish, RLS as the gatekeeper.

---

## Verification
- All 15 builder JS valid; 77 generated pages valid; modern `server.js` valid.
- All 5 SQL files clean + idempotent on PostgreSQL 17.
- `verify.sh`: **110/110**. Cumulative: nothing dropped.

## Deployment (unchanged, clear steps)
1. Create a free Supabase project.
2. In the SQL Editor run, in order: `schema.sql` → `voting-schema.sql` → `cbt-schema.sql`
   → `reportcard-schema.sql` → `enterprise-schema.sql` (each idempotent).
3. Paste your **Project URL + anon key** into `assets/js/config.js`.
4. **Static:** host the folder on GitHub Pages / Netlify / Cloudflare / Vercel.
   **Full-stack:** `npm install` then `npm start` (or deploy the Docker image / `render.yaml`),
   and set `SUPABASE_URL` + `SUPABASE_SERVICE_KEY` env vars.
5. Sign up → promote yourself to admin (SQL in the guide) → approve others from **Approvals**.
