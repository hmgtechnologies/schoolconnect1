/* ====================================================================
   templates.js — School Connect Gen v8
   Page template generators for the school sites produced by the wizard.
   Each generator returns a string of HTML.
   Fixes D-06 (every onclick now has a matching handler),
         D-07 (purpose-built forms per type),
         D-12 (currentSession auto),
         D-13 (all modules in nav),
         D-17 (role-based UI gating),
         D-18 (mobile drawer),
         D-19 (notifications bell),
         D-20 (dark mode).
   ==================================================================== */

const T = {

  /* Shared head & layout */
  head(config, title) {
    const fontLink = (config.font && config.font !== 'system' && config.font.css)
      ? `<link href="https://fonts.googleapis.com/css2?family=${encodeURIComponent(config.font.css)}&display=swap" rel="stylesheet">`
      : '';
    const theme = (window.SC.THEMES.find(t => t.id === config.themeId) || window.SC.THEMES[0]);
    const logoExt = config.logoExt || 'svg';
    const iconType = logoExt === 'svg' ? 'image/svg+xml' : 'image/' + (logoExt === 'jpg' ? 'jpeg' : logoExt);
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${T.esc(title)} • ${T.esc(config.schoolName)}</title>
<meta name="description" content="${T.esc(config.schoolName || 'School')} — ${T.esc(title)}. Free school management platform by HMG Concepts.">
<meta name="keywords" content="${T.esc(config.schoolName || 'School')}, school management, ${T.esc(config.shortName || '')}, HMG Concepts">
<meta name="theme-color" content="${theme.primary}">
<link rel="icon" type="${iconType}" href="assets/img/logo.${logoExt}">
<link rel="manifest" href="manifest.json">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
${fontLink}
<meta property="og:title" content="${T.esc(title)} • ${T.esc(config.schoolName)}">
<meta property="og:description" content="${T.esc(config.schoolName)} — Free school management by HMG Concepts">
<meta property="og:image" content="assets/img/og-cover.svg">
<meta property="og:type" content="website">
<meta name="twitter:card" content="summary_large_image">
<link rel="stylesheet" href="assets/css/style.css">
<style>
/* === Critical app-shell CSS (inlined as a safety net) ===
   Guarantees the logged-in dashboard layout renders correctly even if the
   external stylesheet is cached/blocked/fails to load. Mirrors style.css. */
:root{--sc-primary:${theme.primary};--sc-accent:${theme.accent}}
.app-layout{display:flex;min-height:100vh;background:#f8fafc}
.app-sidebar{width:250px;flex-shrink:0;background:#fff;border-right:1px solid #e2e8f0;display:flex;flex-direction:column;position:sticky;top:0;height:100vh;overflow-y:auto;z-index:40}
.app-brand{display:flex;align-items:center;gap:12px;padding:18px;border-bottom:1px solid #e2e8f0}
.app-brand img{width:40px;height:40px;border-radius:10px;object-fit:contain;flex-shrink:0;background:#f8fafc}
.app-brand strong{display:block;font-size:.95rem;font-weight:800;color:#0f172a;line-height:1.2}
.app-nav{display:flex;flex-direction:column;gap:2px;padding:12px 10px;flex:1}
.app-nav a{display:flex;align-items:center;gap:12px;padding:10px 14px;border-radius:10px;color:#475569;text-decoration:none;font-size:.9rem;font-weight:600;line-height:1;white-space:nowrap}
.app-nav a:hover{background:#f1f5f9;color:${theme.primary}}
.app-nav a.active{background:${theme.primary};color:#fff}
.app-nav-icon{width:24px;min-width:24px;height:24px;display:inline-flex;align-items:center;justify-content:center;font-size:1.05rem;flex-shrink:0}
.app-main{flex:1;min-width:0;display:flex;flex-direction:column}
.app-topbar{display:flex;align-items:center;gap:14px;padding:14px 24px;background:#fff;border-bottom:1px solid #e2e8f0;position:sticky;top:0;z-index:30}
.app-page-title{font-size:1.25rem;font-weight:800;color:#0f172a;margin:0}
.app-content{padding:24px;flex:1;max-width:1280px;width:100%}
.app-layout.topnav{flex-direction:column}
.app-layout.topnav .app-sidebar{width:100%;height:auto;flex-direction:row;align-items:center;overflow-x:auto;overflow-y:hidden;border-right:none;border-bottom:1px solid #e2e8f0}
.app-layout.topnav .app-nav{flex-direction:row;flex:1;padding:8px;gap:4px}
.app-layout.topnav .app-nav a{flex-direction:column;gap:4px;font-size:.7rem;padding:8px 12px;text-align:center}
@media(max-width:900px){.app-sidebar{position:fixed;left:0;top:0;bottom:0;transform:translateX(-100%);transition:transform .25s ease;box-shadow:0 20px 25px -5px rgba(0,0,0,.2)}.app-sidebar.open{transform:translateX(0)}.app-layout.topnav .app-sidebar{position:sticky;transform:none}.app-content{padding:16px}.app-topbar .mobile-toggle{display:inline-flex;align-items:center;justify-content:center;background:#f1f5f9;border:1px solid #e2e8f0;border-radius:8px;width:40px;height:40px;font-size:1.2rem;cursor:pointer}}
@media(min-width:901px){.app-topbar .mobile-toggle{display:none}}
</style>
</head>
<body data-theme="${T.esc(config.themeId)}" data-school="${T.esc(config.schoolName)}" data-font="${T.esc(config.fontId || 'inter')}">`;
  },

  /* Top notification bell + install banner (always shown) */
  bellAndBanner(config) {
    const logoExt = (config && config.logoExt) || 'svg';
    return `
<div id="notif-bell" class="notif-bell" title="Notifications" data-chatbot>
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
  <span id="notif-badge" class="notif-badge" style="display:none">0</span>
  <div id="notif-dropdown" class="notif-dropdown">
    <div style="padding:16px 20px;border-bottom:1px solid var(--gray-200);display:flex;justify-content:space-between;align-items:center">
      <strong style="color:var(--dark)">Notifications</strong>
      <button class="btn btn-sm btn-outline" onclick="Notifications.markAllRead()">Mark all read</button>
    </div>
    <div id="notif-list"><div class="toast-msg" style="padding:24px;text-align:center">Loading…</div></div>
  </div>
</div>

<div id="pwa-install-banner" class="pwa-install">
  <div class="pwa-install-header">
    <img src="assets/img/logo.${logoExt}" alt="" class="pwa-install-icon">
    <div style="flex:1">
      <div class="pwa-install-title">📲 Install School Connect</div>
      <div class="pwa-install-msg">Get push notifications for messages, broadcasts, polls and result slips — even when the app is closed.</div>
    </div>
    <button class="modal-close" data-pwa-action="dismiss" title="Dismiss">×</button>
  </div>
  <div class="pwa-install-actions">
    <button class="btn btn-outline btn-sm" data-pwa-action="never">Not now</button>
    <button class="btn btn-primary btn-sm" data-pwa-action="install">Install App</button>
  </div>
</div>

<div id="toast-container" class="toast-container"></div>`;
  },

  /* Modal markup */
  modal() {
    return `<div id="modal-backdrop" class="modal-backdrop" onclick="if(event.target===this)closeModal()">
  <div class="modal" onclick="event.stopPropagation()">
    <div class="modal-header">
      <h2 id="modal-title">Modal</h2>
      <button class="modal-close" onclick="closeModal()">×</button>
    </div>
    <div id="modal-body" class="modal-body"></div>
    <div id="modal-footer" class="modal-footer"></div>
  </div>
</div>`;
  },

  /* Login page */
  loginPage(config) {
    const theme = window.SC.THEMES.find(t => t.id === config.themeId) || window.SC.THEMES[0];
    return `${T.head(config, 'Sign in')}
${T.bellAndBanner(config)}
${T.modal()}
<div class="login-shell" style="min-height:100vh;background:var(--gradient);display:flex;align-items:center;justify-content:center;padding:40px 20px">
  <div class="login-card" style="background:white;padding:40px;border-radius:24px;box-shadow:var(--shadow-xl);max-width:440px;width:100%">
    <div style="text-align:center;margin-bottom:32px">
      <img src="assets/img/logo.${config.logoExt || 'svg'}" alt="${T.esc(config.schoolName)} logo" style="width:64px;height:64px;margin:0 auto 16px;border-radius:14px;object-fit:contain">
      <h1 style="font-size:1.8rem;font-weight:900;color:var(--dark);margin-bottom:4px">${T.esc(config.schoolName)}</h1>
      <p style="color:var(--gray-600);font-size:0.95rem">${T.esc(config.schoolMotto || 'School Management Portal')}</p>
    </div>
    <div id="auth-tabs" style="display:flex;gap:8px;background:var(--gray-100);padding:4px;border-radius:12px;margin-bottom:24px">
      <button class="btn btn-primary" id="tab-signin" onclick="App.switchAuthTab('signin')" style="flex:1">Sign in</button>
      <button class="btn btn-outline" id="tab-signup" onclick="App.switchAuthTab('signup')" style="flex:1">Request access</button>
    </div>
    <form id="signin-form" onsubmit="App.handleSignIn(event)" class="form">
      <div class="form-group"><label>Email</label><input class="form-input" type="email" name="email" required></div>
      <div class="form-group"><label>Password</label><input class="form-input" type="password" name="password" required minlength="8"></div>
      <button type="submit" class="btn btn-primary" style="width:100%">Sign in</button>
    </form>
    <form id="signup-form" onsubmit="App.handleSignUp(event)" class="form" style="display:none">
      <div class="form-group"><label>Full name</label><input class="form-input" name="full_name" required></div>
      <div class="form-group"><label>Email</label><input class="form-input" type="email" name="email" required></div>
      <div class="form-group"><label>Phone</label><input class="form-input" name="phone"></div>
      <div class="form-group"><label>Password (min 8 chars)</label><input class="form-input" type="password" name="password" required minlength="8"></div>
      <div class="form-group"><label>Role</label>
        <select class="form-select" name="role">
          <option value="parent">Parent</option>
          <option value="student">Student</option>
          <option value="staff">Staff</option>
          <option value="admin">Admin</option>
        </select>
      </div>
      <button type="submit" class="btn btn-primary" style="width:100%">Request access</button>
      <p style="margin-top:12px;font-size:0.82rem;color:var(--gray-500);text-align:center">Your account will be reviewed by the school admin before sign-in is enabled.</p>
    </form>
    <p style="margin-top:24px;text-align:center;font-size:0.78rem;color:var(--gray-400)">
      Powered by <a href="${T.esc(config.hmgLink || 'https://hmgconcepts.pages.dev/')}" target="_blank" rel="noopener" style="color:var(--primary);font-weight:600">HMG Concepts</a>
    </p>
  </div>
</div>
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="assets/js/config.js"></script>
<script src="assets/js/notifications.js"></script>
<script src="assets/js/pwa-install.js"></script>
<script src="assets/js/super.js"></script>
<script src="assets/js/enterprise.js"></script>
<script src="assets/js/crud.js"></script>
<script src="assets/js/app.js"></script>
<script>
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js');
  if (window.PWAInstall) PWAInstall.init();
  if (window.Super) Super.init(sb, window.SCHOOL);
  if (window.Enterprise) Enterprise.init(sb);
  if (window.CRUD) CRUD.init(sb);
  // App.init() (in app.js) already shows the Sign-in tab on public pages.
</script>
</body></html>`;
  },

  /* Builder-preview-only tab switcher. The GENERATED site uses App.switchAuthTab
     (in app.js) because templates.js is never shipped to the school site. */
  switchAuthTab(tab) {
    const s = document.getElementById('signin-form'); const u = document.getElementById('signup-form');
    const ts = document.getElementById('tab-signin'); const tu = document.getElementById('tab-signup');
    if (!s || !u) return;
    if (tab === 'signin') { s.style.display='block'; u.style.display='none'; if(ts)ts.className='btn btn-primary'; if(tu)tu.className='btn btn-outline'; }
    else                  { s.style.display='none';  u.style.display='block'; if(tu)tu.className='btn btn-primary'; if(ts)ts.className='btn btn-outline'; }
  },

  /* Standard page shell */
  shell(config, page, content, opts = {}) {
    const theme = window.SC.THEMES.find(t => t.id === config.themeId) || window.SC.THEMES[0];
    const navItems = T.allModules(config).map(m => ({ id: m.id, label: T.labelFor(m.id, m.name), href: m.id + '.html', icon: T.iconFor(m.id) }));
    const isLogin = opts.noShell;
    if (isLogin) return content;
    const layout = config.layout || 'sidebar';
    const roleAttr = opts.requireRole ? `data-require-role="${T.esc(opts.requireRole)}"` : '';
    return `${T.head(config, page)}
${T.bellAndBanner(config)}
${T.modal()}
<div class="app-layout ${T.esc(layout)}" ${roleAttr}>
  ${T.renderNav(config, navItems, page)}
  <main class="app-main">
    <header class="app-topbar">
      <button class="mobile-toggle" onclick="App.toggleSidebar()" title="Menu">☰</button>
      <h1 class="app-page-title">${T.esc(page)}</h1>
      <div style="margin-left:auto;display:flex;align-items:center;gap:12px">
        ${config.campuses && config.campuses.length > 1 ? T.campusSwitcher(config) : ''}
        <button class="btn btn-sm btn-outline" onclick="App.toggleDarkMode()" title="Toggle theme">🌙</button>
        <button class="btn btn-sm btn-outline" onclick="App.signOut()" data-signout style="display:none">Sign out</button>
      </div>
    </header>
    <div class="app-content">
      ${content}
    </div>
    <footer style="padding:20px 28px;border-top:1px solid var(--gray-200);font-size:0.82rem;color:var(--gray-500);text-align:center">
      © ${new Date().getFullYear()} ${T.esc(config.schoolName)} · Powered by <a href="${T.esc(config.hmgLink || 'https://hmgconcepts.pages.dev/')}" target="_blank" rel="noopener">HMG Concepts</a>
    </footer>
  </main>
</div>
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script src="assets/js/config.js"></script>
<script src="assets/js/notifications.js"></script>
<script src="assets/js/voting.js"></script>
<script src="assets/js/pwa-install.js"></script>
<script src="assets/js/super.js"></script>
<script src="assets/js/enterprise.js"></script>
<script src="assets/js/crud.js"></script>
<script src="assets/js/app.js"></script>
<script>
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').then(reg => { Notifications.init(sb, reg); Voting.init(sb); });
  else { Notifications.init(sb); Voting.init(sb); }
  PWAInstall.init();
  if (window.Super) Super.init(sb, window.SCHOOL);
  if (window.Enterprise) Enterprise.init(sb);
  if (window.CRUD) CRUD.init(sb);
</script>
</body></html>`;
  },

  /* Campus switcher dropdown */
  campusSwitcher(config) {
    return `<select class="form-select" style="padding:6px 12px;font-size:0.85rem" onchange="App.switchCampus(this.value)">
      ${config.campuses.map(c => `<option value="${T.esc(c)}">${T.esc(c)}</option>`).join('')}
    </select>`;
  },

  /* Sidebar nav */
  renderNav(config, items, current) {
    return `<aside class="app-sidebar" id="app-sidebar">
      <div class="app-brand">
        <img src="assets/img/logo.${config.logoExt || 'svg'}" alt="${T.esc(config.schoolName)} logo" style="object-fit:contain">
        <div>
          <strong>${T.esc(config.schoolName)}</strong>
          <div style="font-size:0.7rem;color:var(--gray-500)">${T.esc(config.shortName || '')}</div>
        </div>
      </div>
      <nav class="app-nav">
        ${items.map(i => `<a href="${T.esc(i.href)}" class="${i.href === (current || '').toLowerCase() + '.html' ? 'active' : ''}">
          <span class="app-nav-icon">${i.icon}</span>
          <span>${T.esc(i.label)}</span>
        </a>`).join('')}
      </nav>
      <div style="margin-top:auto;padding:16px;border-top:1px solid var(--gray-200);font-size:0.78rem;color:var(--gray-500)">
        Powered by <a href="${T.esc(config.hmgLink || 'https://hmgconcepts.pages.dev/')}" target="_blank" rel="noopener">HMG Concepts</a>
      </div>
    </aside>`;
  },

  iconFor(id) {
    const map = {
      dashboard:'🏠', students:'👨‍🎓', staff:'👨‍🏫', classes:'📚', attendance:'📋', results:'📊',
      timetable:'🗓️', sow:'📋', cbt:'💻', assignments:'📝', library:'📖', conduct:'⚖️', health:'🩺',
      promotion:'🎓', fees:'💰', finance:'💵', leave:'🏖️', visitors:'🚪', transport:'🚌',
      announcements:'📢', events:'🎭', messages:'📱', inbox:'💬', complaints:'📨', broadcast:'📨',
      voting:'🗳️', gallery:'🖼️', eresources:'📁', birthdays:'🎂', idcards:'🪪', reports:'📈',
      directory:'🔍', departments:'🏢', parents:'👨‍👩‍👧', admissions:'📝', hr:'💼', hostel:'🛏️',
      alumni:'🤝', inventory:'📦', certificates:'📜', analytics:'📊',
      school_calendar:'📅', lost_found:'🔍', parent_meeting:'👥', book_request:'📖',
      lms:'🎓', gamification:'🏅', cafeteria:'🍽️', financial_aid:'🎗️', front_desk:'🛎️',
      career_counseling:'🧭', document_builder:'🧾', fleet_tracking:'🛰️', facility_booking:'🏟️', compliance:'✅',
      activity_log:'🧮', lesson_plans:'🗒️', behaviour:'🏅', support_plans:'🧩',
      donations:'💝', substitutions:'🔁', helpdesk:'🆘', payments_online:'💳',
      'report-cards':'🧾', 'admin-data':'🗄️', flyer:'📰', approvals:'✅', 'timetable-generator':'🗓️', checkin:'📲', diary:'📔', surveys:'🗒️', menu:'🍽️', settings:'⚙️'
    };
    return map[id] || '◦';
  },

  /* Clean, UNIQUE short nav labels (fixes duplicate "Results/Timetable/School"
     collisions caused by name.split(' ')[0]). Falls back to the module name. */
  labelFor(id, fallbackName) {
    const map = {
      dashboard:'Dashboard', students:'Students', staff:'Staff', classes:'Classes',
      attendance:'Attendance', results:'Results', timetable:'Timetable',
      'timetable-generator':'Auto-Timetable', sow:'Scheme', cbt:'CBT', assignments:'Assignments',
      library:'Library', conduct:'Conduct', health:'Health', promotion:'Promotion',
      fees:'Fees', finance:'Finance', leave:'Leave', visitors:'Visitors', transport:'Transport',
      announcements:'Announcements', events:'Events', messages:'Messaging', inbox:'Inbox',
      complaints:'Complaints', broadcast:'Result Broadcast', voting:'Voting', gallery:'Gallery',
      eresources:'E-Resources', birthdays:'Birthdays', idcards:'ID Cards', reports:'Reports',
      directory:'Directory', departments:'Departments', parents:'Parent–Child', admissions:'Admissions',
      hr:'HR & Payroll', hostel:'Hostel', alumni:'Alumni', inventory:'Inventory',
      certificates:'Certificates', analytics:'Analytics', school_calendar:'Calendar',
      lost_found:'Lost & Found', parent_meeting:'PTA Meeting', book_request:'Book Request',
      lms:'LMS', gamification:'Gamification', cafeteria:'Cafeteria', financial_aid:'Financial Aid',
      front_desk:'Front Desk', career_counseling:'Career', document_builder:'Documents',
      fleet_tracking:'Fleet', facility_booking:'Facilities', compliance:'Compliance',
      activity_log:'Activity Log', lesson_plans:'Lesson Plans', behaviour:'Behaviour',
      support_plans:'Support Plans', donations:'Donations', substitutions:'Substitutions',
      helpdesk:'Help Desk', payments_online:'Online Pay', 'report-cards':'Report Cards',
      'admin-data':'Admin Data', approvals:'Approvals', flyer:'Flyer', checkin:'QR Check-in', diary:'Diary',
      surveys:'Surveys', menu:'Menu'
    };
    return map[id] || fallbackName || id;
  },

  /* Get list of all modules for this school */
  allModules(config) {
    const dashboard = { id: 'dashboard', name: 'Dashboard' };
    const ids = (config.modules || []);
    return [dashboard].concat(ids.map(id => window.SC.MODULES.find(m => m.id === id) || { id, name: id }));
  },

  /* ---------- Dashboard ---------- */
  dashboard(config) {
    return T.shell(config, 'Dashboard', `
      <div class="stats-grid">
        <div class="stat-card"><div class="stat-value" id="stat-students">—</div><div class="stat-label">Students</div></div>
        <div class="stat-card"><div class="stat-value" id="stat-staff">—</div><div class="stat-label">Staff</div></div>
        <div class="stat-card"><div class="stat-value" id="stat-fees">—</div><div class="stat-label">Fees Paid</div></div>
        <div class="stat-card"><div class="stat-value" id="stat-announcements">—</div><div class="stat-label">Notices</div></div>
      </div>
      <div class="grid grid-2">
        <div class="card"><h3>📢 Latest Announcements</h3><div id="dash-announcements" style="margin-top:12px"><span class="pulse">Loading…</span></div></div>
        <div class="card"><h3>🗳️ Active Polls</h3><div id="dash-polls" style="margin-top:12px"><span class="pulse">Loading…</span></div><a href="voting.html" class="btn btn-outline btn-sm" style="margin-top:12px">All polls →</a></div>
        <div class="card"><h3>🎂 Birthdays Today</h3><div id="dash-birthdays" style="margin-top:12px"><span class="pulse">Loading…</span></div></div>
        <div class="card"><h3>📊 Quick Analytics</h3><canvas id="dash-chart" style="margin-top:12px;max-height:240px"></canvas></div>
      </div>`);
  },

  /* ---------- Voting page (NEW blueprint feature) ---------- */
  voting(config) {
    return T.shell(config, 'Voting & Polls', `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px">
        <p style="color:var(--gray-600);margin:0">Cast your vote in class elections, head-boy/girl contests and staff polls. Live results update in real time.</p>
        <button class="btn btn-primary" data-vote-action="create" data-admin-only>+ New Poll</button>
      </div>
      <div id="polls-list"><span class="pulse">Loading polls…</span></div>`, { requireRole: 'any' });
  },

  /* ---------- Notifications page (NEW) ---------- */
  notifications(config) {
    return T.shell(config, 'Notifications', `
      <p style="color:var(--gray-600)">All your announcements, broadcasts, poll results and message alerts — in one place.</p>
      <div style="display:flex;gap:12px;margin:16px 0;flex-wrap:wrap">
        <button class="btn btn-primary" onclick="Notifications.requestPermission()">🔔 Enable Push</button>
        <button class="btn btn-outline" onclick="Notifications.refreshUnreadCount()">↻ Refresh</button>
        <button class="btn btn-outline" onclick="Notifications.markAllRead()">Mark all read</button>
      </div>
      <div id="notif-page-list"><span class="pulse">Loading…</span></div>`, { requireRole: 'any' });
  },

  /* ---------- Generic module page (students / staff / fees / …) ---------- */
  modulePage(config, moduleId, opts = {}) {
    const mod = window.SC.MODULES.find(m => m.id === moduleId) || { id: moduleId, name: moduleId };
    return T.shell(config, mod.name, `
      <p style="color:var(--gray-600);margin-bottom:18px">${T.esc(mod.desc || '')}</p>
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:16px">
        <button class="btn btn-primary" onclick="CRUD.openForm('${T.esc(moduleId)}')" data-staff-only>+ Add new</button>
        <button class="btn btn-outline" onclick="CRUD.renderList('${T.esc(moduleId)}')">↻ Refresh</button>
        <button class="btn btn-outline" onclick="CRUD.exportCSV('${T.esc(moduleId)}')" data-staff-only>⬇ Export CSV</button>
      </div>
      <div class="table-wrap"><table id="${T.esc(moduleId)}-table"><thead><tr><th>Loading…</th></tr></thead><tbody><tr><td><span class="pulse">Loading…</span></td></tr></tbody></table></div>
      <script>document.addEventListener('DOMContentLoaded',function(){ if(window.CRUD) CRUD.renderList('${T.esc(moduleId)}'); });</script>`,
      { requireRole: opts.requireRole || 'staff' });
  },

  /* ---------- Helpers ---------- */
  esc(s) { return window.SC.esc(s); },
  jsStr(s) { return window.SC.jsStr(s); },
  slugify(s) { return window.SC.slugify(s); }
};

window.T = T;

console.log('%c[School Connect Gen v8] templates loaded.', 'color:#4f46e5');
