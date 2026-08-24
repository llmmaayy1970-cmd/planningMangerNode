const express = require('express');
const router = express.Router();
const { query, queryOne } = require('../db');
const { authMiddleware } = require('../middleware/auth');

// ===== GET /api/projects =====
router.get('/', authMiddleware, async (req, res) => {
    try {
        let queryText = `
            SELECT p.*, u.full_name as assigned_user_name,
                   (SELECT COUNT(*) FROM messages m 
                    WHERE m.project_id = p.id 
                    AND m.is_read = 0 
                    AND m.sent_to_user_id = @userId) as unread_messages
            FROM projects p
            LEFT JOIN users u ON p.assigned_user_id = u.id
        `;
        
        let params = { userId: req.user.id };
        
        // إذا كان المستخدم ليس Admin، أظهر فقط المشاريع المكلف بها
        if (req.user.status !== 'Admin') {
            queryText += ` WHERE p.assigned_user_id = @userId`;
        }
        
        queryText += ` ORDER BY p.id DESC`;
        
        const result = await query(queryText, params);
        res.json({ success: true, data: result.recordset });
    } catch (err) {
        console.error('❌ خطأ في جلب المشاريع:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});
// ===== GET /api/projects/:id =====
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        console.log('📂 جلب المشروع ID:', req.params.id);
        console.log('👤 المستخدم:', req.user.username, 'الصلاحية:', req.user.status);
        
        let queryText = `
            SELECT p.*, u.full_name as assigned_user_name 
            FROM projects p
            LEFT JOIN users u ON p.assigned_user_id = u.id
            WHERE p.id = @id
        `;
        
        let params = { id: parseInt(req.params.id) };
        
        // إذا كان المستخدم ليس Admin، تأكد من أنه مكلف بهذا المشروع
        if (req.user.status !== 'Admin') {
            queryText += ` AND p.assigned_user_id = @userId`;
            params.userId = req.user.id;
        }
        
        const project = await queryOne(queryText, params);
        
        if (!project) {
            return res.status(404).json({ 
                success: false, 
                message: req.user.status !== 'Admin' ? 
                    'لا تملك صلاحية الوصول إلى هذا المشروع' : 
                    'المشروع غير موجود'
            });
        }
        
        console.log('✅ تم جلب المشروع:', project);
        res.json({ success: true, data: project });
    } catch (err) {
        console.error('❌ خطأ في جلب المشروع:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// ===== GET /api/projects/stats/dashboard =====
router.get('/stats/dashboard', authMiddleware, async (req, res) => {
    try {
        let params = { userId: req.user.id };
        let whereClause = '';
        
        // إذا كان المستخدم ليس Admin، احسب فقط مشاريعه
        if (req.user.status !== 'Admin') {
            whereClause = ' WHERE assigned_user_id = @userId';
        }
        
        // إجمالي المشاريع
        const totalResult = await queryOne(
            `SELECT COUNT(*) as total FROM projects${whereClause}`,
            params
        );
        
        // المشاريع حسب الحالة
        const statusResult = await query(
            `SELECT status, COUNT(*) as cnt 
             FROM projects${whereClause}
             GROUP BY status`,
            params
        );
        
        // ===== إصلاح عداد الرسائل غير المقروءة =====
        // للادمن: يرى جميع الرسائل غير المقروءة
        // للمستخدم العادي: يرى فقط الرسائل المرسلة إليه
        let unreadQuery = '';
        if (req.user.status === 'Admin') {
            unreadQuery = `SELECT COUNT(*) as unread FROM messages WHERE is_read = 0`;
        } else {
            unreadQuery = `SELECT COUNT(*) as unread FROM messages WHERE is_read = 0 AND sent_to_user_id = @userId`;
        }
        
        const unreadResult = await queryOne(unreadQuery, { userId: req.user.id });
        
        res.json({
            success: true,
            data: {
                total: totalResult?.total || 0,
                byStatus: statusResult.recordset || [],
                unreadMessages: unreadResult?.unread || 0
            }
        });
    } catch (err) {
        console.error('❌ خطأ في جلب الإحصائيات:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// ===== POST /api/projects =====
router.post('/', authMiddleware, async (req, res) => {
    try {
        // التأكد من أن المستخدم Admin
        if (req.user.status !== 'Admin') {
            return res.status(403).json({ 
                success: false, 
                message: 'غير مصرح لك بإضافة مشاريع جديدة' 
            });
        }
        
        const {
            project_name, implementing_party, commissioning_party,
            start_date, completion_date, duration_months,
            urgency, ward_number, ward_date, ward_source,
            book_number, book_date, assigned_user_id, notes
        } = req.body;

        // التحقق من وجود اسم المشروع
        if (!project_name) {
            return res.status(400).json({ success: false, message: 'اسم المشروع مطلوب' });
        }

        // إذا لم يتم تحديد مكلف، استخدم المدير الحالي
        const finalAssignedUserId = assigned_user_id || req.user.id;

        const result = await query(`
            INSERT INTO projects (
                project_name, implementing_party, commissioning_party,
                start_date, completion_date, duration_months,
                urgency, ward_number, ward_date, ward_source,
                book_number, book_date, assigned_user_id, status
            ) VALUES (
                @project_name, @implementing_party, @commissioning_party,
                @start_date, @completion_date, @duration_months,
                @urgency, @ward_number, @ward_date, @ward_source,
                @book_number, @book_date, @assigned_user_id, 'جديد'
            );
            SELECT SCOPE_IDENTITY() as id;
        `, {
            project_name, implementing_party, commissioning_party,
            start_date, completion_date, duration_months: parseInt(duration_months) || 0,
            urgency: urgency || 'عادي',
            ward_number, ward_date, ward_source,
            book_number, book_date,
            assigned_user_id: finalAssignedUserId
        });

        const projectId = result.recordset[0]?.id;

        // إضافة ملاحظة أولية إذا وجدت
        if (notes && projectId) {
            await query(`
                INSERT INTO descriptions (project_id, description, entered_by)
                VALUES (@project_id, @description, @entered_by)
            `, {
                project_id: projectId,
                description: notes,
                entered_by: req.user.full_name
            });
        }

        res.json({ success: true, message: 'تم إضافة المشروع', data: { id: projectId } });
    } catch (err) {
        console.error('❌ خطأ في إضافة المشروع:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// ===== PUT /api/projects/:id =====
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        // التأكد من أن المستخدم Admin أو المكلف بالمشروع
        const project = await queryOne(
            'SELECT assigned_user_id FROM projects WHERE id = @id',
            { id: parseInt(req.params.id) }
        );
        
        // إذا كان المستخدم ليس Admin وليس المكلف بالمشروع
        if (req.user.status !== 'Admin' && project?.assigned_user_id !== req.user.id) {
            return res.status(403).json({ 
                success: false, 
                message: 'غير مصرح لك بتعديل هذا المشروع' 
            });
        }
        
        const {
            project_name, implementing_party, commissioning_party,
            start_date, completion_date, duration_months,
            urgency, status, ward_number, ward_date, ward_source,
            book_number, book_date, assigned_user_id
        } = req.body;

        // بناء استعلام التحديث
        let updateFields = [];
        let params = { id: parseInt(req.params.id) };
        
        if (project_name !== undefined) { updateFields.push('project_name = @project_name'); params.project_name = project_name; }
        if (implementing_party !== undefined) { updateFields.push('implementing_party = @implementing_party'); params.implementing_party = implementing_party; }
        if (commissioning_party !== undefined) { updateFields.push('commissioning_party = @commissioning_party'); params.commissioning_party = commissioning_party; }
        if (start_date !== undefined) { updateFields.push('start_date = @start_date'); params.start_date = start_date; }
        if (completion_date !== undefined) { updateFields.push('completion_date = @completion_date'); params.completion_date = completion_date; }
        if (duration_months !== undefined) { updateFields.push('duration_months = @duration_months'); params.duration_months = parseInt(duration_months) || 0; }
        if (urgency !== undefined) { updateFields.push('urgency = @urgency'); params.urgency = urgency || 'عادي'; }
        if (status !== undefined) { updateFields.push('status = @status'); params.status = status || 'جديد'; }
        if (ward_number !== undefined) { updateFields.push('ward_number = @ward_number'); params.ward_number = ward_number; }
        if (ward_date !== undefined) { updateFields.push('ward_date = @ward_date'); params.ward_date = ward_date; }
        if (ward_source !== undefined) { updateFields.push('ward_source = @ward_source'); params.ward_source = ward_source; }
        if (book_number !== undefined) { updateFields.push('book_number = @book_number'); params.book_number = book_number; }
        if (book_date !== undefined) { updateFields.push('book_date = @book_date'); params.book_date = book_date; }
        if (assigned_user_id !== undefined) { updateFields.push('assigned_user_id = @assigned_user_id'); params.assigned_user_id = assigned_user_id ? parseInt(assigned_user_id) : null; }

        if (updateFields.length === 0) {
            return res.status(400).json({ success: false, message: 'لا توجد بيانات للتحديث' });
        }

        await query(`
            UPDATE projects SET ${updateFields.join(', ')}
            WHERE id = @id
        `, params);

        res.json({ success: true, message: 'تم تحديث المشروع' });
    } catch (err) {
        console.error('❌ خطأ في تحديث المشروع:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// ===== DELETE /api/projects/:id =====
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        // التأكد من أن المستخدم Admin
        if (req.user.status !== 'Admin') {
            return res.status(403).json({ 
                success: false, 
                message: 'غير مصرح لك بحذف المشاريع' 
            });
        }
        
        // حذف البيانات المرتبطة أولاً
        await query('DELETE FROM attachments WHERE project_id = @id', { id: parseInt(req.params.id) });
        await query('DELETE FROM messages WHERE project_id = @id', { id: parseInt(req.params.id) });
        await query('DELETE FROM descriptions WHERE project_id = @id', { id: parseInt(req.params.id) });
        await query('DELETE FROM projects WHERE id = @id', { id: parseInt(req.params.id) });

        res.json({ success: true, message: 'تم حذف المشروع' });
    } catch (err) {
        console.error('❌ خطأ في حذف المشروع:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// ===== دوال الوصف (Descriptions) =====

// GET /api/projects/:id/descriptions
router.get('/:id/descriptions', authMiddleware, async (req, res) => {
    try {
        const result = await query(`
            SELECT d.*, u.full_name as entered_by
            FROM descriptions d
            LEFT JOIN users u ON d.entered_by = u.full_name
            WHERE d.project_id = @project_id
            ORDER BY d.entry_date DESC
        `, { project_id: parseInt(req.params.id) });
        res.json({ success: true, data: result.recordset });
    } catch (err) {
        console.error('❌ خطأ في جلب الوصف:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// POST /api/projects/:id/descriptions
router.post('/:id/descriptions', authMiddleware, async (req, res) => {
    try {
        const { description } = req.body;
        if (!description) {
            return res.status(400).json({ success: false, message: 'الوصف مطلوب' });
        }

        await query(`
            INSERT INTO descriptions (project_id, description, entered_by)
            VALUES (@project_id, @description, @entered_by)
        `, {
            project_id: parseInt(req.params.id),
            description,
            entered_by: req.user.full_name
        });

        res.json({ success: true, message: 'تم إضافة الوصف' });
    } catch (err) {
        console.error('❌ خطأ في إضافة الوصف:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// ===== دوال الرسائل (Messages) =====

// GET /api/projects/:id/messages
router.get('/:id/messages', authMiddleware, async (req, res) => {
    try {
        const result = await query(`
            SELECT m.*, u.full_name as sent_by_name
            FROM messages m
            LEFT JOIN users u ON m.sent_by = u.full_name
            WHERE m.project_id = @project_id
            ORDER BY m.created_at DESC
        `, { project_id: parseInt(req.params.id) });
        res.json({ success: true, data: result.recordset });
    } catch (err) {
        console.error('❌ خطأ في جلب الرسائل:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// POST /api/projects/:id/messages
router.post('/:id/messages', authMiddleware, async (req, res) => {
    try {
        const { message } = req.body;
        if (!message) {
            return res.status(400).json({ success: false, message: 'الرسالة مطلوبة' });
        }

        // جلب اسم المشروع والمكلف
        const project = await queryOne(`
            SELECT p.project_name, p.assigned_user_id, u.full_name as assigned_user_name
            FROM projects p
            LEFT JOIN users u ON p.assigned_user_id = u.id
            WHERE p.id = @id
        `, { id: parseInt(req.params.id) });

        // إدراج الرسالة
        await query(`
            INSERT INTO messages (project_id, project_name, message, sent_by, sent_to, sent_to_user_id)
            VALUES (@project_id, @project_name, @message, @sent_by, @sent_to, @sent_to_user_id)
        `, {
            project_id: parseInt(req.params.id),
            project_name: project?.project_name || '',
            message,
            sent_by: req.user.full_name,
            sent_to: project?.assigned_user_name || '',
            sent_to_user_id: project?.assigned_user_id || null
        });

        // إضافة رسالة إلى الوصف
        await query(`
            INSERT INTO descriptions (project_id, description, entered_by)
            VALUES (@project_id, @description, @entered_by)
        `, {
            project_id: parseInt(req.params.id),
            description: `[رسالة من المدير] ${message}`,
            entered_by: req.user.full_name
        });

        res.json({ success: true, message: 'تم إرسال الرسالة' });
    } catch (err) {
        console.error('❌ خطأ في إرسال الرسالة:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// PUT /api/projects/:id/messages/:mid/read
router.put('/:id/messages/:mid/read', authMiddleware, async (req, res) => {
    try {
        // تحديث حالة القراءة
        await query(`
            UPDATE messages 
            SET is_read = 1, read_at = GETDATE()
            WHERE id = @mid AND project_id = @pid
        `, {
            mid: parseInt(req.params.mid),
            pid: parseInt(req.params.id)
        });

        // جلب محتوى الرسالة
        const msg = await queryOne(
            'SELECT message FROM messages WHERE id = @mid',
            { mid: parseInt(req.params.mid) }
        );

        // إضافة إلى الوصف
        if (msg) {
            await query(`
                INSERT INTO descriptions (project_id, description, entered_by)
                VALUES (@project_id, @description, @entered_by)
            `, {
                project_id: parseInt(req.params.id),
                description: `[رسالة مقروءة] ${msg.message}`,
                entered_by: req.user.full_name
            });
        }

        res.json({ success: true, message: 'تمت قراءة الرسالة' });
    } catch (err) {
        console.error('❌ خطأ في قراءة الرسالة:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// ===== دوال المرفقات (Attachments) =====
const attachmentsRouter = require('./attachments');
router.use('/:id/attachments', attachmentsRouter);

module.exports = router;