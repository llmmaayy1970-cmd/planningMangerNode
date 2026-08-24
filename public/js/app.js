// ===================================
// التطبيق الرئيسي - نظام متابعة المشاريع
// ===================================

let currentUser = null;
let allProjects = [];
let allUsers = [];
let editingProjectId = null;

// ---- تهيئة ----
document.addEventListener('DOMContentLoaded', () => {
  const saved = localStorage.getItem('pm_user');
  if (saved && api.token) {
    currentUser = JSON.parse(saved);
    showApp();
  } else {
    showLogin();
  }

  // أحداث تسجيل الدخول
  document.getElementById('loginForm').addEventListener('submit', handleLogin);
  document.getElementById('logoutBtn').addEventListener('click', handleLogout);

  // أحداث التنقل
  document.getElementById('projectModalBd').addEventListener('click', closeProjectModal);
  document.getElementById('closeProjectModal').addEventListener('click', closeProjectModal);
  document.getElementById('userModalBd').addEventListener('click', closeUserModal);
  document.getElementById('closeUserModal').addEventListener('click', closeUserModal);
  document.getElementById('cancelUserModal').addEventListener('click', closeUserModal);
  document.getElementById('userForm').addEventListener('submit', handleSaveUser);
  document.getElementById('addUserBtn').addEventListener('click', () => openUserModal());

  // بحث وفلتر
  document.getElementById('searchInput').addEventListener('input', filterProjects);
  document.getElementById('filterStatus').addEventListener('change', filterProjects);

  // تاريخ اليوم
  document.getElementById('todayDate').textContent = new Date().toLocaleDateString('ar-IQ', {
    weekday:'long', year:'numeric', month:'long', day:'numeric'
  });
  // أحداث المودال
    const projectModalBd = document.getElementById('projectModalBd');
    if (projectModalBd) {
        projectModalBd.addEventListener('click', closeProjectModal);
    }
    
    const closeProjectModalBtn = document.getElementById('closeProjectModal');
    if (closeProjectModalBtn) {
        closeProjectModalBtn.addEventListener('click', closeProjectModal);
    }
    
    const userModalBd = document.getElementById('userModalBd');
    if (userModalBd) {
        userModalBd.addEventListener('click', closeUserModal);
    }
    
    const closeUserModalBtn = document.getElementById('closeUserModal');
    if (closeUserModalBtn) {
        closeUserModalBtn.addEventListener('click', closeUserModal);
    }
    
    const cancelUserModalBtn = document.getElementById('cancelUserModal');
    if (cancelUserModalBtn) {
        cancelUserModalBtn.addEventListener('click', closeUserModal);
    }
    
    const userForm = document.getElementById('userForm');
    if (userForm) {
        userForm.addEventListener('submit', handleSaveUser);
    }
    
    const addUserBtn = document.getElementById('addUserBtn');
    if (addUserBtn) {
        addUserBtn.addEventListener('click', () => openUserModal());
    }
    
    // بحث وفلتر
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', filterProjects);
    }
    
    const filterStatus = document.getElementById('filterStatus');
    if (filterStatus) {
        filterStatus.addEventListener('change', filterProjects);
    }

    // تاريخ اليوم
    const todayDate = document.getElementById('todayDate');
    if (todayDate) {
        todayDate.textContent = new Date().toLocaleDateString('ar-IQ', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
});


// ---- تسجيل الدخول ----
async function handleLogin(e) {
  e.preventDefault();
  const username = document.getElementById('loginUsername').value.trim();
  const password = document.getElementById('loginPassword').value;
  const btn = document.getElementById('loginBtn');
  const err = document.getElementById('loginError');
  err.classList.add('hidden');
  btn.disabled = true; btn.querySelector('span').textContent = 'جارٍ التحقق...';

  const res = await api.login(username, password);
  btn.disabled = false; btn.querySelector('span').textContent = 'تسجيل الدخول';

  if (res.success) {
    api.setToken(res.token);
    currentUser = res.user;
    localStorage.setItem('pm_user', JSON.stringify(currentUser));
    showApp();
  } else {
    err.textContent = res.message;
    err.classList.remove('hidden');
  }
}

function handleLogout() {
  api.setToken(null);
  localStorage.removeItem('pm_user');
  currentUser = null;
  showLogin();
}

function showLogin() {
  document.getElementById('loginPage').classList.add('active');
  document.getElementById('loginPage').classList.remove('hidden');
  document.getElementById('appPage').classList.add('hidden');
  document.getElementById('appPage').classList.remove('active');
}
// ---- مودال المشروع ----
async function openProjectModal(id = null) {
    console.log('📂 فتح مشروع ID:', id);
    
    const isNew = id === null || id === undefined;
    editingProjectId = id;
    
    const modal = document.getElementById('projectModal');
    if (!modal) {
        console.error('❌ modal غير موجود');
        showToast('خطأ: نافذة المشروع غير موجودة', 'error');
        return;
    }
    
    modal.classList.remove('hidden');
    document.getElementById('projectModalTitle').textContent = isNew ? 'إضافة مشروع جديد' : 'تفاصيل المشروع';

    const body = document.getElementById('projectModalBody');
    if (!body) {
        console.error('❌ projectModalBody غير موجود');
        return;
    }
    
    if (isNew) {
        renderNewProjectModal();
    } else {
        body.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-muted)">⏳ جارٍ التحميل...</div>';
        try {
            console.log('⏳ جاري تحميل بيانات المشروع ID:', id);
            
            const projRes = await api.getProject(id);
            console.log('📊 استجابة المشروع:', projRes);
            
            if (!projRes.success) {
                console.error('❌ فشل تحميل المشروع:', projRes.message);
                showToast(projRes.message || 'خطأ في تحميل المشروع', 'error');
                body.innerHTML = `<div style="text-align:center;padding:40px;color:var(--danger);">❌ ${projRes.message || 'حدث خطأ'}</div>`;
                return;
            }
            
            if (!projRes.data) {
                console.error('❌ لا توجد بيانات للمشروع');
                body.innerHTML = `<div style="text-align:center;padding:40px;color:var(--danger);">❌ لا توجد بيانات للمشروع</div>`;
                return;
            }
            
            console.log('✅ تم تحميل المشروع:', projRes.data);
            
            // ===== التحقق من حالة المشروع وتحديثها إذا كان "جديد" والمستخدم هو المكلف =====
            const project = projRes.data;
            
            // إذا كان المشروع بحالة "جديد" والمستخدم الحالي هو المكلف به
            if (project.status === 'جديد' && project.assigned_user_id === currentUser.id) {
                console.log('🔄 تحديث حالة المشروع من "جديد" إلى "مستمر"');
                
                // تحديث حالة المشروع إلى "مستمر"
                const updateRes = await api.updateProject(id, {
                    ...project,
                    status: 'مستمر'
                });
                
                if (updateRes.success) {
                    console.log('✅ تم تحديث حالة المشروع إلى "مستمر"');
                    // تحديث المشروع في القائمة
                    await loadProjects();
                    await loadDashboard();
                    
                    // إعادة تحميل بيانات المشروع بعد التحديث
                    const updatedProjRes = await api.getProject(id);
                    if (updatedProjRes.success) {
                        project.status = 'مستمر';
                    }
                } else {
                    console.warn('⚠️ فشل تحديث حالة المشروع:', updateRes.message);
                }
            }
            
            const [descRes, msgRes, attRes] = await Promise.all([
                api.getDescriptions(id),
                api.getMessages(id),
                api.getAttachments(id)
            ]);
            
            renderProjectModal(
                project, 
                descRes.success ? descRes.data : [], 
                msgRes.success ? msgRes.data : [], 
                attRes.success ? attRes.data : []
            );
            
            console.log('✅ تم عرض المودال بنجاح');
        } catch (err) {
            console.error('❌ خطأ في تحميل بيانات المشروع:', err);
            showToast('خطأ في تحميل بيانات المشروع: ' + err.message, 'error');
            body.innerHTML = `<div style="text-align:center;padding:40px;color:var(--danger);">❌ حدث خطأ أثناء التحميل<br><span style="font-size:12px;color:var(--text-muted);">${err.message}</span></div>`;
        }
    }
}
function closeProjectModal() {
    const modal = document.getElementById('projectModal');
    if (modal) {
        modal.classList.add('hidden');
    }
    editingProjectId = null;
}

