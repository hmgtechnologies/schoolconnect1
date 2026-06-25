/* ====================================================================
   crud.js — School Connect generic CRUD engine
   --------------------------------------------------------------------
   Turns every module page into a REAL working list + add/edit/delete
   screen backed by Supabase. Replaces the old placeholder
   "Form will be generated for ..." behaviour. 100% free, no AI.

   SCHEMA[moduleId] = { table, title, cols:[{key,label,type,options?,required?}] }
   - type: text | textarea | number | date | datetime | select | checkbox | email | tel
   ==================================================================== */
const CRUD = {
  sb: null,
  init(supabaseClient) { this.sb = supabaseClient || (typeof sb !== 'undefined' ? sb : null); },

  /* Field schema per module. Only columns a human edits are listed; the DB
     fills ids/timestamps/generated columns automatically. */
  SCHEMA: {
    students: { table:'students', title:'Student', cols:[
      {key:'full_name',label:'Full name',type:'text',required:true},
      {key:'admission_no',label:'Admission No',type:'text'},
      {key:'class',label:'Class',type:'text'},
      {key:'arm',label:'Arm',type:'text'},
      {key:'gender',label:'Gender',type:'select',options:['male','female']},
      {key:'date_of_birth',label:'Date of birth',type:'date'},
      {key:'guardian_name',label:'Guardian name',type:'text'},
      {key:'guardian_phone',label:'Guardian phone',type:'tel'},
      {key:'guardian_email',label:'Guardian email',type:'email'},
      {key:'address',label:'Address',type:'textarea'},
      {key:'campus',label:'Campus',type:'text'},
      {key:'status',label:'Status',type:'select',options:['active','inactive','graduated']}
    ]},
    staff: { table:'staff', title:'Staff', cols:[
      {key:'full_name',label:'Full name',type:'text',required:true},
      {key:'email',label:'Email',type:'email'},
      {key:'phone',label:'Phone',type:'tel'},
      {key:'role',label:'Role',type:'text'},
      {key:'department',label:'Department',type:'text'},
      {key:'part_time',label:'Part-time',type:'checkbox'},
      {key:'leave_balance',label:'Leave balance',type:'number'},
      {key:'status',label:'Status',type:'select',options:['active','inactive']}
    ]},
    classes: { table:'classes', title:'Class', cols:[
      {key:'name',label:'Class name',type:'text',required:true},
      {key:'arm',label:'Arm',type:'text'},
      {key:'level',label:'Level',type:'text'},
      {key:'class_teacher',label:'Class teacher',type:'text'},
      {key:'capacity',label:'Capacity',type:'number'}
    ]},
    subjects: { table:'subjects', title:'Subject', cols:[
      {key:'name',label:'Subject',type:'text',required:true},
      {key:'code',label:'Code',type:'text'},
      {key:'department',label:'Department',type:'text'},
      {key:'level',label:'Level',type:'text'}
    ]},
    attendance: { table:'attendance', title:'Attendance', cols:[
      {key:'student_name',label:'Student',type:'text'},
      {key:'class',label:'Class',type:'text'},
      {key:'date',label:'Date',type:'date',required:true},
      {key:'status',label:'Status',type:'select',options:['present','absent','late','excused']},
      {key:'time_in',label:'Time in',type:'text'}
    ]},
    results: { table:'results', title:'Result', cols:[
      {key:'student_name',label:'Student',type:'text'},
      {key:'subject',label:'Subject',type:'text',required:true},
      {key:'class',label:'Class',type:'text'},
      {key:'term',label:'Term',type:'text'},
      {key:'session',label:'Session',type:'text'},
      {key:'ca1',label:'CA1',type:'number'},{key:'ca2',label:'CA2',type:'number'},
      {key:'ca3',label:'CA3',type:'number'},{key:'exam',label:'Exam',type:'number'},
      {key:'grade',label:'Grade',type:'text'},{key:'remark',label:'Remark',type:'text'}
    ]},
    timetable: { table:'timetable', title:'Timetable slot', cols:[
      {key:'class',label:'Class',type:'text'},{key:'day',label:'Day',type:'text'},
      {key:'period',label:'Period',type:'text'},{key:'subject',label:'Subject',type:'text'},
      {key:'teacher',label:'Teacher',type:'text'},{key:'room',label:'Room',type:'text'},
      {key:'session',label:'Session',type:'text'},{key:'term',label:'Term',type:'text'}
    ]},
    sow: { table:'scheme_of_work', title:'Scheme of Work', cols:[
      {key:'subject',label:'Subject',type:'text'},{key:'class',label:'Class',type:'text'},
      {key:'term',label:'Term',type:'text'},{key:'session',label:'Session',type:'text'},
      {key:'week',label:'Week',type:'number'},{key:'topic',label:'Topic',type:'text'},
      {key:'status',label:'Status',type:'select',options:['pending','covered','uncovered']},
      {key:'teacher',label:'Teacher',type:'text'}
    ]},
    assignments: { table:'assignments', title:'Assignment', cols:[
      {key:'title',label:'Title',type:'text',required:true},{key:'description',label:'Description',type:'textarea'},
      {key:'class',label:'Class',type:'text'},{key:'subject',label:'Subject',type:'text'},
      {key:'due_date',label:'Due date',type:'date'},{key:'drive_link',label:'Drive link',type:'text'}
    ]},
    library: { table:'library', title:'Book', cols:[
      {key:'title',label:'Title',type:'text',required:true},{key:'author',label:'Author',type:'text'},
      {key:'isbn',label:'ISBN',type:'text'},{key:'category',label:'Category',type:'text'},
      {key:'copies',label:'Copies',type:'number'},{key:'lent',label:'Lent',type:'number'},
      {key:'drive_link',label:'Drive link',type:'text'}
    ]},
    conduct: { table:'conduct', title:'Conduct record', cols:[
      {key:'student_name',label:'Student',type:'text'},
      {key:'type',label:'Type',type:'select',options:['merit','demerit','incident']},
      {key:'description',label:'Description',type:'textarea'},{key:'reporter',label:'Reporter',type:'text'},
      {key:'date',label:'Date',type:'date'}
    ]},
    health: { table:'health', title:'Health record', cols:[
      {key:'student_name',label:'Student',type:'text'},{key:'complaint',label:'Complaint',type:'text'},
      {key:'treatment',label:'Treatment',type:'textarea'},{key:'date',label:'Date',type:'date'},
      {key:'recorded_by',label:'Recorded by',type:'text'}
    ]},
    promotion: { table:'promotions', title:'Promotion', cols:[
      {key:'student_name',label:'Student',type:'text'},{key:'from_class',label:'From class',type:'text'},
      {key:'to_class',label:'To class',type:'text'},
      {key:'action',label:'Action',type:'select',options:['promote','graduate','repeat','delete']},
      {key:'session',label:'Session',type:'text'},{key:'term',label:'Term',type:'text'}
    ]},
    fees: { table:'fee_payments', title:'Fee payment', cols:[
      {key:'student_name',label:'Student',type:'text'},{key:'amount_paid',label:'Amount paid',type:'number',required:true},
      {key:'method',label:'Method',type:'select',options:['cash','transfer','pos','online']},
      {key:'reference',label:'Reference',type:'text'},{key:'term',label:'Term',type:'text'},{key:'session',label:'Session',type:'text'}
    ]},
    finance: { table:'finance_entries', title:'Finance entry', cols:[
      {key:'type',label:'Type',type:'select',options:['income','expense']},
      {key:'category',label:'Category',type:'text'},{key:'amount',label:'Amount',type:'number',required:true},
      {key:'description',label:'Description',type:'textarea'},{key:'date',label:'Date',type:'date'}
    ]},
    leave: { table:'leave_requests', title:'Leave request', cols:[
      {key:'type',label:'Type',type:'select',options:['sick','casual','earned','study','maternity']},
      {key:'start_date',label:'Start',type:'date'},{key:'end_date',label:'End',type:'date'},
      {key:'days',label:'Days',type:'number'},{key:'reason',label:'Reason',type:'textarea'},
      {key:'status',label:'Status',type:'select',options:['pending','approved','rejected']}
    ]},
    visitors: { table:'visitors', title:'Visitor', cols:[
      {key:'full_name',label:'Name',type:'text',required:true},{key:'phone',label:'Phone',type:'tel'},
      {key:'purpose',label:'Purpose',type:'text'},{key:'host',label:'Host',type:'text'},{key:'badge_no',label:'Badge No',type:'text'}
    ]},
    transport: { table:'transport', title:'Transport route', cols:[
      {key:'route_name',label:'Route',type:'text',required:true},{key:'driver',label:'Driver',type:'text'},
      {key:'vehicle_no',label:'Vehicle No',type:'text'},{key:'capacity',label:'Capacity',type:'number'}
    ]},
    announcements: { table:'announcements', title:'Announcement', cols:[
      {key:'title',label:'Title',type:'text',required:true},{key:'body',label:'Body',type:'textarea'},
      {key:'priority',label:'Priority',type:'select',options:['normal','high','urgent']},
      {key:'pinned',label:'Pinned',type:'checkbox'},{key:'audience',label:'Audience',type:'text'}
    ]},
    events: { table:'events', title:'Event', cols:[
      {key:'title',label:'Title',type:'text',required:true},{key:'description',label:'Description',type:'textarea'},
      {key:'date',label:'Date',type:'date'},{key:'venue',label:'Venue',type:'text'},{key:'organiser',label:'Organiser',type:'text'}
    ]},
    complaints: { table:'complaints', title:'Complaint', cols:[
      {key:'type',label:'Type',type:'text'},{key:'subject',label:'Subject',type:'text',required:true},
      {key:'body',label:'Details',type:'textarea'},
      {key:'urgency',label:'Urgency',type:'select',options:['low','normal','high','critical']},
      {key:'status',label:'Status',type:'select',options:['submitted','reviewing','in_progress','resolved','rejected']}
    ]},
    gallery: { table:'gallery', title:'Gallery item', cols:[
      {key:'album',label:'Album',type:'text'},{key:'caption',label:'Caption',type:'text'},
      {key:'media_url',label:'Media URL',type:'text',required:true},
      {key:'media_type',label:'Type',type:'select',options:['image','video','youtube']}
    ]},
    eresources: { table:'eresources', title:'E-Resource', cols:[
      {key:'title',label:'Title',type:'text',required:true},{key:'description',label:'Description',type:'textarea'},
      {key:'subject',label:'Subject',type:'text'},{key:'class',label:'Class',type:'text'},
      {key:'term',label:'Term',type:'text'},{key:'drive_link',label:'Drive link',type:'text'}
    ]},
    birthdays: { table:'birthdays', title:'Birthday', cols:[
      {key:'person_name',label:'Name',type:'text',required:true},{key:'type',label:'Type',type:'text'},
      {key:'date',label:'Date',type:'date'},{key:'class',label:'Class',type:'text'}
    ]},
    departments: { table:'departments', title:'Department', cols:[
      {key:'name',label:'Name',type:'text',required:true},{key:'head',label:'Head',type:'text'}
    ]},
    admissions: { table:'admissions', title:'Admission', cols:[
      {key:'full_name',label:'Applicant',type:'text',required:true},{key:'dob',label:'DOB',type:'date'},
      {key:'gender',label:'Gender',type:'select',options:['male','female']},
      {key:'parent_name',label:'Parent name',type:'text'},{key:'parent_email',label:'Parent email',type:'email'},
      {key:'parent_phone',label:'Parent phone',type:'tel'},{key:'applying_for_class',label:'Applying for class',type:'text'},
      {key:'status',label:'Status',type:'select',options:['submitted','reviewing','accepted','enrolled','rejected']}
    ]},
    hr: { table:'payroll', title:'Payroll', cols:[
      {key:'month',label:'Month',type:'text'},{key:'year',label:'Year',type:'number'},
      {key:'basic',label:'Basic',type:'number'},{key:'allowances',label:'Allowances',type:'number'},
      {key:'deductions',label:'Deductions',type:'number'},
      {key:'status',label:'Status',type:'select',options:['draft','approved','paid']}
    ]},
    hostel: { table:'hostel_allocations', title:'Hostel allocation', cols:[
      {key:'block',label:'Block',type:'text'},{key:'room',label:'Room',type:'text'},{key:'bed',label:'Bed',type:'text'},
      {key:'status',label:'Status',type:'select',options:['active','vacated']}
    ]},
    alumni: { table:'alumni', title:'Alumnus', cols:[
      {key:'full_name',label:'Name',type:'text',required:true},{key:'graduation_year',label:'Graduation year',type:'number'},
      {key:'last_class',label:'Last class',type:'text'},{key:'current_occupation',label:'Occupation',type:'text'},
      {key:'email',label:'Email',type:'email'},{key:'phone',label:'Phone',type:'tel'}
    ]},
    inventory: { table:'inventory', title:'Inventory item', cols:[
      {key:'item_name',label:'Item',type:'text',required:true},{key:'category',label:'Category',type:'text'},
      {key:'quantity',label:'Quantity',type:'number'},{key:'location',label:'Location',type:'text'},
      {key:'condition',label:'Condition',type:'text'}
    ]},
    lesson_plans: { table:'lesson_plans', title:'Lesson plan', cols:[
      {key:'teacher',label:'Teacher',type:'text'},{key:'subject',label:'Subject',type:'text'},
      {key:'class',label:'Class',type:'text'},{key:'week',label:'Week',type:'number'},
      {key:'term',label:'Term',type:'text'},{key:'session',label:'Session',type:'text'},
      {key:'objectives',label:'Objectives',type:'textarea'},{key:'content',label:'Content',type:'textarea'},
      {key:'resources',label:'Resources',type:'textarea'},
      {key:'status',label:'Status',type:'select',options:['draft','submitted','approved']}
    ]},
    behaviour: { table:'behaviour_points', title:'Behaviour point', cols:[
      {key:'student_name',label:'Student',type:'text'},{key:'points',label:'Points',type:'number'},
      {key:'reason',label:'Reason',type:'text'},{key:'badge',label:'Badge',type:'text'}
    ]},
    support_plans: { table:'support_plans', title:'Support plan', cols:[
      {key:'need_type',label:'Need type',type:'text'},{key:'intervention',label:'Intervention',type:'textarea'},
      {key:'goal',label:'Goal',type:'text'},{key:'review_date',label:'Review date',type:'date'},
      {key:'outcome',label:'Outcome',type:'text'},{key:'status',label:'Status',type:'select',options:['active','review','closed']}
    ]},
    donations: { table:'donations', title:'Donation', cols:[
      {key:'campaign',label:'Campaign',type:'text'},{key:'donor_name',label:'Donor',type:'text'},
      {key:'donor_email',label:'Donor email',type:'email'},{key:'amount',label:'Amount',type:'number',required:true},
      {key:'method',label:'Method',type:'text'},{key:'note',label:'Note',type:'text'},
      {key:'anonymous',label:'Anonymous',type:'checkbox'}
    ]},
    substitutions: { table:'substitutions', title:'Substitution', cols:[
      {key:'date',label:'Date',type:'date'},{key:'absent_teacher',label:'Absent teacher',type:'text'},
      {key:'substitute_teacher',label:'Substitute',type:'text'},{key:'class',label:'Class',type:'text'},
      {key:'subject',label:'Subject',type:'text'},{key:'period',label:'Period',type:'text'},
      {key:'status',label:'Status',type:'select',options:['planned','done','cancelled']}
    ]},
    helpdesk: { table:'helpdesk_tickets', title:'Help-desk ticket', cols:[
      {key:'category',label:'Category',type:'text'},{key:'subject',label:'Subject',type:'text',required:true},
      {key:'body',label:'Details',type:'textarea'},
      {key:'priority',label:'Priority',type:'select',options:['low','normal','high','urgent']},
      {key:'status',label:'Status',type:'select',options:['open','in_progress','resolved','closed']}
    ]},
    directory: { table:'profiles', title:'Person', readOnly:true, cols:[
      {key:'full_name',label:'Name',type:'text'},{key:'email',label:'Email',type:'email'},
      {key:'role',label:'Role',type:'text'},{key:'status',label:'Status',type:'text'}
    ]},
    parents: { table:'parent_child', title:'Parent–Child link', cols:[
      {key:'parent_id',label:'Parent (profile id)',type:'text'},{key:'student_id',label:'Student id',type:'text'},
      {key:'relationship',label:'Relationship',type:'text'}
    ]}
  },

  def(moduleId){ return this.SCHEMA[moduleId]; },

  /* Render the list table for a module page */
  async renderList(moduleId) {
    const d = this.def(moduleId);
    const tableEl = document.getElementById(moduleId + '-table');
    if (!tableEl) return;
    if (!d) { tableEl.querySelector('thead').innerHTML = '<tr><th>Not available</th></tr>'; return; }
    if (!this.sb) {
      tableEl.querySelector('thead').innerHTML = '<tr><th>Database not configured</th></tr>';
      tableEl.querySelector('tbody').innerHTML = '<tr><td>Add your Supabase keys in assets/js/config.js</td></tr>';
      return;
    }
    const { data, error } = await this.sb.from(d.table).select('*').order('created_at', { ascending: false }).limit(500);
    const cols = d.cols;
    const head = '<tr>' + cols.map(c => '<th>' + esc(c.label) + '</th>').join('') + (d.readOnly ? '' : '<th>Actions</th>') + '</tr>';
    tableEl.querySelector('thead').innerHTML = head;
    const tb = tableEl.querySelector('tbody');
    if (error) { tb.innerHTML = '<tr><td colspan="' + (cols.length + 1) + '">' + esc(error.message) + '</td></tr>'; return; }
    if (!data || !data.length) { tb.innerHTML = '<tr><td colspan="' + (cols.length + 1) + '" style="color:var(--gray-500)">No records yet. Click “+ Add new”.</td></tr>'; return; }
    tb.innerHTML = data.map(row => '<tr>' + cols.map(c => {
      let v = row[c.key];
      if (c.type === 'checkbox') v = v ? '✓' : '';
      return '<td>' + esc(String(v == null ? '' : v)).slice(0, 80) + '</td>';
    }).join('') + (d.readOnly ? '' :
      '<td style="white-space:nowrap" data-admin-only>' +
        '<button class="btn btn-sm btn-outline" onclick="CRUD.openForm(\'' + moduleId + '\',\'' + row.id + '\')">Edit</button> ' +
        '<button class="btn btn-sm btn-outline" onclick="CRUD.remove(\'' + moduleId + '\',\'' + row.id + '\')">Delete</button>' +
      '</td>') + '</tr>').join('');
    // re-apply role visibility to the freshly-rendered action buttons
    if (window.App && App.applyRoleVisibility) try { App.applyRoleVisibility(); } catch (e) {}
  },

  /* Open the add/edit modal with a REAL form */
  async openForm(moduleId, id) {
    const d = this.def(moduleId);
    if (!d) { toast('This module has no editable form.', 'warning'); return; }
    let row = {};
    if (id && this.sb) { const { data } = await this.sb.from(d.table).select('*').eq('id', id).maybeSingle(); row = data || {}; }
    const body = d.cols.map(c => {
      const val = row[c.key] != null ? row[c.key] : '';
      const req = c.required ? ' required' : '';
      let field;
      if (c.type === 'textarea') field = '<textarea class="form-input" id="cf-' + c.key + '" rows="2"' + req + '>' + esc(val) + '</textarea>';
      else if (c.type === 'select') field = '<select class="form-select" id="cf-' + c.key + '"><option value="">—</option>' + c.options.map(o => '<option' + (String(val) === o ? ' selected' : '') + '>' + esc(o) + '</option>').join('') + '</select>';
      else if (c.type === 'checkbox') field = '<input type="checkbox" id="cf-' + c.key + '"' + (val ? ' checked' : '') + '>';
      else field = '<input class="form-input" id="cf-' + c.key + '" type="' + (c.type || 'text') + '" value="' + esc(val) + '"' + req + '>';
      return '<div class="form-group"><label>' + esc(c.label) + (c.required ? ' *' : '') + '</label>' + field + '</div>';
    }).join('');
    openModal((id ? 'Edit ' : 'Add ') + d.title, body,
      '<button class="btn btn-outline" onclick="closeModal()">Cancel</button>' +
      '<button class="btn btn-primary" onclick="CRUD.save(\'' + moduleId + '\',' + (id ? '\'' + id + '\'' : 'null') + ')">Save</button>');
  },

  async save(moduleId, id) {
    const d = this.def(moduleId);
    if (!d || !this.sb) { toast('Database not configured.', 'warning'); return; }
    const payload = {};
    let missing = '';
    d.cols.forEach(c => {
      const el = document.getElementById('cf-' + c.key); if (!el) return;
      let v = c.type === 'checkbox' ? el.checked : el.value;
      if (c.type === 'number') v = v === '' ? null : Number(v);
      if (c.type !== 'checkbox' && v === '') v = null;
      if (c.required && (v === null || v === '')) missing = c.label;
      payload[c.key] = v;
    });
    if (missing) { toast(missing + ' is required.', 'warning'); return; }
    let res;
    if (id) res = await this.sb.from(d.table).update(payload).eq('id', id);
    else res = await this.sb.from(d.table).insert(payload);
    if (res.error) { toast(res.error.message, 'danger', 6000); return; }
    if (window.App && App.logActivity) App.logActivity(id ? 'update' : 'create', d.table, id || d.title);
    closeModal(); toast('✅ Saved.', 'success'); this.renderList(moduleId);
  },

  async remove(moduleId, id) {
    const d = this.def(moduleId);
    if (!d || !this.sb) return;
    if (!confirm('Delete this ' + d.title.toLowerCase() + '?')) return;
    const { error } = await this.sb.from(d.table).delete().eq('id', id);
    if (error) { toast(error.message, 'danger'); return; }
    if (window.App && App.logActivity) App.logActivity('delete', d.table, id);
    toast('Deleted.', 'info'); this.renderList(moduleId);
  },

  exportCSV(moduleId) {
    const d = this.def(moduleId); if (!d || !this.sb) return;
    this.sb.from(d.table).select('*').then(({ data }) => {
      if (!data || !data.length) { toast('Nothing to export.', 'warning'); return; }
      const keys = Object.keys(data[0]);
      const csv = [keys.join(',')].concat(data.map(r => keys.map(k => '"' + String(r[k] == null ? '' : r[k]).replace(/"/g, '""') + '"').join(','))).join('\n');
      const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = d.table + '.csv'; a.click();
    });
  }
};
if (typeof window !== 'undefined') window.CRUD = CRUD;
if (typeof console !== 'undefined') console.log('%c[School Connect] CRUD engine loaded — real add/edit/delete for every module.', 'color:#0d9488;font-weight:bold');
