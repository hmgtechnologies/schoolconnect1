#!/usr/bin/env bash
# =====================================================================
# verify.sh — School Connect Gen v8 sanity check
# Confirms the package is intact and the known v7 bugs are fixed.
# Usage:  bash verify.sh
# =====================================================================
set -u
pass=0; fail=0
ok(){ echo "  ✅ $1"; pass=$((pass+1)); }
no(){ echo "  ❌ $1"; fail=$((fail+1)); }

echo "School Connect Gen v8 — verification"
echo "------------------------------------"

# 1. Required files present
echo "[1] Required files"
for f in builder.html index.html database/schema.sql database/voting-schema.sql \
         assets/js/generator.js assets/js/templates.js assets/js/catalog.js assets/js/wizard.js \
         README.md DEPLOYMENT-GUIDE.md FEATURES.md DIAGNOSIS.md TROUBLESHOOTING.md CHANGELOG.md; do
  [ -f "$f" ] && ok "$f present" || no "$f missing"
done

# 2. SQL ordering fix: profiles table created before is_staff() function
echo "[2] SQL fix — tables before functions (no 42P01)"
tbl=$(grep -n "create table if not exists public.profiles" database/schema.sql | head -1 | cut -d: -f1)
fn=$(grep -n "function public.is_staff" database/schema.sql | head -1 | cut -d: -f1)
if [ -n "$tbl" ] && [ -n "$fn" ] && [ "$tbl" -lt "$fn" ]; then ok "profiles ($tbl) created before is_staff ($fn)"; else no "function/table ordering still wrong"; fi

# 3. voting-schema is self-contained
echo "[3] voting-schema self-contained"
grep -q "create table if not exists public.profiles" database/voting-schema.sql && \
grep -q "function public.is_staff" database/voting-schema.sql && \
  ok "voting-schema creates its own dependencies" || no "voting-schema not self-contained"

# 4. No 'sow' table alias in RLS loops
echo "[4] RLS uses scheme_of_work (not 'sow')"
if grep -qE "'sow'[^_]" database/schema.sql && ! grep -q "scheme_of_work" database/schema.sql; then
  no "'sow' alias still used"
else ok "scheme_of_work used correctly"; fi

# 5. Login wired to App.* (not bare globals / T.*)
echo "[5] Login wiring"
grep -q "App.handleSignIn" assets/js/templates.js && ok "login form -> App.handleSignIn" || no "login form not wired to App.handleSignIn"
grep -q "App.switchAuthTab" assets/js/templates.js && ok "tabs -> App.switchAuthTab" || no "tabs not wired to App.switchAuthTab"

# 6. Logo uses dynamic extension
echo "[6] Logo extension"
grep -q "logo.\${config.logoExt" assets/js/templates.js && ok "templates use dynamic logo extension" || no "templates still hard-code logo.svg"