function showApp() {
    document.getElementById('loginPage').classList.add('hidden');
    document.getElementById('loginPage').classList.remove('active');
    document.getElementById('appPage').classList.remove('hidden');
    document.getElementById('appPage').classList.add('active');

    // معلومات المستخدم
    document.getElementById('currentUserName').textContent = currentUser.full_name;
    document.getElementById('currentUserRole').textContent = currentUser.status === 'Admin' ? 'مدير النظام' : 'مستخدم';

    // ===== إظهار/إخفاء زر إضافة مشروع =====
    const addProjectBtn = document.getElementById('addProjectBtn');
    if (addProjectBtn) {
        if (currentUser.status === 'Admin') {
            addProjectBtn.style.display = 'inline-flex';
             // إضافة حدث النقر
           
        } else {
            addProjectBtn.style.display = 'none';
        }
    }

    buildNav();
    loadDashboard();
    loadProjects();
    if (currentUser.status === 'Admin') loadUsers();
}
// ---- التنقل ----
function buildNav() {
    const nav = document.getElementById('topNav');
    if (!nav) return;

    // بناء الأزرار
    const items = [
        { id: 'dashBtn', label: '🏠 الرئيسية', section: 'dashboardSection' },
        { id: 'projBtn', label: '📁 المشاريع', section: 'projectsSection' },
        { id: 'reportBtn', label: '📊 التقارير', section: 'reportsSection' },
    ];
    
    let html = items.map(i =>
        `<button class="nav-btn" data-section="${i.section}" id="${i.id}">${i.label}</button>`
    ).join('');

    // زر إدارة المستخدمين للأدمن فقط
    if (currentUser && currentUser.status === 'Admin') {
        html += `<button class="nav-btn" id="usersPageBtn" onclick="window.location.href='/users.html'">👥 إدارة المستخدمين</button>`;
    }

    nav.innerHTML = html;

    // أحداث التنقل
    nav.querySelectorAll('.nav-btn[data-section]').forEach(btn => {
        btn.addEventListener('click', function() {
            nav.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            document.querySelectorAll('.section').forEach(s => s.classList.add('hidden'));
            const section = document.getElementById(this.dataset.section);
            if (section) {
                section.classList.remove('hidden');
                if (this.dataset.section === 'reportsSection') {
                    populateReportFilters();
                }
            }
        });
    });

    // تفعيل الزر الأول
    const firstBtn = nav.querySelector('.nav-btn[data-section]');
    if (firstBtn) firstBtn.classList.add('active');
}
// ---- لوحة التحكم ----
async function loadDashboard() {
    const res = await api.getStats();
    if (!res.success) {
        console.error('❌ فشل تحميل الإحصائيات:', res.message);
        return;
    }
    const d = res.data;
    document.getElementById('statTotal').textContent = d.total || 0;
    let newC=0, onC=0, stC=0, doneC=0;
    if (d.byStatus && d.byStatus.length) {
        d.byStatus.forEach(s => {
            if (s.status==='جديد')   newC  = s.cnt || 0;
            if (s.status==='مستمر')  onC   = s.cnt || 0;
            if (s.status==='متوقف')  stC   = s.cnt || 0;
            if (s.status==='منجز')   doneC = s.cnt || 0;
        });
    }
    document.getElementById('statNew').textContent     = newC;
    document.getElementById('statOngoing').textContent = onC;
    document.getElementById('statStopped').textContent = stC;
    document.getElementById('statDone').textContent    = doneC;
    document.getElementById('statMsgs').textContent    = d.unreadMessages || 0;
    
    // تحديث عداد الرسائل في الجدول أيضاً
    loadProjects();
}

// ---- المشاريع ----
async function loadProjects() {
    const res = await api.getProjects();
    if (!res.success) { showToast(res.message, 'error'); return; }
    allProjects = res.data;
    renderProjects(allProjects);
    // ===== تعبئة فلاتر التقارير =====
    populateReportFilters();
}

function renderProjects(list) {
  const tbody = document.getElementById('projectsBody');
  if (!list.length) {
    tbody.innerHTML = '<tr><td colspan="9" class="loading-row">لا توجد مشاريع</td></tr>';
    return;
  }
  tbody.innerHTML = list.map((p, i) => `
    <tr>
      <td class="text-muted text-sm">${i+1}</td>
      <td><strong>${esc(p.project_name)}</strong></td>
      <td>${esc(p.implementing_party||'-')}</td>
      <td>${esc(p.commissioning_party||'-')}</td>
      <td class="text-sm">${p.start_date ? p.start_date.slice(0,10) : '-'}</td>
      <td>${esc(p.assigned_user_name||'-')}</td>
      <td>${statusBadge(p.status)}</td>
      <td>${p.unread_messages > 0 ? `<span class="msg-badge">✉ ${p.unread_messages}</span>` : '-'}</td>
      <td>
        <button class="btn btn-sm btn-ghost" onclick="openProjectModal(${p.id})">فتح</button>
        ${currentUser.status==='Admin' ? `<button class="btn btn-sm btn-danger" style="margin-right:4px" onclick="deleteProject(${p.id})">حذف</button>` : ''}
      </td>
    </tr>
  `).join('');
}

