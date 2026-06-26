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
      {key:'student_name',label:'Student',type:'ref',refTable:'students',refValue:'full_name',refExtra:['class'],refStore:'value',autofill:{class:'class'}},
      {key:'class',label:'Class',type:'ref',refTable:'classes',refValue:'name'},
      {key:'date',label:'Date',type:'date',required:true},
      {key:'status',label:'Status',type:'select',options:['present','absent','late','excused']},
      {key:'time_in',label:'Time in',type:'time'}
    ]},
    results: { table:'results', title:'Result', cols:[
      {key:'student_name',label:'Student',type:'ref',refTable:'students',refValue:'full_name',refExtra:['class'],refStore:'value',autofill:{class:'class'}},
      {key:'subject',label:'Subject',type:'ref',refTable:'subjects',refValue:'name',refStore:'value',required:true},
      {key:'class',label:'Class',type:'ref',refTable:'classes',refValue:'name'},
      {key:'term',label:'Term',type:'lookup',lookupKind:'term'},
      {key:'session',label:'Session',type:'lookup',lookupKind:'session'},
      {key:'ca1',label:'CA1',type:'number'},{key:'ca2',label:'CA2',type:'number'},
      {key:'ca3',label:'CA3',type:'number'},{key:'exam',label:'Exam',type:'number'},
      {key:'grade',label:'Grade',type:'text',help:'auto-suggested from total'},{key:'remark',label:'Remark',type:'text'}
    ]},
    timetable: { table:'timetable', title:'Timetable slot', cols:[
      {key:'class',label:'Class',type:'ref',refTable:'classes',refValue:'name'},
      {key:'day',label:'Day',type:'select',options:['Monday','Tuesday','Wednesday','Thursday','Friday']},
      {key:'period',label:'Period',type:'text'},
      {key:'subject',label:'Subject',type:'ref',refTable:'subjects',refValue:'name',refStore:'value'},
      {key:'teacher',label:'Teacher',type:'ref',refTable:'staff',refValue:'full_name',refStore:'value'},
      {key:'room',label:'Room',type:'text'},
      {key:'session',label:'Session',type:'lookup',lookupKind:'session'},{key:'term',label:'Term',type:'lookup',lookupKind:'term'}
    ]},
    sow: { table:'scheme_of_work', title:'Scheme of Work', cols:[
      {key:'subject',label:'Subject',type:'ref',refTable:'subjects',refValue:'name',refStore:'value'},
      {key:'class',label:'Class',type:'ref',refTable:'classes',refValue:'name'},
      {key:'term',label:'Term',type:'lookup',lookupKind:'term'},{key:'session',label:'Session',type:'lookup',lookupKind:'session'},
      {key:'week',label:'Week',type:'number'},{key:'topic',label:'Topic',type:'text',required:true},
      {key:'status',label:'Status',type:'select',options:['pending','covered','uncovered']},
      {key:'confirmed',label:'Taught this week (confirm)',type:'checkbox'},
      {key:'teacher',label:'Teacher',type:'ref',refTable:'staff',refValue:'full_name',refStore:'value'}
    ]},
    assignments: { table:'assignments', title:'Assignment', cols:[
      {key:'title',label:'Title',type:'text',required:true},{key:'description',label:'Description',type:'textarea'},
      {key:'class',label:'Class',type:'ref',refTable:'classes',refValue:'name'},
      {key:'subject',label:'Subject',type:'ref',refTable:'subjects',refValue:'name',refStore:'value'},
      {key:'due_date',label:'Due date',type:'date'},{key:'drive_link',label:'Drive link',type:'text'}
    ]},
    library: { table:'library', title:'Book', cols:[
      {key:'title',label:'Title',type:'text',required:true},{key:'author',label:'Author',type:'text'},
      {key:'isbn',label:'ISBN',type:'text'},{key:'category',label:'Category',type:'text'},
      {key:'copies',label:'Copies',type:'number'},{key:'lent',label:'Lent',type:'number'},
      {key:'drive_link',label:'Drive link',type:'text'}
    ]},
    conduct: { table:'conduct', title:'Conduct record', cols:[
      {key:'student_name',label:'Student',type:'ref',refTable:'students',refValue:'full_name',refStore:'value'},
      {key:'type',label:'Type',type:'select',options:['merit','demerit','incident']},
      {key:'description',label:'Description',type:'textarea'},{key:'reporter',label:'Reporter',type:'text'},
      {key:'date',label:'Date',type:'date'}
    ]},
    health: { table:'health', title:'Health record', cols:[
      {key:'student_name',label:'Student',type:'ref',refTable:'students',refValue:'full_name',refStore:'value'},
      {key:'complaint',label:'Complaint',type:'text'},
      {key:'treatment',label:'Treatment',type:'textarea'},{key:'date',label:'Date',type:'date'},
      {key:'recorded_by',label:'Recorded by',type:'text'}
    ]},
    promotion: { table:'promotions', title:'Promotion', cols:[
      {key:'student_name',label:'Student',type:'ref',refTable:'students',refValue:'full_name',refExtra:['class'],refStore:'value',autofill:{from_class:'class'}},
      {key:'from_class',label:'From class',type:'text'},
      {key:'to_class',label:'To class',type:'ref',refTable:'classes',refValue:'name'},
      {key:'action',label:'Action',type:'select',options:['promote','graduate','repeat','delete']},
      {key:'session',label:'Session',type:'lookup',lookupKind:'session'},{key:'term',label:'Term',type:'lookup',lookupKind:'term'}
    ]},
    fees: { table:'fee_payments', title:'Fee payment', cols:[
      {key:'student_name',label:'Student',type:'ref',refTable:'students',refValue:'full_name',refStore:'value',required:true},
      {key:'amount_paid',label:'Amount paid',type:'number',required:true},
      {key:'method',label:'Method',type:'select',options:['cash','transfer','pos','online']},
      {key:'reference',label:'Reference',type:'text'},{key:'term',label:'Term',type:'lookup',lookupKind:'term'},{key:'session',label:'Session',type:'lookup',lookupKind:'session'}
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
      {key:'pinned',label:'Pinned',type:'checkbox'},
      {key:'audience',label:'Audience',type:'lookup',lookupKind:'audience'}
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
      {key:'person_name',label:'Pick a student (auto-fills date & class)',type:'ref',refTable:'students',refValue:'full_name',refExtra:['class','date_of_birth'],refStore:'value',autofill:{date:'date_of_birth',class:'class'}},
      {key:'type',label:'Type',type:'select',options:['student','staff']},
      {key:'date',label:'Date of birth',type:'date'},{key:'class',label:'Class',type:'text'}
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
      {key:'student_name',label:'Student',type:'ref',refTable:'students',refValue:'full_name',refStore:'value'},
      {key:'points',label:'Points',type:'number'},
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
      {key:'parent_id',label:'Parent (profile id)',type:'text'},
      {key:'student_id',label:'Student',type:'ref',refTable:'students',refValue:'full_name',refStore:'id'},
      {key:'relationship',label:'Relationship',type:'select',options:['parent','guardian','sponsor']}
    ]}
  },

  fid(key){ return String(key).replace(/[^a-z0-9_-]/gi,'_'); },

  /* ---- Generic (module_records-backed) modules: every previously "no form"
     module (issue 8) now has a working Add/Edit/Delete screen. The shared
     columns (title/body/status/ref_date/amount) cover most needs; extra fields
     go into data{}. ---- */
  GENERIC: {
    messages:    { title:'Message',      cols:[['title','Subject','text',true],['body','Message','textarea'],['data.to','To (name/role)','text']] },
    inbox:       { title:'Inbox message',cols:[['title','Subject','text',true],['body','Message','textarea'],['data.from','From','text'],['status','Status','select',['unread','read','archived']]] },
    broadcast:   { title:'Result Broadcast',cols:[['title','Title','text',true],['body','Message','textarea'],['data.channel','Channel','select',['whatsapp','email','sms','in-app']],['data.audience','Audience','lookup','audience']] },
    reports:     { title:'Report',       cols:[['title','Report title','text',true],['data.type','Type','text'],['body','Summary / notes','textarea'],['ref_date','Date','date']] },
    school_calendar:{ title:'Calendar event',cols:[['title','Event','text',true],['ref_date','Date','date',true],['body','Details','textarea'],['data.category','Category','select',['holiday','exam','mid-term','term-start','term-end','event']]] },
    lost_found:  { title:'Lost & Found item',cols:[['title','Item','text',true],['data.kind','Kind','select',['lost','found']],['body','Description','textarea'],['data.location','Location','text'],['ref_date','Date','date'],['status','Status','select',['open','claimed','returned']]] },
    parent_meeting:{ title:'PTA Meeting',cols:[['title','Topic','text',true],['ref_date','Date','date',true],['data.time','Time','time'],['data.venue','Venue','text'],['body','Agenda / minutes','textarea']] },
    book_request:{ title:'Book request', cols:[['title','Book title','text',true],['data.student','Student','ref-students'],['status','Status','select',['requested','reserved','issued','returned']],['ref_date','Date','date']] },
    lms:         { title:'LMS course/lesson',cols:[['title','Title','text',true],['data.subject','Subject','ref-subjects'],['data.class','Class','ref-classes'],['body','Content / description','textarea'],['data.video','Video/Drive link','text']] },
    gamification:{ title:'Reward / badge',cols:[['title','Badge/Reward','text',true],['data.student','Student','ref-students'],['amount','Points','number'],['body','Reason','textarea']] },
    cafeteria:   { title:'Cafeteria item',cols:[['title','Item','text',true],['amount','Price','number'],['data.category','Category','select',['breakfast','snack','lunch','drink']],['body','Notes','textarea']] },
    financial_aid:{ title:'Scholarship/Aid',cols:[['title','Scheme','text',true],['data.student','Student','ref-students'],['amount','Amount/Waiver','number'],['status','Status','select',['applied','approved','renewed','ended']],['body','Notes','textarea']] },
    front_desk:  { title:'Front-desk log',cols:[['title','Subject','text',true],['data.kind','Type','select',['call','dispatch','walk-in','inquiry']],['body','Details','textarea'],['data.contact','Contact','text'],['ref_date','Date','date']] },
    career_counseling:{ title:'Career record',cols:[['title','Title','text',true],['data.student','Student','ref-students'],['body','Guidance / offers','textarea'],['data.university','University/Placement','text']] },
    document_builder:{ title:'Document',cols:[['title','Document','text',true],['data.type','Type','select',['hall ticket','bonafide','transfer','testimonial','custom']],['body','Content','textarea']] },
    fleet_tracking:{ title:'Fleet log',cols:[['title','Vehicle/Route','text',true],['data.driver','Driver','text'],['body','Notes / location','textarea'],['ref_date','Date','date']] },
    facility_booking:{ title:'Facility booking',cols:[['title','Facility','text',true],['ref_date','Date','date',true],['data.time','Time','time'],['data.bookedby','Booked by','text'],['status','Status','select',['requested','approved','cancelled']]] },
    compliance:  { title:'Compliance item',cols:[['title','Item','text',true],['data.category','Category','select',['accreditation','fire drill','inspection','statutory']],['ref_date','Date','date'],['status','Status','select',['pending','passed','failed','due']],['body','Notes','textarea']] },
    payments_online:{ title:'Online payment',cols:[['title','Reference','text',true],['data.student','Student','ref-students'],['amount','Amount','number',true],['data.provider','Provider','select',['paystack','flutterwave','bank_transfer']],['status','Status','select',['pending','paid','failed','cancelled']]] }
  },

  /* Resolve a module to a normalized definition. Generic modules are backed by
     the shared module_records table; their compact [key,label,type,...] tuples
     are expanded into full column objects with relational helpers. */
  def(moduleId){
    if (this.SCHEMA[moduleId]) return this.SCHEMA[moduleId];
    const g = this.GENERIC[moduleId];
    if (!g) return null;
    const cols = g.cols.map(t => {
      const [key, label, type, extra, extra2] = t;
      const c = { key, label, type: type || 'text' };
      if (type === 'select') c.options = extra;
      else if (type === 'lookup') c.lookupKind = extra;
      else if (type === 'ref-students') { c.type='ref'; c.refTable='students'; c.refValue='full_name'; c.refStore='value'; }
      else if (type === 'ref-classes') { c.type='ref'; c.refTable='classes'; c.refValue='name'; }
      else if (type === 'ref-subjects') { c.type='ref'; c.refTable='subjects'; c.refValue='name'; c.refStore='value'; }
      if (extra === true || extra2 === true) c.required = true;
      return c;
    });
    return { table:'module_records', title:g.title, generic:true, module:moduleId, cols };
  },

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
    const { data, error } = await (d.generic
      ? this.sb.from(d.table).select('*').eq('module', d.module).order('created_at', { ascending: false }).limit(500)
      : this.sb.from(d.table).select('*').order('created_at', { ascending: false }).limit(500));
    const cols = d.cols;
    const cellVal = (row, c) => c.key.indexOf('data.') === 0 ? ((row.data || {})[c.key.slice(5)]) : row[c.key];
    const head = '<tr>' + cols.map(c => '<th>' + esc(c.label) + '</th>').join('') + (d.readOnly ? '' : '<th>Actions</th>') + '</tr>';
    tableEl.querySelector('thead').innerHTML = head;
    const tb = tableEl.querySelector('tbody');
    if (error) { tb.innerHTML = '<tr><td colspan="' + (cols.length + 1) + '">' + esc(error.message) + '</td></tr>'; return; }
    if (!data || !data.length) { tb.innerHTML = '<tr><td colspan="' + (cols.length + 1) + '" style="color:var(--gray-500)">No records yet. Click “+ Add new”.</td></tr>'; return; }
    tb.innerHTML = data.map(row => '<tr>' + cols.map(c => {
      let v = cellVal(row, c);
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
  /* ---- option-source cache so dropdowns load once per form ---- */
  _optCache: {},
  async loadOptions(c) {
    // c.type 'ref'    -> {refTable, refValue(col used as text), refExtra?}
    // c.type 'lookup' -> {lookupKind}
    if (!this.sb) return [];
    try {
      if (c.type === 'ref') {
        const cols = ['id', c.refValue].concat(c.refExtra || []).join(',');
        const { data } = await this.sb.from(c.refTable).select(cols).order(c.refValue, { ascending: true }).limit(1000);
        return (data || []).map(r => ({ value: c.refStore === 'id' ? r.id : r[c.refValue], label: r[c.refValue] + (c.refExtra && r[c.refExtra[0]] ? ' (' + r[c.refExtra[0]] + ')' : ''), row: r }));
      }
      if (c.type === 'lookup') {
        const { data } = await this.sb.from('lookups').select('value').eq('kind', c.lookupKind).order('position');
        return (data || []).map(r => ({ value: r.value, label: r.value }));
      }
    } catch (e) { /* table may be empty/missing */ }
    return (c.options || []).map(o => ({ value: o, label: o }));
  },

  async openForm(moduleId, id) {
    const d = this.def(moduleId);
    if (!d) { toast('This module has no editable form.', 'warning'); return; }
    if (!this.sb) { toast('Database not configured (add Supabase keys in assets/js/config.js).', 'warning', 6000); return; }
    let row = {};
    if (id) { const { data } = await this.sb.from(d.table).select('*').eq('id', id).maybeSingle(); row = data || {}; }
    // Pre-load any ref/lookup/select option sources
    const getVal = (k) => k.indexOf('data.') === 0 ? ((row.data || {})[k.slice(5)]) : row[k];
    const fields = [];
    for (const c of d.cols) {
      const rv = getVal(c.key);
      const val = rv != null ? rv : (c.default != null ? c.default : '');
      const req = c.required ? ' required' : '';
      let field;
      if (c.type === 'textarea') {
        field = '<textarea class="form-input" id="cf-' + CRUD.fid(c.key) + '" rows="2"' + req + '>' + esc(val) + '</textarea>';
      } else if (c.type === 'ref' || c.type === 'lookup' || c.type === 'select') {
        const opts = (c.type === 'select') ? (c.options || []).map(o => ({ value: o, label: o })) : await this.loadOptions(c);
        const onchg = (c.type === 'ref' && c.autofill) ? ' onchange="CRUD.onRefChange(\'' + moduleId + '\',\'' + c.key + '\',this)"' : '';
        field = '<select class="form-select" id="cf-' + CRUD.fid(c.key) + '"' + onchg + '><option value="">— select —</option>' +
          opts.map(o => '<option value="' + esc(o.value) + '"' + (String(val) === String(o.value) ? ' selected' : '') + (o.row ? ' data-row=\'' + esc(JSON.stringify(o.row)) + '\'' : '') + '>' + esc(o.label) + '</option>').join('') + '</select>';
      } else if (c.type === 'checkbox') {
        field = '<label style="display:inline-flex;gap:8px;align-items:center"><input type="checkbox" id="cf-' + CRUD.fid(c.key) + '"' + (val ? ' checked' : '') + '> ' + esc(c.label) + '</label>';
      } else if (c.type === 'time') {
        field = '<input class="form-input" id="cf-' + CRUD.fid(c.key) + '" type="time" value="' + esc(val) + '"' + req + '>';
      } else {
        field = '<input class="form-input" id="cf-' + CRUD.fid(c.key) + '" type="' + (c.type || 'text') + '" value="' + esc(val) + '"' + (c.readonly ? ' readonly' : '') + req + (c.placeholder ? ' placeholder="' + esc(c.placeholder) + '"' : '') + '>';
      }
      const labelHtml = (c.type === 'checkbox') ? '' : '<label>' + esc(c.label) + (c.required ? ' *' : '') + (c.help ? ' <span style="color:var(--gray-500);font-weight:400;font-size:.8rem">— ' + esc(c.help) + '</span>' : '') + '</label>';
      fields.push('<div class="form-group">' + labelHtml + field + '</div>');
    }
    openModal((id ? 'Edit ' : 'Add ') + d.title, fields.join(''),
      '<button class="btn btn-outline" onclick="closeModal()">Cancel</button>' +
      '<button class="btn btn-primary" onclick="CRUD.save(\'' + moduleId + '\',' + (id ? '\'' + id + '\'' : 'null') + ')">Save</button>');
  },

  /* When a ref dropdown with autofill changes (e.g. pick a student), copy
     extra fields like the student's name and DOB into the form (issues 1 & 10). */
  onRefChange(moduleId, key, sel) {
    try {
      const opt = sel.options[sel.selectedIndex];
      const rowJson = opt && opt.getAttribute('data-row');
      if (!rowJson) return;
      const r = JSON.parse(rowJson);
      const d = this.def(moduleId);
      const c = d.cols.find(x => x.key === key);
      if (c && c.autofill) Object.keys(c.autofill).forEach(targetKey => {
        const srcCol = c.autofill[targetKey];
        const el = document.getElementById('cf-' + CRUD.fid(targetKey));
        if (el && r[srcCol] != null) el.value = r[srcCol];
      });
    } catch (e) {}
  },

  async save(moduleId, id) {
    const d = this.def(moduleId);
    if (!d || !this.sb) { toast('Database not configured.', 'warning'); return; }
    const payload = {};
    const dataObj = {};
    let missing = '';
    d.cols.forEach(c => {
      const el = document.getElementById('cf-' + CRUD.fid(c.key)); if (!el) return;
      let v = c.type === 'checkbox' ? el.checked : el.value;
      if (c.type === 'number') v = v === '' ? null : Number(v);
      if (c.type !== 'checkbox' && v === '') v = null;
      if (c.required && (v === null || v === '')) missing = c.label;
      if (c.computeOnly) return; // display-only helper field, not stored
      if (c.key.indexOf('data.') === 0) dataObj[c.key.slice(5)] = v; else payload[c.key] = v;
    });
    if (missing) { toast(missing + ' is required.', 'warning'); return; }
    if (d.generic) { payload.module = d.module; payload.data = dataObj; if (!payload.title && dataObj.title) payload.title = dataObj.title; }
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

  /* Issue 10: bulk-import student birthdays from the students table */
  async importBirthdays() {
    if (!this.sb) { toast('Database not configured.', 'warning'); return; }
    const { data: studs } = await this.sb.from('students').select('full_name,class,date_of_birth').not('date_of_birth', 'is', null);
    if (!studs || !studs.length) { toast('No students with a date of birth found.', 'warning'); return; }
    const { data: existing } = await this.sb.from('birthdays').select('person_name');
    const have = new Set((existing || []).map(b => b.person_name));
    const rows = studs.filter(s => !have.has(s.full_name)).map(s => ({ person_name: s.full_name, type: 'student', date: s.date_of_birth, class: s.class }));
    if (!rows.length) { toast('All student birthdays are already imported.', 'info'); return; }
    const { error } = await this.sb.from('birthdays').insert(rows);
    if (error) { toast(error.message, 'danger'); return; }
    toast('✅ Imported ' + rows.length + ' student birthday(s).', 'success'); this.renderList('birthdays');
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
