const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

const signToken = (user) => {
  return jwt.sign(
    { id: user.id, role: user.role, type: user.type },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );
};

const sendAuthCookie = (res, token) => {
  res.cookie('token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 8 * 60 * 60 * 1000
  });
};

const veteranLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await db.query('SELECT * FROM veterans WHERE email = $1', [email]);

    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid veteran credentials.' });
    }

    const veteran = result.rows[0];
    const match = await bcrypt.compare(password, veteran.password_hash);
    if (!match) {
      return res.status(401).json({ success: false, message: 'Invalid veteran credentials.' });
    }

    const token = signToken({ id: veteran.id, role: 'veteran', type: 'veteran' });
    sendAuthCookie(res, token);

    return res.status(200).json({
      success: true,
      message: 'Veteran login successful.',
      token,
      user: {
        id: veteran.id,
        full_name: veteran.full_name,
        email: veteran.email,
        role: 'veteran'
      }
    });
  } catch (error) {
    console.error('veteranLogin error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await db.query('SELECT * FROM admins WHERE email = $1', [email]);

    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid admin credentials.' });
    }

    const admin = result.rows[0];
    const match = await bcrypt.compare(password, admin.password_hash);
    if (!match) {
      return res.status(401).json({ success: false, message: 'Invalid admin credentials.' });
    }

    const token = signToken({ id: admin.id, role: admin.role, type: 'admin' });
    sendAuthCookie(res, token);

    return res.status(200).json({
      success: true,
      message: 'Admin login successful.',
      token,
      user: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role
      }
    });
  } catch (error) {
    console.error('adminLogin error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const adminRegister = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'super-admin') {
      return res.status(403).json({ success: false, message: 'Only super-admins can register new admins.' });
    }

    const { name, email, password, role } = req.body;
    const existing = await db.query('SELECT id FROM admins WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ success: false, message: 'Admin email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const inserted = await db.query(
      'INSERT INTO admins (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role',
      [name, email, passwordHash, role]
    );

    return res.status(201).json({ success: true, message: 'Admin registered successfully.', admin: inserted.rows[0] });
  } catch (error) {
    console.error('adminRegister error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const veteranRegister = async (req, res) => {
  const client = await db.connect();
  try {
    await client.query('BEGIN');

    const {
      full_name,
      email,
      password,
      phone,
      service_number,
      national_id,
      service_branch,
      rank,
      years_served
    } = req.body;

    const existingEmail = await client.query('SELECT id FROM veterans WHERE email = $1', [email]);
    if (existingEmail.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ success: false, message: 'Veteran email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const veteranResult = await client.query(
      `INSERT INTO veterans (full_name, email, password_hash, phone, service_number, national_id, service_branch, rank, years_served, verification_status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending') RETURNING id, full_name, email, verification_status`,
      [full_name, email, passwordHash, phone, service_number, national_id, service_branch, rank, years_served]
    );

    const insertedVeteran = veteranResult.rows[0];
    const files = req.files || {};

    for (const [fieldName, uploadedFiles] of Object.entries(files)) {
      if (!uploadedFiles || uploadedFiles.length === 0) continue;
      const file = uploadedFiles[0];
      await client.query(
        'INSERT INTO documents (veteran_id, doc_type, file_path, status) VALUES ($1, $2, $3, $4)',
        [insertedVeteran.id, fieldName, file.path || file.filename, 'pending']
      );
    }

    await client.query('COMMIT');
    return res.status(201).json({ success: true, message: 'Veteran registration submitted successfully.', veteran: insertedVeteran });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('veteranRegister error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  } finally {
    client.release();
  }
};

module.exports = {
  veteranLogin,
  adminLogin,
  adminRegister,
  veteranRegister
};