function filterProjects() {
  const q = document.getElementById('searchInput').value.toLowerCase();
  const st = document.getElementById('filterStatus').value;
  const filtered = allProjects.filter(p => {
    const matchQ = !q || p.project_name.toLowerCase().includes(q) ||
      (p.implementing_party||'').toLowerCase().includes(q) ||
      (p.commissioning_party||'').toLowerCase().includes(q) ||
      (p.assigned_user_name||'').toLowerCase().includes(q);
    const matchSt = !st || p.status === st;
    return matchQ && matchSt;
  });
  renderProjects(filtered);
}
// ---- نموذج إضافة مشروع جديد ----
function renderNewProjectModal() {
    const modalBody = document.getElementById('projectModalBody');
    if (!modalBody) return;
    
    modalBody.innerHTML = `
        <form id="newProjectForm">
            <div class="form-row">
                <div class="form-group">
                    <label>اسم المشروع / موضوع المتابعة *</label>
                    <input type="text" name="project_name" required placeholder="أدخل اسم المشروع">
                </div>
                <div class="form-group">
                    <label>العاجلية</label>
                    <select name="urgency">
                        <option value="عادي">عادي</option>
                        <option value="عاجل">عاجل</option>
                        <option value="سري">سري</option>
                    </select>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>الجهة المنفذة</label>
                    <input type="text" name="implementing_party" placeholder="اسم الجهة المنفذة">
                </div>
                <div class="form-group">
                    <label>جهة التكليف</label>
                    <input type="text" name="commissioning_party" placeholder="جهة التكليف">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>تاريخ بدء التكليف</label>
                    <input type="date" name="start_date">
                </div>
                <div class="form-group">
                    <label>المدة (شهر)</label>
                    <input type="number" name="duration_months" value="0" min="0">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>تاريخ الإنجاز المتوقع</label>
                    <input type="date" name="completion_date">
                </div>
                <div class="form-group">
                    <label>المكلف بالمتابعة</label>
                    <select name="assigned_user_id">
                        <option value="">-- اختر المكلف --</option>
                        ${allUsers && allUsers.length ? allUsers.filter(u => u.status !== 'Admin').map(u => `<option value="${u.id}">${esc(u.full_name)}</option>`).join('') : ''}
                    </select>
                </div>
            </div>
            <p class="form-divider-label">بيانات الوارد والكتاب</p>
            <div class="form-row-3">
                <div class="form-group">
                    <label>رقم الوارد</label>
                    <input type="text" name="ward_number">
                </div>
                <div class="form-group">
                    <label>تاريخ الوارد</label>
                    <input type="date" name="ward_date">
                </div>
                <div class="form-group">
                    <label>جهة الوارد</label>
                    <input type="text" name="ward_source">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>رقم الكتاب</label>
                    <input type="text" name="book_number">
                </div>
                <div class="form-group">
                    <label>تاريخ الكتاب</label>
                    <input type="date" name="book_date">
                </div>
            </div>
            <div class="form-group">
                <label>ملاحظات أولية</label>
                <textarea name="notes" rows="3" placeholder="ملاحظات..."></textarea>
            </div>
            <div class="form-actions">
                <button type="submit" class="btn btn-primary">✅ إضافة المشروع</button>
                <button type="button" class="btn btn-ghost" onclick="closeProjectModal()">إلغاء</button>
            </div>
        </form>
    `;
    
    // تسجيل حدث النموذج
    const form = document.getElementById('newProjectForm');
    if (form) {
        // إزالة أي أحداث سابقة
        const newForm = form.cloneNode(true);
        form.parentNode.replaceChild(newForm, form);
        
        newForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const fd = new FormData(e.target);
            const data = Object.fromEntries(fd.entries());
            
            // التحقق من اسم المشروع
            if (!data.project_name || data.project_name.trim() === '') {
                showToast('يرجى إدخال اسم المشروع', 'error');
                return;
            }
            
            const res = await api.addProject(data);
            if (res.success) {
                showToast('تم إضافة المشروع بنجاح', 'success');
                closeProjectModal();
                loadProjects();
                loadDashboard();
            } else {
                showToast(res.message || 'خطأ في إضافة المشروع', 'error');
            }
        });
    }
}

function closeProjectModal() {
    const modal = document.getElementById('projectModal');
    if (modal) {
        modal.classList.add('hidden');
    }
    editingProjectId = null;
}

// ---- التبويبات ----
function switchTab(btn, tabId) {
    const panel = btn.closest('.modal-body');
    if (!panel) return;
    
    panel.querySelectorAll('.modal-tab').forEach(t => t.classList.remove('active'));
    panel.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    
    const tabContent = document.getElementById(tabId);
    if (tabContent) {
        tabContent.classList.add('active');
    }
    
    // إذا كان التبويب هو المرفقات، قم بتحميلها
    if (tabId === 'tabAttach' && editingProjectId) {
        loadAttachments(editingProjectId);
    }
}

