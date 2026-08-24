// ===================================
// مساعد API - التواصل مع الخادم
// ===================================

const API_BASE = '/api';  // تأكد من أن هذا هو المسار الصحيح

const api = {
    token: localStorage.getItem('pm_token'),

    setToken(t) {
        this.token = t;
        if (t) localStorage.setItem('pm_token', t);
        else localStorage.removeItem('pm_token');
    },

    async request(method, endpoint, data = null) {
        try {
            const opts = {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    ...(this.token ? { 'Authorization': 'Bearer ' + this.token } : {})
                }
            };
            if (data && method !== 'GET') opts.body = JSON.stringify(data);

            const url = API_BASE + endpoint;
            console.log('📡 طلب:', method, url);  // إضافة تصحيح
            
            const res = await fetch(url, opts);
            console.log('📡 استجابة:', res.status, res.statusText);
            
            const json = await res.json();

            if (res.status === 403 && json.message?.includes('منتهية')) {
                api.setToken(null);
                window.location.reload();
            }
            return json;
        } catch (err) {
            console.error('❌ فشل الطلب:', err.message);
            return { success: false, message: err.message };
        }
    },

    get:    (ep)       => api.request('GET',    ep),
    post:   (ep, data) => api.request('POST',   ep, data),
    put:    (ep, data) => api.request('PUT',    ep, data),
    delete: (ep)       => api.request('DELETE', ep),

    // Auth
    login:      (u, p) => api.post('/auth/login', { username: u, password: p }),
    getUsers:   ()     => api.get('/auth/users'),
    addUser:    (d)    => api.post('/auth/users', d),
    updateUser: (id,d) => api.put(`/auth/users/${id}`, d),
    deleteUser: (id)   => api.delete(`/auth/users/${id}`),

    // Projects
    getProjects:     ()     => api.get('/projects'),
    getProject:      (id)   => api.get(`/projects/${id}`),
    addProject:      (d)    => api.post('/projects', d),
    updateProject:   (id,d) => api.put(`/projects/${id}`, d),
    deleteProject:   (id)   => api.delete(`/projects/${id}`),
    getStats:        ()     => api.get('/projects/stats/dashboard'),

    // Descriptions
    getDescriptions: (pid)  => api.get(`/projects/${pid}/descriptions`),
    addDescription:  (pid,d)=> api.post(`/projects/${pid}/descriptions`, d),

    // Messages
    getMessages:     (pid)  => api.get(`/projects/${pid}/messages`),
    sendMessage:     (pid,d)=> api.post(`/projects/${pid}/messages`, d),
    readMessage:     (pid, mid) => api.put(`/projects/${pid}/messages/${mid}/read`, {}),

    // Attachments
    getAttachments:  (pid)      => api.get(`/projects/${pid}/attachments`),
    deleteAttachment:(pid, aid) => api.delete(`/projects/${pid}/attachments/${aid}`),
};