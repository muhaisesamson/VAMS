const db = require('../config/db');
const { sendVerificationStatusEmail, sendApplicationStatusEmail } = require('../utils/mailer');

const roleServiceMap = {
  'pension-committee': 'pension',
  'healthcare-committee': 'healthcare',
  'education-committee': 'education'
};

const getAllVeterans = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, full_name, email, phone, service_number, national_id, service_branch, rank, years_served, verification_status, created_at
       FROM veterans ORDER BY created_at DESC`
    );
    return res.status(200).json({ success: true, data: result.rows });
  } catch (error) {
    console.error('getAllVeterans error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const getVeteranById = async (req, res) => {
  try {
    const { id } = req.params;
    const veteranResult = await db.query(
      `SELECT id, full_name, email, phone, service_number, national_id, service_branch, rank, years_served, verification_status, created_at FROM veterans WHERE id = $1`,
      [id]
    );
    if (veteranResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Veteran not found.' });
    }

    const docsResult = await db.query(
      `SELECT id, doc_type, file_path, status, created_at FROM documents WHERE veteran_id = $1 ORDER BY created_at DESC`,
      [id]
    );

    return res.status(200).json({ success: true, data: { ...veteranResult.rows[0], documents: docsResult.rows } });
  } catch (error) {
    console.error('getVeteranById error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const listDocuments = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT d.id, d.veteran_id, d.doc_type, d.file_path, d.status, d.created_at, v.full_name
       FROM documents d JOIN veterans v ON v.id = d.veteran_id ORDER BY d.created_at DESC`
    );
    return res.status(200).json({ success: true, data: result.rows });
  } catch (error) {
    console.error('listDocuments error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const reviewDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'status must be pending, approved, or rejected.' });
    }

    const result = await db.query(
      `UPDATE documents d
       SET status = $1, reviewed_by = $2, reviewed_at = NOW()
       FROM veterans v
       WHERE d.id = $3 AND v.id = d.veteran_id
       RETURNING d.id, d.status, d.reviewed_by, d.reviewed_at, d.doc_type,
                 v.id AS veteran_id, v.full_name, v.email`,
      [status, req.user.id, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Document not found.' });
    }

    return res.status(200).json({ success: true, message: 'Document updated successfully.', data: result.rows[0] });
  } catch (error) {
    console.error('reviewDocument error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const reviewVeteranStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, message } = req.body;

    console.log('🔍 reviewVeteranStatus called with:', {
      id,
      idType: typeof id,
      status,
      statusType: typeof status,
      message,
      messageType: typeof message,
    });


    const validStatuses = ['approved', 'rejected', 'info_requested'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'status must be approved, rejected, or info_requested.' });
    }

    if (status === 'info_requested' && (!message || !message.trim())) {
      return res.status(400).json({ success: false, message: 'Please describe what additional information is needed.' });
    }

    const queryText = `UPDATE veterans
       SET verification_status = $1::text,
           info_request_message = CASE WHEN $1::text = 'info_requested' THEN $2 ELSE NULL END,
           reviewed_by = $3,
           reviewed_at = NOW(),
           updated_at = NOW()
       WHERE id = $4
       RETURNING id, full_name, email, verification_status, info_request_message`;
    const queryParams = [status, message ? message.trim() : null, req.user.id, id];

    console.log('🔍 About to run query:', queryText);
    console.log('🔍 With params:', queryParams);
    console.log('🔍 req.user:', req.user);

    const result = await db.query(queryText, queryParams);

    console.log('✅ Query succeeded, rows:', result.rows);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Veteran not found.' });
    }

    const veteran = result.rows[0];

    try {
      await sendVerificationStatusEmail({
        to: veteran.email,
        fullName: veteran.full_name,
        status,
        message: veteran.info_request_message
      });
    } catch (emailError) {
      console.error('sendVerificationStatusEmail error:', emailError);
      return res.status(200).json({
        success: true,
        message: 'Status updated, but the notification email could not be sent.',
        data: veteran,
        emailSent: false
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Veteran status updated and notification email sent.',
      data: veteran,
      emailSent: true
    });
  } catch (error) {
    console.error('❌ reviewVeteranStatus FULL error object:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    console.error('❌ error.message:', error.message);
    console.error('❌ error.code:', error.code);
    console.error('❌ error.detail:', error.detail);
    console.error('❌ error.position:', error.position);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const listApplications = async (req, res) => {
  try {
    const { service } = req.query;
    const validServices = ['pension', 'healthcare', 'education'];
    let effectiveService = null;
    
    if (req.user.role === 'super-admin') {
      if (service) {
        if (!validServices.includes(service)) {
          return res.status(400).json({ success: false, message: 'Invalid service filter.' });
        }
        effectiveService = service;
      }
    } else {
      effectiveService = roleServiceMap[req.user.role];
      if (!effectiveService) {
        return res.status(403).json({ success: false, message: 'You do not have access to applications.' });
      }
    }

    let query = `SELECT a.id, a.veteran_id, a.service_type, a.status, a.amount, a.coverage_value, a.submitted_at, a.reviewed_at, v.full_name FROM applications a JOIN veterans v ON v.id = a.veteran_id`;
    const params = [];
    if (effectiveService) {
      query += ' WHERE a.service_type = $1';
      params.push(effectiveService);
    }
    query += ' ORDER BY a.submitted_at DESC';

    const result = await db.query(query, params);
    return res.status(200).json({ success: true, data: result.rows });
  } catch (error) {
    console.error('listApplications error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const reviewApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, amount, coverage_value } = req.body;
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'status must be pending, approved, or rejected.' });
    }

    if (req.user.role !== 'super-admin') {
      const existing = await db.query('SELECT service_type FROM applications WHERE id = $1', [id]);
      if (existing.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Application not found.' });
      }
      if (existing.rows[0].service_type !== roleServiceMap[req.user.role]) {
        return res.status(403).json({ success: false, message: 'You do not have access to this application.' });
      }
    }

    const result = await db.query(
      `UPDATE applications a
       SET status = $1, amount = COALESCE($2, a.amount), coverage_value = COALESCE($3, a.coverage_value),
           reviewed_by = $4, reviewed_at = NOW()
       FROM veterans v
       WHERE a.id = $5 AND v.id = a.veteran_id
       RETURNING a.id, a.service_type, a.status, a.amount, a.coverage_value,
                 v.full_name, v.email`,
      [status, amount || null, coverage_value || null, req.user.id, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    const application = result.rows[0];
    let emailSent = true;

    if (status === 'approved' || status === 'rejected') {
      try {
        await sendApplicationStatusEmail({
          to: application.email,
          fullName: application.full_name,
          serviceType: application.service_type,
          status,
          amount: application.amount,
          coverageValue: application.coverage_value
        });
      } catch (emailError) {
        console.error('sendApplicationStatusEmail error:', emailError);
        emailSent = false;
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Application updated successfully.',
      data: application,
      emailSent
    });
  } catch (error) {
    console.error('reviewApplication error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const getOverview = async (req, res) => {
  try {
    const [veterans, pendingDocs, approvedDocs, pendingApps, approvedApps] = await Promise.all([
      db.query('SELECT COUNT(*) AS total FROM veterans'),
      db.query("SELECT COUNT(*) AS total FROM documents WHERE status = 'pending'"),
      db.query("SELECT COUNT(*) AS total FROM documents WHERE status = 'approved'"),
      db.query("SELECT COUNT(*) AS total FROM applications WHERE status = 'pending'"),
      db.query("SELECT COUNT(*) AS total FROM applications WHERE status = 'approved'")
    ]);

    return res.status(200).json({
      success: true,
      data: {
        total_veterans: parseInt(veterans.rows[0].total, 10),
        pending_documents: parseInt(pendingDocs.rows[0].total, 10),
        approved_documents: parseInt(approvedDocs.rows[0].total, 10),
        pending_applications: parseInt(pendingApps.rows[0].total, 10),
        approved_applications: parseInt(approvedApps.rows[0].total, 10)
      }
    });
  } catch (error) {
    console.error('getOverview error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = {
  getAllVeterans,
  getVeteranById,
  listDocuments,
  reviewDocument,
  reviewVeteranStatus,
  listApplications,
  reviewApplication,
  getOverview
};