function renderProjectModal(p, descs, msgs, atts = []) {
    console.log('🎨 جاري عرض المودال للمشروع:', p);
    console.log('📝 الملاحظات:', descs);
    console.log('✉️ الرسائل:', msgs);
    console.log('📎 المرفقات:', atts);
    
    const modalBody = document.getElementById('projectModalBody');
    if (!modalBody) {
        console.error('❌ projectModalBody غير موجود');
        return;
    }

    if (!p || !p.id) {
        console.error('❌ بيانات المشروع غير صالحة:', p);
        modalBody.innerHTML = `<div style="text-align:center;padding:40px;color:var(--danger);">❌ بيانات المشروع غير صالحة</div>`;
        return;
    }

    try {
        const isAdmin = currentUser && currentUser.status === 'Admin';
        const unreadMsgs = msgs ? msgs.filter(m => !m.is_read) : [];
        
        // ===== تحديد إذا كان المستخدم هو المكلف =====
        const isAssigned = currentUser && p.assigned_user_id === currentUser.id;
        
        // ===== المكلف يمكنه تغيير الحالة من "جديد" إلى "مستمر" فقط =====
        const canChangeStatus = isAdmin || (isAssigned && p.status === 'جديد');

        modalBody.innerHTML = `
            <div class="modal-tabs">
                <button class="modal-tab active" onclick="switchTab(this,'tabInfo')">📋 بيانات المشروع</button>
                <button class="modal-tab" onclick="switchTab(this,'tabNotes')">📝 الوصف والملاحظات</button>
                <button class="modal-tab" onclick="switchTab(this,'tabMsg')">
                    ✉ البريد ${unreadMsgs.length > 0 ? `<span class="msg-badge" style="margin-right:6px">${unreadMsgs.length}</span>` : ''}
                </button>
                <button class="modal-tab" onclick="switchTab(this,'tabAttach');loadAttachments(${p.id})">
                    📎 المرفقات ${atts && atts.length > 0 ? `<span class="msg-badge" style="margin-right:6px;background:var(--info)">${atts.length}</span>` : ''}
                </button>
            </div>

            <!-- تبويب: بيانات المشروع -->
            <div class="tab-content active" id="tabInfo">
                <form id="editProjectForm">
                    <div class="form-row">
                        <div class="form-group">
                            <label>اسم المشروع / موضوع المتابعة</label>
                            <input type="text" name="project_name" value="${esc(p.project_name)}" ${!isAdmin?'readonly':''} required>
                        </div>
                        <div class="form-group">
                            <label>الحالة</label>
                            <select name="status" ${!canChangeStatus ? 'disabled' : ''}>
                                <option value="جديد"  ${p.status==='جديد' ?'selected':''}>جديد</option>
                                <option value="مستمر" ${p.status==='مستمر'?'selected':''}>مستمر</option>
                                <option value="متوقف" ${p.status==='متوقف'?'selected':''}>متوقف</option>
                                <option value="منجز"  ${p.status==='منجز' ?'selected':''}>منجز</option>
                            </select>
                            ${!isAdmin && isAssigned && p.status === 'جديد' ? '<small style="color:var(--info);display:block;margin-top:4px;">ℹ️ يمكنك تغيير الحالة إلى "مستمر" عند بدء المتابعة</small>' : ''}
                            ${!isAdmin && !isAssigned ? '<small style="color:var(--text-muted);display:block;margin-top:4px;">⚠️ ليس لديك صلاحية تغيير الحالة</small>' : ''}
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>الجهة المنفذة</label>
                            <input type="text" name="implementing_party" value="${esc(p.implementing_party||'')}" ${!isAdmin?'readonly':''}>
                        </div>
                        <div class="form-group">
                            <label>جهة التكليف</label>
                            <input type="text" name="commissioning_party" value="${esc(p.commissioning_party||'')}" ${!isAdmin?'readonly':''}>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>تاريخ بدء التكليف</label>
                            <input type="date" name="start_date" value="${p.start_date ? p.start_date.slice(0,10) : ''}" ${!isAdmin?'readonly':''}>
                        </div>
                        <div class="form-group">
                            <label>العاجلية</label>
                            <select name="urgency" ${!isAdmin?'disabled':''}>
                                <option value="عادي"  ${p.urgency==='عادي' ?'selected':''}>عادي</option>
                                <option value="عاجل"  ${p.urgency==='عاجل' ?'selected':''}>عاجل</option>
                                <option value="سري"   ${p.urgency==='سري'  ?'selected':''}>سري</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>المدة (شهر)</label>
                            <input type="number" name="duration_months" value="${p.duration_months||0}" min="0" ${!isAdmin?'readonly':''}>
                        </div>
                        <div class="form-group">
                            <label>تاريخ الإنجاز المتوقع</label>
                            <input type="date" name="completion_date" value="${p.completion_date ? p.completion_date.slice(0,10) : ''}" ${!isAdmin?'readonly':''}>
                        </div>
                    </div>
                    ${isAdmin ? `
                    <div class="form-group">
                        <label>المكلف بالمتابعة</label>
                        <select name="assigned_user_id">
                            <option value="">-- اختر المكلف --</option>
                            ${allUsers && allUsers.length ? allUsers.map(u=>`<option value="${u.id}" ${p.assigned_user_id==u.id?'selected':''}>${esc(u.full_name)}</option>`).join('') : ''}
                        </select>
                    </div>
                    ` : `<div class="form-group"><label>المكلف بالمتابعة</label><input readonly value="${esc(p.assigned_user_name||'')}"></div>`}

                    <p class="form-divider-label">بيانات الوارد والكتاب</p>
                    <div class="form-row-3">
                        <div class="form-group">
                            <label>رقم الوارد</label>
                            <input type="text" name="ward_number" value="${esc(p.ward_number||'')}" ${!isAdmin?'readonly':''}>
                        </div>
                        <div class="form-group">
                            <label>تاريخ الوارد</label>
                            <input type="date" name="ward_date" value="${p.ward_date ? p.ward_date.slice(0,10) : ''}" ${!isAdmin?'readonly':''}>
                        </div>
                        <div class="form-group">
                            <label>جهة الوارد</label>
                            <input type="text" name="ward_source" value="${esc(p.ward_source||'')}" ${!isAdmin?'readonly':''}>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>رقم الكتاب</label>
                            <input type="text" name="book_number" value="${esc(p.book_number||'')}" ${!isAdmin?'readonly':''}>
                        </div>
                        <div class="form-group">
                            <label>تاريخ الكتاب</label>
                            <input type="date" name="book_date" value="${p.book_date ? p.book_date.slice(0,10) : ''}" ${!isAdmin?'readonly':''}>
                        </div>
                    </div>
                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary">💾 حفظ التعديلات</button>
                        <button type="button" class="btn btn-ghost" onclick="closeProjectModal()">إغلاق</button>
                    </div>
                </form>
            </div>

            <!-- تبويب: الوصف والملاحظات -->
            <div class="tab-content" id="tabNotes">
                <div class="notes-list" id="notesList">
                    ${descs && descs.length ? descs.map(d => `
                        <div class="note-item ${d.description && d.description.startsWith('[رسالة') ? ' note-manager' : ''}">
                            <div class="note-meta">
                                <span class="note-user">${esc(d.entered_by||'')}</span>
                                <span>${d.entry_date ? new Date(d.entry_date).toLocaleString('ar-IQ') : ''}</span>
                            </div>
                            <div class="note-text">${esc(d.description)}</div>
                        </div>
                    `).join('') : '<div class="empty-state">لا توجد ملاحظات بعد</div>'}
                </div>
                <div class="form-group">
                    <label>إضافة ملاحظة / متابعة جديدة</label>
                    <textarea id="newNoteText" rows="4" placeholder="اكتب الملاحظة هنا..."></textarea>
                </div>
                <div class="form-actions">
                    <button class="btn btn-primary" onclick="addNote(${p.id})">إضافة الملاحظة</button>
                </div>
            </div>

            <!-- تبويب: البريد -->
            <div class="tab-content" id="tabMsg">
                <div id="msgList">
                    ${msgs && msgs.length ? msgs.map(m => `
                        <div class="msg-item ${m.is_read ? ' read' : ''}" id="msg_${m.id}">
                            <div class="note-meta">
                                <span class="note-user">${esc(m.sent_by||'')}</span>
                                <span>${m.created_at ? new Date(m.created_at).toLocaleString('ar-IQ') : ''}</span>
                                ${m.is_read ? '<span style="color:var(--success)">✓ مقروءة</span>' : '<span style="color:var(--warning)">⚠ جديدة</span>'}
                            </div>
                            <div class="note-text">${esc(m.message)}</div>
                            ${!m.is_read && !isAdmin ? `<div style="margin-top:10px"><button class="btn btn-sm btn-success" onclick="readMsg(${p.id},${m.id})">✓ قراءة الرسالة</button></div>` : ''}
                        </div>
                    `).join('') : '<div class="empty-state">لا توجد رسائل</div>'}
                </div>
                ${isAdmin ? `
                    <hr style="border-color:var(--border);margin:20px 0">
                    <div class="form-group">
                        <label>إرسال رسالة جديدة إلى المكلف</label>
                        <textarea id="newMsgText" rows="3" placeholder="اكتب الرسالة..."></textarea>
                    </div>
                    <div class="form-actions">
                        <button class="btn btn-primary" onclick="sendMsg(${p.id})">إرسال الرسالة ✉</button>
                    </div>
                ` : ''}
            </div>

            <!-- تبويب: المرفقات -->
            <div class="tab-content" id="tabAttach">
                <div id="attachList" style="margin-bottom:20px">
                    ${atts && atts.length ? atts.map(a => `
                        <div class="attach-item" id="att_${a.id}">
                            <div class="attach-icon">${getFileIcon(a.file_type)}</div>
                            <div class="attach-info">
                                <div class="attach-name">${esc(a.file_name)}</div>
                                <div class="attach-meta">${formatSize(a.file_size)} · ${esc(a.uploaded_by||'')} · ${a.uploaded_at ? new Date(a.uploaded_at).toLocaleDateString('ar-IQ') : ''}</div>
                            </div>
                            <div class="attach-actions">
                                <button class="btn btn-sm btn-ghost" onclick="viewAttachment(${p.id},${a.id})">👁 عرض</button>
                                ${isAdmin ? `<button class="btn btn-sm btn-danger" onclick="deleteAttachment(${p.id},${a.id})">🗑</button>` : ''}
                            </div>
                        </div>
                    `).join('') : '<div class="empty-state" id="attachEmpty">لا توجد مرفقات</div>'}
                </div>
                <div style="border:2px dashed var(--border);border-radius:var(--radius);padding:20px;text-align:center">
                    <input type="file" id="fileInput" style="display:none" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx" onchange="uploadAttachment(${p.id})">
                    <button class="btn btn-primary" onclick="document.getElementById('fileInput').click()">📎 رفع ملف أو صورة</button>
                    <div style="color:var(--text-muted);font-size:.8rem;margin-top:8px">صور، PDF، Word، Excel — بحد أقصى 10MB</div>
                    <div id="uploadProgress" style="display:none;margin-top:10px;color:var(--info)">جارٍ الرفع...</div>
                </div>
            </div>
        `;

        // تسجيل أحداث النموذج
        const editForm = document.getElementById('editProjectForm');
        if (editForm) {
            const newForm = editForm.cloneNode(true);
            editForm.parentNode.replaceChild(newForm, editForm);
            
            newForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const fd = new FormData(e.target);
                const data = Object.fromEntries(fd.entries());
                
                // ===== إذا كان المستخدم مكلفاً والمشروع بحالة "جديد"، تحويله إلى "مستمر" =====
                if (isAssigned && p.status === 'جديد' && data.status === 'جديد') {
                    data.status = 'مستمر';
                    console.log('🔄 تم تغيير الحالة تلقائياً إلى "مستمر"');
                }
                
                const res = await api.updateProject(p.id, data);
                if (res.success) {
                    showToast('تم حفظ التعديلات', 'success');
                    closeProjectModal();
                    loadProjects();
                    loadDashboard();
                } else {
                    showToast(res.message, 'error');
                }
            });
        }
        
        console.log('✅ تم عرض المودال بنجاح');
    } catch (err) {
        console.error('❌ خطأ في عرض المودال:', err);
        modalBody.innerHTML = `<div style="text-align:center;padding:40px;color:var(--danger);">❌ حدث خطأ في عرض البيانات: ${err.message}</div>`;
    }
}
function renderNewProjectModal() {
  document.getElementById('projectModalBody').innerHTML = `
    <form id="newProjectForm">
      <div class="form-row">
        <div class="form-group">
          <label>اسم المشروع / موضوع المتابعة *</label>
          <input type="text" name="project_name" required placeholder="أدخل اسم المشروع">
        </div>
        <div class="form-group">
          <label>العاجلية</label>
          <select name="urgency">
            <option value="عادي">عادي</option>
            <option value="عاجل">عاجل</option>
            <option value="سري">سري</option>
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>الجهة المنفذة</label>
          <input type="text" name="implementing_party" placeholder="اسم الجهة المنفذة">
        </div>
        <div class="form-group">
          <label>جهة التكليف</label>
          <input type="text" name="commissioning_party" placeholder="جهة التكليف">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>تاريخ بدء التكليف</label>
          <input type="date" name="start_date">
        </div>
        <div class="form-group">
          <label>المدة (شهر)</label>
          <input type="number" name="duration_months" value="0" min="0">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>تاريخ الإنجاز المتوقع</label>
          <input type="date" name="completion_date">
        </div>
        <div class="form-group">
          <label>المكلف بالمتابعة</label>
          <select name="assigned_user_id">
            <option value="">-- اختر المكلف --</option>
            ${allUsers.filter(u=>u.status==='User').map(u=>`<option value="${u.id}">${esc(u.full_name)}</option>`).join('')}
          </select>
        </div>
      </div>
      <p class="form-divider-label">بيانات الوارد والكتاب</p>
      <div class="form-row-3">
        <div class="form-group">
          <label>رقم الوارد</label>
          <input type="text" name="ward_number">
        </div>
        <div class="form-group">
          <label>تاريخ الوارد</label>
          <input type="date" name="ward_date">
        </div>
        <div class="form-group">
          <label>جهة الوارد</label>
          <input type="text" name="ward_source">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>رقم الكتاب</label>
          <input type="text" name="book_number">
        </div>
        <div class="form-group">
          <label>تاريخ الكتاب</label>
          <input type="date" name="book_date">
        </div>
      </div>
      <div class="form-group">
        <label>ملاحظات أولية</label>
        <textarea name="notes" rows="3" placeholder="ملاحظات..."></textarea>
      </div>
      <div class="form-actions">
        <button type="submit" class="btn btn-primary">✅ إضافة المشروع</button>
        <button type="button" class="btn btn-ghost" onclick="closeProjectModal()">إلغاء</button>
      </div>
      
    </form>
  `;
  document.getElementById('newProjectForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const data = Object.fromEntries(fd.entries());
    const res = await api.addProject(data);
    if (res.success) {
      showToast('تم إضافة المشروع بنجاح', 'success');
      closeProjectModal(); loadProjects(); loadDashboard();
    } else showToast(res.message, 'error');
  });
}