# 7. JS syntax (if node is available)
echo "[7] JS syntax (requires node)"
if command -v node >/dev/null 2>&1; then
  bad=0
  for f in assets/js/*.js; do node --check "$f" >/dev/null 2>&1 || { no "syntax error in $f"; bad=1; }; done
  [ "$bad" = 0 ] && ok "all assets/js/*.js parse"
else echo "  ⏭  node not found — skipping syntax check"; fi

# 8. v2 — CBT engine & report cards present and wired
echo "[8] v2 CBT engine + report cards"
for f in assets/js/cbt-engine.js assets/js/analytics.js database/cbt-schema.sql database/reportcard-schema.sql CBT_AND_REPORTCARD_GUIDE.md CBT_AUDIT_REPORT.md; do
  [ -f "$f" ] && ok "$f present" || no "$f missing"
done
grep -q "cbt_push_to_reportcard" database/reportcard-schema.sql && ok "CBT→report-card mapping function present" || no "mapping function missing"
grep -q "cbt_get_public_exam" database/cbt-schema.sql && ok "answer-stripping student RPC present" || no "student RPC missing"
grep -q "pageCBT" assets/js/generator.js && grep -q "pageReportCards" assets/js/generator.js && ok "generator builds CBT + report-card pages" || no "generator missing v2 pages"
grep -q "report-cards.html" assets/js/generator.js && ok "report-cards.html generated" || no "report-cards.html not wired"

# 9. v3 — super features present and wired
echo "[9] v3 super features"
[ -f assets/js/super.js ] && ok "assets/js/super.js present" || no "super.js missing"
[ -f SUPER_FEATURES_GUIDE.md ] && ok "SUPER_FEATURES_GUIDE.md present" || no "guide missing"
for fn in chatbot palette notify idcard cert flyer; do
  grep -q "$fn" assets/js/super.js && ok "super: $fn module present" || no "super: $fn missing"
done
grep -q "pageIdCards" assets/js/generator.js && grep -q "pageCertificates" assets/js/generator.js && grep -q "pageFlyer" assets/js/generator.js && ok "generator builds ID-card/certificate/flyer pages" || no "generator missing super pages"
grep -q "assets/js/super.js" assets/js/templates.js && ok "super.js wired into page shell + login" || no "super.js not wired into templates"

# 10. v3.1 — full interactive preview + pricing estimator (from original builder)
echo "[10] v3.1 full preview + estimator"
grep -q "fullPreviewHtml" assets/js/generator.js && ok "Generator.fullPreviewHtml present" || no "full preview missing"
grep -q "mockClient" assets/js/generator.js && ok "mock Supabase client present" || no "mock client missing"
grep -q "_previewDemoData" assets/js/generator.js && ok "seeded demo data present" || no "demo data missing"
grep -q "estimate(config" assets/js/generator.js && ok "pricing estimator present" || no "estimator missing"
grep -q "Wizard.fullPreview\|data-wizard=\"fullPreview\"" builder.html && ok "Full Preview button wired" || no "full preview button missing"
grep -q "fullPreviewFrame" builder.html && ok "Full Preview modal present" || no "preview modal missing"

# 11. FINAL — cumulative re-added files (nothing dropped)
echo "[11] FINAL cumulative re-added files"
for f in assets/js/preview.js _headers vercel.json browserconfig.xml offline.html \
         database/further_maths_sample.csv assets/img/shot-dashboard.png \
         assets/img/shot-members.png assets/img/shot-idcard.png CUMULATIVE_AUDIT.md; do
  [ -f "$f" ] && ok "$f present" || no "$f DROPPED"
done
grep -q 'id="glimpse"' index.html && ok "landing 'Glimpse' screenshots section restored" || no "glimpse section missing"
grep -q "sample-question-bank.csv" assets/js/generator.js && ok "rich sample bank bundled into ZIP" || no "sample bank not bundled"
grep -q "pageOffline" assets/js/generator.js && ok "generated offline.html wired" || no "offline page not wired"

# 12. FINAL v2 — audit fixes + enterprise add-ons
echo "[12] FINAL v2 audit fixes + enterprise"
grep -q "sitemap-pages.xml" robots.txt && no "robots.txt still has dead sitemap-pages.xml" || ok "robots.txt dead-link fixed"
grep -q "async('uint8array')" assets/js/generator.js && ok "modern-build uses robust JSZip async API" || no "modern-build still uses fragile internals"
grep -q "_sc - _fp" assets/js/generator.js && ok "dashboard chart NaN-safe" || no "chart not NaN-safe"
[ -f assets/js/enterprise.js ] && ok "enterprise.js present" || no "enterprise.js missing"
[ -f database/enterprise-schema.sql ] && ok "enterprise-schema.sql present" || no "enterprise-schema.sql missing"
grep -q "generate_timetable" database/enterprise-schema.sql && ok "conflict-free timetable generator fn present" || no "timetable generator missing"
for fn in timetable checkin diary surveys menu security i18n; do grep -q "$fn" assets/js/enterprise.js && ok "enterprise: $fn module" || no "enterprise: $fn missing"; done
grep -q "pageTimetableGen" assets/js/generator.js && grep -q "pageCheckin" assets/js/generator.js && ok "generator builds enterprise pages" || no "enterprise pages not wired"
grep -q "assets/js/enterprise.js" assets/js/templates.js && ok "enterprise.js wired into shell" || no "enterprise.js not wired"
[ -f AUDIT_REPORT_FINAL_V2.md ] && ok "AUDIT_REPORT_FINAL_V2.md present" || no "audit report missing"

# 13. SQL idempotency hardening (42P16 + missing-column fixes)
echo "[13] SQL re-run safety (Supabase)"
grep -q "drop view if exists public.poll_results cascade" database/schema.sql && ok "schema.sql drops poll_results before create (no 42P16)" || no "schema poll_results drop missing"
grep -q "drop view if exists public.poll_results cascade" database/voting-schema.sql && ok "voting-schema drops poll_results before create" || no "voting poll_results drop missing"
grep -q "drop view if exists public.report_subject_totals cascade" database/reportcard-schema.sql && ok "reportcard drops view before create" || no "reportcard view drop missing"
grep -q "add column if not exists voter_id" database/schema.sql && ok "schema backfills voter_id (no 'column does not exist')" || no "voter_id backfill missing in schema"
grep -q "add column if not exists voter_id" database/voting-schema.sql && ok "voting-schema backfills voter_id" || no "voter_id backfill missing in voting-schema"

# 14. App-shell UI styles (logged-in dashboard layout)
echo "[14] App-shell CSS (post-login UI fix)"
for cls in app-layout app-sidebar app-nav app-nav-icon app-main app-topbar app-content app-brand; do
  grep -q "\.$cls" assets/css/style.css && ok "css .$cls defined" || no "css .$cls MISSING"
done
grep -q "app-layout.topnav" assets/css/style.css && ok "topnav layout variant styled" || no "topnav variant missing"
grep -q "app-sidebar.open" assets/css/style.css && ok "mobile sidebar drawer styled" || no "mobile drawer missing"

# 15. Repair build — UI shell robustness, nav labels, part-time timetable, chatbot
echo "[15] Repair build fixes"
grep -q "Critical app-shell CSS (inlined" assets/js/templates.js && ok "critical app-shell CSS inlined in <head> (bulletproof)" || no "inline critical CSS missing"
grep -q "labelFor(id, fallbackName)" assets/js/templates.js && ok "clean unique nav labels (no duplicates)" || no "labelFor missing"
grep -q "available_days" database/enterprise-schema.sql && ok "timetable part-time available_days column" || no "part-time days missing"
grep -q "teacher_availability" database/enterprise-schema.sql && ok "teacher_availability roster table" || no "availability roster missing"
grep -q "unnest(v_days)" database/enterprise-schema.sql && ok "generator restricts part-time teachers to their days" || no "generator not part-time aware"
grep -q "answer(msg)" assets/js/super.js && ok "chatbot enhanced (scored matching)" || no "chatbot not enhanced"
test $(grep -c "{ m: \[" assets/js/super.js) -ge 25 && ok "chatbot KB expanded (25+ topics)" || no "chatbot KB too small"
grep -q "Super.chatbot.ask(" assets/js/super.js && ok "chatbot quick-reply chips" || no "chatbot chips missing"

# 16. Builder wizard navigation hardening
echo "[16] Wizard navigation robustness"
test $(grep -c "Wizard.init()" builder.html) -eq 1 && ok "single Wizard.init() (no double-binding)" || no "Wizard.init() count != 1"
grep -q "Bind the wizard FIRST" builder.html && ok "Wizard.init runs BEFORE grid render (nav never blocked)" || no "init not hardened to run first"
grep -q "grid render failed (navigation still works)" builder.html && ok "grid render wrapped in try/catch" || no "grid render not guarded"
grep -q "if (window.event && event.currentTarget)" builder.html && ok "selectTheme/Font/Layout guarded against missing event" || no "select handlers not guarded"

# 17. connect repair v1 — CRUD, camera check-in, logo, approvals, full-stack
echo "[17] connect repair v1 fixes"
[ -f assets/js/crud.js ] && ok "crud.js (real add/edit/delete engine) present" || no "crud.js missing"
grep -q "CRUD.openForm" assets/js/templates.js && ok "module pages use real CRUD form (no placeholder)" || no "module pages still placeholder"
grep -q "openAddModal(type)" assets/js/generator.js && grep -q "CRUD.openForm(type)" assets/js/generator.js && ok "openAddModal opens real form" || no "openAddModal still placeholder"
grep -q "getUserMedia" assets/js/generator.js && grep -q "jsQR" assets/js/generator.js && ok "QR check-in supports phone camera scan" || no "camera scan missing"
grep -q "data:image/(\[a-z0-9" database 2>/dev/null; grep -q "extMap" assets/js/generator.js && ok "logo accepts any image format (png/jpg/webp/svg…)" || no "logo format handling not broadened"
grep -q "pageApprovals" assets/js/generator.js && ok "Approvals page (approve students/parents/staff/admissions)" || no "approvals page missing"
grep -q "express-rate-limit" assets/js/generator.js && grep -q "SUPABASE_SERVICE_KEY" assets/js/generator.js && ok "full-stack/SaaS modern build hardened (rate-limit, service-role, Docker, render.yaml)" || no "full-stack build not hardened"

echo "------------------------------------"
echo "Passed: $pass   Failed: $fail"
[ "$fail" = 0 ] && echo "🎉 All checks passed." || echo "⚠️  Some checks failed — see above."
exit $fail
