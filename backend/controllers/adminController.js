const db = require('../config/db');

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
      `UPDATE documents SET status = $1, reviewed_by = $2, reviewed_at = NOW() WHERE id = $3 RETURNING id, status, reviewed_by, reviewed_at`,
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
      `UPDATE applications SET status = $1, amount = COALESCE($2, amount), coverage_value = COALESCE($3, coverage_value), reviewed_by = $4, reviewed_at = NOW() WHERE id = $5 RETURNING id, service_type, status, amount, coverage_value`,
      [status, amount || null, coverage_value || null, req.user.id, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    return res.status(200).json({ success: true, message: 'Application updated successfully.', data: result.rows[0] });
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
  listApplications,
  reviewApplication,
  getOverview
};