function closeProjectModal() {
  document.getElementById('projectModal').classList.add('hidden');
  editingProjectId = null;
}

// ---- التبويبات ----
function switchTab(btn, tabId) {
    console.log('🔄 تبديل التبويب إلى:', tabId);
    
    const panel = btn.closest('.modal-body');
    if (!panel) {
        console.error('❌ لم يتم العثور على modal-body');
        return;
    }
    
    panel.querySelectorAll('.modal-tab').forEach(t => t.classList.remove('active'));
    panel.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    
    const tabContent = document.getElementById(tabId);
    if (tabContent) {
        tabContent.classList.add('active');
        console.log('✅ تم تفعيل التبويب:', tabId);
    } else {
        console.error('❌ التبويب غير موجود:', tabId);
    }
    
    // إذا كان التبويب هو المرفقات، قم بتحميلها
    if (tabId === 'tabAttach' && editingProjectId) {
        loadAttachments(editingProjectId);
    }
}

// ---- ملاحظات ----
async function addNote(pid) {
  const txt = document.getElementById('newNoteText').value.trim();
  if (!txt) { showToast('اكتب الملاحظة أولاً', 'info'); return; }
  const res = await api.addDescription(pid, { description: txt });
  if (res.success) {
    showToast('تم إضافة الملاحظة', 'success');
    openProjectModal(pid); loadDashboard();
  } else showToast(res.message, 'error');
}

// ---- رسائل ----
async function sendMsg(pid) {
  const txt = document.getElementById('newMsgText').value.trim();
  if (!txt) { showToast('اكتب الرسالة أولاً', 'info'); return; }
  const res = await api.sendMessage(pid, { message: txt });
  if (res.success) {
    showToast('تم إرسال الرسالة', 'success');
    openProjectModal(pid);
  } else showToast(res.message, 'error');
}

async function readMsg(pid, mid) {
  const res = await api.readMessage(pid, mid);
  if (res.success) {
    showToast('تمت قراءة الرسالة وإضافتها للوصف', 'success');
    openProjectModal(pid); loadDashboard();
  } else showToast(res.message, 'error');
}

// ---- حذف مشروع ----
async function deleteProject(id) {
  if (!confirm('هل أنت متأكد من حذف هذا المشروع؟')) return;
  const res = await api.deleteProject(id);
  if (res.success) {
    showToast('تم حذف المشروع', 'success');
    loadProjects(); loadDashboard();
  } else showToast(res.message, 'error');
}

// ---- المستخدمون ----
async function loadUsers() {
  const res = await api.getUsers();
  if (!res.success) return;
  allUsers = res.data;
  const tbody = document.getElementById('usersBody');
  if (!tbody) return;
  tbody.innerHTML = allUsers.map((u, i) => `
    <tr>
      <td class="text-muted">${i+1}</td>
      <td>${esc(u.username)}</td>
      <td>${esc(u.full_name||'-')}</td>
      <td><span class="badge ${u.status==='Admin'?'badge-urgent':'badge-normal'}">${u.status==='Admin'?'مدير':'مستخدم'}</span></td>
      <td>
        <button class="btn btn-sm btn-ghost" onclick="openUserModal(${u.id})">تعديل</button>
        <button class="btn btn-sm btn-danger" style="margin-right:4px" onclick="deleteUser(${u.id})">حذف</button>
      </td>
    </tr>
  `).join('');
  populateReportFilters();
}

function openUserModal(id = null) {
  const modal = document.getElementById('userModal');
  modal.classList.remove('hidden');
  document.getElementById('editUserId').value = id || '';
  document.getElementById('userModalTitle').textContent = id ? 'تعديل مستخدم' : 'إضافة مستخدم';
  document.getElementById('uPwdHint').style.display = id ? 'inline' : 'none';

  if (id) {
    const u = allUsers.find(x => x.id == id);
    if (u) {
      document.getElementById('uUsername').value  = u.username;
      document.getElementById('uFullname').value  = u.full_name || '';
      document.getElementById('uStatus').value    = u.status;
      document.getElementById('uPassword').value  = '';
    }
    document.getElementById('uUsername').readOnly = true;
  } else {
    document.getElementById('uUsername').value  = '';
    document.getElementById('uFullname').value  = '';
    document.getElementById('uStatus').value    = 'User';
    document.getElementById('uPassword').value  = '';
    document.getElementById('uUsername').readOnly = false;
  }
}

