const db = require('../config/db');

const getProfile = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, full_name, email, phone, service_number, national_id, service_branch, rank, years_served, verification_status, created_at
       FROM veterans WHERE id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Veteran profile not found.' });
    }

    return res.status(200).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('getProfile error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { full_name, phone, service_branch, rank, years_served } = req.body;
    const fields = [];
    const values = [];
    let index = 1;

    if (full_name !== undefined) {
      fields.push(`full_name = $${index}`);
      values.push(full_name);
      index += 1;
    }

    if (phone !== undefined) {
      fields.push(`phone = $${index}`);
      values.push(phone);
      index += 1;
    }

    if (service_branch !== undefined) {
      fields.push(`service_branch = $${index}`);
      values.push(service_branch);
      index += 1;
    }

    if (rank !== undefined) {
      fields.push(`rank = $${index}`);
      values.push(rank);
      index += 1;
    }

    if (years_served !== undefined) {
      fields.push(`years_served = $${index}`);
      values.push(years_served);
      index += 1;
    }

    if (fields.length === 0) {
      return res.status(400).json({ success: false, message: 'No profile fields provided.' });
    }

    values.push(req.user.id);
    const result = await db.query(
      `UPDATE veterans SET ${fields.join(', ')} WHERE id = $${index} RETURNING id, full_name, phone, service_branch, rank, years_served`,
      values
    );

    return res.status(200).json({ success: true, message: 'Profile updated successfully.', data: result.rows[0] });
  } catch (error) {
    console.error('updateProfile error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No document was uploaded.' });
    }

    const veteranResult = await db.query('SELECT id FROM veterans WHERE id = $1', [req.user.id]);
    if (veteranResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Veteran not found.' });
    }

    const inserted = await db.query(
      'INSERT INTO documents (veteran_id, doc_type, file_path, status) VALUES ($1, $2, $3, $4) RETURNING id, doc_type, file_path, status, created_at',
      [req.user.id, req.body.doc_type || 'supporting_doc', req.file.path || req.file.filename, 'pending']
    );

    return res.status(201).json({ success: true, message: 'Document uploaded successfully.', data: inserted.rows[0] });
  } catch (error) {
    console.error('uploadDocument error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const getMyDocuments = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, doc_type, file_path, status, created_at FROM documents WHERE veteran_id = $1 ORDER BY created_at DESC`,
      [req.user.id]
    );

    return res.status(200).json({ success: true, data: result.rows });
  } catch (error) {
    console.error('getMyDocuments error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const submitApplication = async (req, res) => {
  try {
    const { service_type, amount, coverage_value, notes } = req.body;
    if (!service_type) {
      return res.status(400).json({ success: false, message: 'service_type is required.' });
    }

    const result = await db.query(
      `INSERT INTO applications (veteran_id, service_type, amount, coverage_value, status)
       VALUES ($1, $2, $3, $4, 'pending') RETURNING id, service_type, status, amount, coverage_value, submitted_at`,
      [req.user.id, service_type, amount || null, coverage_value || null]
    );

    return res.status(201).json({ success: true, message: 'Application submitted successfully.', data: result.rows[0] });
  } catch (error) {
    console.error('submitApplication error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const getMyApplications = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, service_type, status, amount, coverage_value, notes, submitted_at, reviewed_at, reviewed_by
       FROM applications WHERE veteran_id = $1 ORDER BY submitted_at DESC`,
      [req.user.id]
    );

    return res.status(200).json({ success: true, data: result.rows });
  } catch (error) {
    console.error('getMyApplications error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const getDashboard = async (req, res) => {
  try {
    const profile = await db.query(
      `SELECT full_name, email, service_number, service_branch, rank, years_served, verification_status
       FROM veterans WHERE id = $1`,
      [req.user.id]
    );
    const docs = await db.query('SELECT COUNT(*) AS total FROM documents WHERE veteran_id = $1', [req.user.id]);
    const apps = await db.query('SELECT COUNT(*) AS total FROM applications WHERE veteran_id = $1', [req.user.id]);

    const v = profile.rows[0];
    if (!v) {
      return res.status(404).json({ success: false, message: 'Veteran profile not found.' });
    }

    // veterans table stores one combined full_name column, so split it
    // for the dashboard UI, which expects first_name / last_name separately
    const nameParts = (v.full_name || '').trim().split(' ');
    const first_name = nameParts[0] || '';
    const last_name = nameParts.slice(1).join(' ') || '';

    return res.status(200).json({
      success: true,
      data: {
        first_name,
        last_name,
        full_name: v.full_name,
        email: v.email,
        service_number: v.service_number,
        service_branch: v.service_branch,
        rank: v.rank,
        years_served: v.years_served,
        verification_status: v.verification_status || 'pending',
        // there's no separate account_status column in the DB — reusing
        // verification_status here since that's the only status you track
        account_status: v.verification_status || 'pending',
        documents_uploaded: parseInt(docs.rows[0]?.total || 0),
        applications_submitted: parseInt(apps.rows[0]?.total || 0)
      }
    });
  } catch (error) {
    console.error('getDashboard error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  uploadDocument,
  getMyDocuments,
  submitApplication,
  getMyApplications,
  getDashboard
};