function closeUserModal() {
  document.getElementById('userModal').classList.add('hidden');
}

async function handleSaveUser(e) {
  e.preventDefault();
  const id   = document.getElementById('editUserId').value;
  const data = {
    username:  document.getElementById('uUsername').value,
    full_name: document.getElementById('uFullname').value,
    password:  document.getElementById('uPassword').value,
    status:    document.getElementById('uStatus').value,
  };
  const res = id ? await api.updateUser(id, data) : await api.addUser(data);
  if (res.success) {
    showToast(res.message, 'success');
    closeUserModal(); loadUsers();
  } else showToast(res.message, 'error');
}

async function deleteUser(id) {
  if (!confirm('حذف هذا المستخدم؟')) return;
  const res = await api.deleteUser(id);
  if (res.success) { showToast('تم الحذف', 'success'); loadUsers(); }
  else showToast(res.message, 'error');
}

// ---- مساعدات ----
function statusBadge(st) {
  const map = { 'جديد':'badge-new','مستمر':'badge-ongoing','متوقف':'badge-stopped','منجز':'badge-done' };
  return `<span class="badge ${map[st]||''}">${st}</span>`;
}

function esc(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

let toastTimer;
function showToast(msg, type='info') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `toast ${type}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.classList.add('hidden'); }, 3500);
}

// ===================================
// دوال المرفقات
// ===================================

async function loadAttachments(pid) {
  const res = await api.getAttachments(pid);
  const list = document.getElementById('attachList');
  if (!list) return;
  const atts = res.data || [];
  if (!atts.length) {
    list.innerHTML = '<div class="empty-state">لا توجد مرفقات</div>';
    return;
  }
  const isAdmin = currentUser.status === 'Admin';
  list.innerHTML = atts.map(a => `
    <div class="attach-item" id="att_${a.id}">
      <div class="attach-icon">${getFileIcon(a.file_type)}</div>
      <div class="attach-info">
        <div class="attach-name">${esc(a.file_name)}</div>
        <div class="attach-meta">${formatSize(a.file_size)} · ${esc(a.uploaded_by||'')} · ${new Date(a.uploaded_at).toLocaleDateString('ar-IQ')}</div>
      </div>
      <div class="attach-actions">
        <button class="btn btn-sm btn-ghost" onclick="viewAttachment(${pid},${a.id})">👁 عرض</button>
        ${isAdmin ? `<button class="btn btn-sm btn-danger" onclick="deleteAttachment(${pid},${a.id})">🗑</button>` : ''}
      </div>
    </div>
  `).join('');
}

async function uploadAttachment(pid) {
  const input    = document.getElementById('fileInput');
  const progress = document.getElementById('uploadProgress');
  if (!input.files.length) return;

  const formData = new FormData();
  formData.append('file', input.files[0]);

  progress.style.display = 'block';
  try {
    const res = await fetch(`/api/projects/${pid}/attachments`, {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + api.token },
      body: formData
    });
    const json = await res.json();
    if (json.success) {
      showToast('تم رفع الملف بنجاح', 'success');
      loadAttachments(pid);
    } else {
      showToast(json.message, 'error');
    }
  } catch (err) {
    showToast('فشل الرفع: ' + err.message, 'error');
  } finally {
    progress.style.display = 'none';
    input.value = '';
  }
}

function viewAttachment(pid, aid) {
  window.open(`/api/projects/${pid}/attachments/${aid}/view?token=${api.token}`, '_blank');
}

async function deleteAttachment(pid, aid) {
  if (!confirm('حذف هذا المرفق؟')) return;
  const res = await fetch(`/api/projects/${pid}/attachments/${aid}`, {
    method: 'DELETE',
    headers: { 'Authorization': 'Bearer ' + api.token }
  });
  const json = await res.json();
  if (json.success) {
    showToast('تم حذف المرفق', 'success');
    document.getElementById(`att_${aid}`)?.remove();
  } else {
    showToast(json.message, 'error');
  }
}

function getFileIcon(type) {
  if (!type) return '📄';
  if (type.startsWith('image/'))       return '🖼';
  if (type === 'application/pdf')      return '📕';
  if (type.includes('word'))           return '📘';
  if (type.includes('excel') || type.includes('sheet')) return '📗';
  return '📄';
}

function formatSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024)        return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

       // =============================================
// دوال التقارير
// =============================================

let reportData = [];

// ---- تعبئة فلاتر التقارير ----
function populateReportFilters() {
    console.log('🔄 جاري تعبئة فلاتر التقارير...');
    
    const projectSelect = document.getElementById('filterProjectName');
    if (projectSelect) {
        projectSelect.innerHTML = '<option value="">-- جميع المشاريع --</option>';
        if (allProjects && allProjects.length) {
            allProjects.forEach(p => {
                if (p.project_name) {
                    projectSelect.innerHTML += `<option value="${esc(p.project_name)}">${esc(p.project_name)}</option>`;
                }
            });
        }
    }

    const userSelect = document.getElementById('filterAssignedUser');
    if (userSelect) {
        userSelect.innerHTML = '<option value="">-- جميع المكلفين --</option>';
        if (allUsers && allUsers.length) {
            allUsers.forEach(u => {
                if (u.full_name) {
                    userSelect.innerHTML += `<option value="${esc(u.full_name)}">${esc(u.full_name)}</option>`;
                }
            });
        }
    }
}

// ---- عرض التقرير ----
async function generateReport() {
    const projectName = document.getElementById('filterProjectName').value;
    const assignedUser = document.getElementById('filterAssignedUser').value;
    const status = document.getElementById('filterStatus').value;
    const dateFrom = document.getElementById('filterDateFrom').value;
    const dateTo = document.getElementById('filterDateTo').value;

    console.log('🔍 generateReport - بدء التنفيذ');
    console.log('📊 الفلاتر:', { projectName, assignedUser, status, dateFrom, dateTo });

    let filtered = [...allProjects];

    if (projectName) {
        filtered = filtered.filter(p => p.project_name === projectName);
    }
    if (assignedUser) {
        filtered = filtered.filter(p => p.assigned_user_name === assignedUser);
    }
    if (status) {
        filtered = filtered.filter(p => p.status === status);
    }
    if (dateFrom) {
        filtered = filtered.filter(p => p.start_date && p.start_date >= dateFrom);
    }
    if (dateTo) {
        filtered = filtered.filter(p => p.start_date && p.start_date <= dateTo);
    }

    console.log('📋 عدد المشاريع بعد الفلترة:', filtered.length);

    // جلب الملاحظات لكل مشروع
    for (const p of filtered) {
        try {
            const descRes = await api.getDescriptions(p.id);
            if (descRes.success) {
                p.descriptions = descRes.data.filter(d => {
                    const desc = d.description || '';
                    return !desc.includes('[رسالة') && 
                           !desc.includes('رسالة من') &&
                           !desc.includes('رسالة المدير') &&
                           !desc.includes('رسالة إدارة') &&
                           !desc.startsWith('رسالة');
                });
                p.descriptions.sort((a, b) => new Date(b.entry_date) - new Date(a.entry_date));
            } else {
                p.descriptions = [];
            }
        } catch (e) {
            p.descriptions = [];
        }
    }

    reportData = filtered;
    const isSingle = projectName !== '' && filtered.length === 1;
    
    console.log('📊 isSingle:', isSingle);
    console.log('📊 typeof renderReport:', typeof renderReport);
    
    // استدعاء الدالة من reports.html
    if (typeof renderReport === 'function') {
        console.log('✅ استدعاء renderReport');
        renderReport(filtered, isSingle);
    } else {
        console.error('❌ دالة renderReport غير معرفة');
        showToast('خطأ: دالة عرض التقرير غير موجودة', 'error');
        
        // عرض رسالة خطأ في المكان
        const body = document.getElementById('reportBody');
        if (body) {
            body.innerHTML = `
                <div style="text-align:center;padding:40px;color:var(--danger);">
                    <span style="font-size:3rem;display:block;margin-bottom:12px;">❌</span>
                    حدث خطأ في تحميل التقارير. يرجى تحديث الصفحة.
                </div>
            `;
        }
    }
}
// =============================================
// دوال عرض التقارير (منقولة من reports.html)
// =============================================

// ---- عرض نتائج التقرير ----
function renderReport(projects, isSingle = false) {
    const body = document.getElementById('reportBody');
    const count = document.getElementById('reportCount');

    if (!projects || !projects.length) {
        body.innerHTML = `<div class="no-results" style="text-align:center;padding:48px 20px;color:var(--text-muted);">
            <span style="font-size:3rem;display:block;margin-bottom:12px;">📋</span>
            لا توجد مشاريع تطابق الفلاتر المحددة
        </div>`;
        count.textContent = '0 مشروع';
        updatePrintButton(false);
        return;
    }

    count.textContent = `${projects.length} مشروع`;
    updatePrintButton(true);

    let html = '';

    if (isSingle) {
        const p = projects[0];
        html += renderSingleProjectReport(p);
    } else {
        html += renderMultipleProjectsReport(projects);
    }

    body.innerHTML = html;
}

// ---- تقرير مفرد (مشروع واحد) ----
function renderSingleProjectReport(p) {
    const descs = p.descriptions || [];
    
    let durationText = '';
    if (p.start_date && p.completion_date) {
        const start = new Date(p.start_date);
        const end = new Date(p.completion_date);
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        durationText = `${diffDays} يوم`;
    } else if (p.duration_months) {
        durationText = `${p.duration_months} شهر`;
    } else {
        durationText = '-';
    }
    
    return `
        <div class="report-single" style="direction:rtl;font-family:'Tajawal',sans-serif;padding:15px;background:#fff;border-radius:8px;margin:0;">
            <div style="text-align:center;border-bottom:2px solid #1a1a2e;padding-bottom:12px;margin-bottom:15px;">
                <h1 style="font-size:22px;font-weight:700;color:#1a1a2e;margin:0;">نظام المتابعة المركزية</h1>
            </div>
            <div style="border:2px solid #1a1a2e;border-radius:8px;padding:15px;margin-bottom:15px;">
                <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px 20px;font-size:13px;">
                    <div style="display:flex;align-items:center;gap:6px;padding:4px 0;border-bottom:1px solid #eee;">
                        <span style="font-weight:700;color:#1a1a2e;min-width:100px;">اسم المشروع :</span>
                        <span style="font-weight:500;color:#333;">${esc(p.project_name)}</span>
                    </div>
                    <div style="display:flex;align-items:center;gap:6px;padding:4px 0;border-bottom:1px solid #eee;">
                        <span style="font-weight:700;color:#1a1a2e;min-width:100px;">جهة التكليف :</span>
                        <span style="font-weight:500;color:#333;">${esc(p.commissioning_party || '-')}</span>
                    </div>
                    <div style="display:flex;align-items:center;gap:6px;padding:4px 0;border-bottom:1px solid #eee;">
                        <span style="font-weight:700;color:#1a1a2e;min-width:100px;">جهة التنفيذ :</span>
                        <span style="font-weight:500;color:#333;">${esc(p.implementing_party || '-')}</span>
                    </div>
                    <div style="display:flex;align-items:center;gap:6px;padding:4px 0;border-bottom:1px solid #eee;">
                        <span style="font-weight:700;color:#1a1a2e;min-width:100px;">تاريخ بدء المشروع :</span>
                        <span style="font-weight:500;color:#333;">${p.start_date ? p.start_date.slice(0,10) : '-'}</span>
                    </div>
                    <div style="display:flex;align-items:center;gap:6px;padding:4px 0;border-bottom:1px solid #eee;">
                        <span style="font-weight:700;color:#1a1a2e;min-width:100px;">نوع المشروع :</span>
                        <span style="font-weight:500;color:#333;">${esc(p.urgency || 'عادي')}</span>
                    </div>
                    <div style="display:flex;align-items:center;gap:6px;padding:4px 0;border-bottom:1px solid #eee;">
                        <span style="font-weight:700;color:#1a1a2e;min-width:100px;">مدة الإنجاز :</span>
                        <span style="font-weight:500;color:#333;">${durationText}</span>
                    </div>
                </div>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:6px 15px;font-size:12px;padding:10px 14px;background:#f8f9fa;border-radius:6px;margin-bottom:15px;border:1px solid #eee;">
                <div><span style="font-weight:600;color:#555;">الحالة:</span> ${statusBadge(p.status)}</div>
                <div><span style="font-weight:600;color:#555;">المكلف:</span> ${esc(p.assigned_user_name || '-')}</div>
                <div><span style="font-weight:600;color:#555;">تاريخ الإنجاز:</span> ${p.completion_date ? p.completion_date.slice(0,10) : '-'}</div>
                <div><span style="font-weight:600;color:#555;">رقم الوارد:</span> ${esc(p.ward_number || '-')}</div>
                <div><span style="font-weight:600;color:#555;">تاريخ الوارد:</span> ${p.ward_date ? p.ward_date.slice(0,10) : '-'}</div>
                <div><span style="font-weight:600;color:#555;">جهة الوارد:</span> ${esc(p.ward_source || '-')}</div>
                <div><span style="font-weight:600;color:#555;">رقم الكتاب:</span> ${esc(p.book_number || '-')}</div>
                <div><span style="font-weight:600;color:#555;">تاريخ الكتاب:</span> ${p.book_date ? p.book_date.slice(0,10) : '-'}</div>
            </div>
            <div style="border:2px solid #1a1a2e;border-radius:8px;overflow:hidden;">
                <table style="width:100%;border-collapse:collapse;font-size:12px;">
                    <thead>
                        <tr style="background:#1a1a2e;color:#fff;">
                            <th style="padding:8px 14px;text-align:center;font-weight:700;width:25%;">تاريخ الوصف</th>
                            <th style="padding:8px 14px;text-align:center;font-weight:700;width:75%;">الوصف</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${descs.length ? descs.map((d, index) => `
                            <tr style="border-bottom:1px solid #ddd;${index % 2 === 0 ? 'background:#fff;' : 'background:#f8f9fa;'}">
                                <td style="padding:8px 14px;text-align:center;vertical-align:middle;font-weight:500;color:#333;">${d.entry_date ? new Date(d.entry_date).toLocaleString('ar-IQ') : ''}</td>
                                <td style="padding:8px 14px;vertical-align:middle;line-height:1.6;color:#333;text-align:right;">${esc(d.description)}</td>
                            </tr>
                        `).join('') : `
                            <tr>
                                <td colspan="2" style="padding:25px;text-align:center;color:#999;">لا توجد ملاحظات أو وصف لهذا المشروع</td>
                            </tr>
                        `}
                    </tbody>
                </table>
            </div>
            <div style="text-align:center;margin-top:15px;padding-top:10px;border-top:1px solid #ddd;font-size:10px;color:#999;">
                تم إنشاء هذا التقرير بواسطة نظام المتابعة المركزية - ${new Date().toLocaleDateString('ar-IQ', {year:'numeric', month:'long', day:'numeric'})}
            </div>
        </div>
    `;
}

// ---- تقرير شامل (جميع المشاريع) ----
function renderMultipleProjectsReport(projects) {
    let html = `
        <div style="padding:10px;margin:0;background:#fff;">
            <div style="text-align:center;border-bottom:2px solid #1a1a2e;padding-bottom:10px;margin-bottom:15px;">
                <h1 style="font-size:20px;font-weight:700;color:#1a1a2e;margin:0;">نظام المتابعة المركزية - تقرير شامل</h1>
                <div style="font-size:12px;color:#666;margin-top:4px;">${new Date().toLocaleDateString('ar-IQ', {year:'numeric', month:'long', day:'numeric'})}</div>
            </div>
            <div style="overflow-x:auto;">
                <table style="width:100%;border-collapse:collapse;font-size:11px;border:1px solid #ddd;">
                    <thead>
                        <tr style="background:#1a1a2e;color:#fff;">
                            <th style="padding:6px 10px;text-align:center;font-weight:600;border:1px solid #333;">#</th>
                            <th style="padding:6px 10px;text-align:center;font-weight:600;border:1px solid #333;">اسم المشروع</th>
                            <th style="padding:6px 10px;text-align:center;font-weight:600;border:1px solid #333;">جهة التكليف</th>
                            <th style="padding:6px 10px;text-align:center;font-weight:600;border:1px solid #333;">الجهة المنفذة</th>
                            <th style="padding:6px 10px;text-align:center;font-weight:600;border:1px solid #333;">فترة الإنجاز</th>
                            <th style="padding:6px 10px;text-align:center;font-weight:600;border:1px solid #333;">تاريخ البدء</th>
                            <th style="padding:6px 10px;text-align:center;font-weight:600;border:1px solid #333;">الوصف / الملاحظات</th>
                        </tr>
                    </thead>
                    <tbody>
    `;

    projects.forEach((p, index) => {
        const descs = p.descriptions || [];
        descs.sort((a, b) => new Date(b.entry_date) - new Date(a.entry_date));
        
        let notesText = '';
        if (descs.length) {
            notesText = descs.map(d => 
                `${esc(d.description)}<br><span style="color:#888;font-size:10px;">📅 ${d.entry_date ? new Date(d.entry_date).toLocaleString('ar-IQ') : ''}</span>`
            ).join('<br><br>');
        } else {
            notesText = '<span style="color:#999;font-size:11px;">لا توجد ملاحظات</span>';
        }

        let period = '-';
        if (p.start_date && p.completion_date) {
            const start = new Date(p.start_date);
            const end = new Date(p.completion_date);
            const diffTime = Math.abs(end - start);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            period = `${diffDays} يوم`;
        } else if (p.duration_months) {
            period = `${p.duration_months} شهر`;
        }

        html += `
            <tr style="border-bottom:1px solid #ddd;${index % 2 === 0 ? 'background:#fff;' : 'background:#f9f9f9;'}">
                <td style="padding:6px 10px;text-align:center;border:1px solid #ddd;vertical-align:top;">${index + 1}</td>
                <td style="padding:6px 10px;text-align:center;border:1px solid #ddd;vertical-align:top;font-weight:600;">${esc(p.project_name)}</td>
                <td style="padding:6px 10px;text-align:center;border:1px solid #ddd;vertical-align:top;">${esc(p.commissioning_party || '-')}</td>
                <td style="padding:6px 10px;text-align:center;border:1px solid #ddd;vertical-align:top;">${esc(p.implementing_party || '-')}</td>
                <td style="padding:6px 10px;text-align:center;border:1px solid #ddd;vertical-align:top;">${period}</td>
                <td style="padding:6px 10px;text-align:center;border:1px solid #ddd;vertical-align:top;">${p.start_date ? p.start_date.slice(0,10) : '-'}</td>
                <td style="padding:6px 10px;border:1px solid #ddd;vertical-align:top;max-width:250px;word-wrap:break-word;line-height:1.5;text-align:right;">${notesText}</td>
            </tr>
        `;
    });

    html += `
                    </tbody>
                </table>
            </div>
            <div style="text-align:center;margin-top:12px;padding-top:8px;border-top:1px solid #ddd;font-size:10px;color:#999;">
                تم إنشاء هذا التقرير بواسطة نظام المتابعة المركزية - عدد المشاريع: ${projects.length}
            </div>
        </div>
    `;

    return html;
}
// ---- تبديل تفاصيل التقرير ----
function toggleReportDetails(btn) {
    const details = btn.closest('div').querySelector('.report-details');
    if (details) {
        if (details.style.display === 'none' || details.style.display === '') {
            details.style.display = 'block';
            btn.textContent = '📋 إخفاء التفاصيل';
        } else {
            details.style.display = 'none';
            btn.textContent = '📋 عرض التفاصيل';
        }
    }
}

// ---- إعادة تعيين الفلاتر ----
function resetFilters() {
    document.getElementById('filterProjectName').value = '';
    document.getElementById('filterAssignedUser').value = '';
    document.getElementById('filterStatus').value = '';
    document.getElementById('filterDateFrom').value = '';
    document.getElementById('filterDateTo').value = '';
    document.getElementById('reportBody').innerHTML = `
        <div class="no-results" style="text-align:center;padding:48px 20px;color:var(--text-muted);">
            <span style="font-size:3rem;display:block;margin-bottom:12px;">📋</span>
            اختر الفلاتر ثم اضغط "عرض التقرير"
        </div>
    `;
    document.getElementById('reportCount').textContent = '0 مشروع';
    reportData = [];
    updatePrintButton(false);
}

// ---- طباعة التقرير ----
function printReport() {
    console.log('🖨️ جاري طباعة التقرير...');
    
    // ===== إزالة أي عناصر إضافية قبل الطباعة =====
    // إزالة أي print-header موجود
    const headers = document.querySelectorAll('.print-header, .print-footer, .print-title');
    headers.forEach(el => {
        if (el) el.remove();
    });
    
    // إخفاء زر الطباعة
    const printBtn = document.getElementById('printReportBtn');
    if (printBtn) {
        printBtn.style.display = 'none';
    }
    
    // إخفاء جميع العناصر غير المرغوب فيها
    document.querySelectorAll('.no-print, .report-filters, .filter-actions, .topbar, .topbar-simple').forEach(el => {
        el.style.display = 'none';
    });
    
    // التأكد من أن report-body يحتوي فقط على المحتوى
    const reportBody = document.getElementById('reportBody');
    if (reportBody) {
        // إزالة أي عناصر فارغة أو إضافية
        const children = reportBody.children;
        for (let i = 0; i < children.length; i++) {
            if (children[i].innerHTML.trim() === '' || children[i].classList.contains('print-header')) {
                children[i].remove();
                i--;
            }
        }
    }
    
    // طباعة الصفحة
    window.print();
    
    // إعادة كل شيء بعد الطباعة
    setTimeout(() => {
        // إعادة إظهار العناصر
        document.querySelectorAll('.no-print, .report-filters, .filter-actions, .topbar, .topbar-simple').forEach(el => {
            el.style.display = '';
        });
        
        if (printBtn) {
            printBtn.style.display = 'inline-flex';
        }
        
        console.log('✅ تم الانتهاء من الطباعة');
    }, 1500);
}

// ---- تحديث زر الطباعة ----
function updatePrintButton(hasResults) {
    const printBtn = document.getElementById('printReportBtn');
    if (printBtn) {
        if (hasResults && reportData && reportData.length > 0) {
            printBtn.style.display = 'inline-flex';
        } else {
            printBtn.style.display = 'none';
        }
    }
}