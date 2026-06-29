const db = require("../config/db");


// ===========================
// GET OWN PROFILE
// ===========================

const getProfile = async (req, res) => {
    try {
        const result = await db.query(
            `SELECT
                v.id, v.first_name, v.last_name, v.gender,
                v.date_of_birth, v.national_id, v.phone,
                v.service_number, v.service_branch, v.rank,
                v.years_served, v.verification_status,
                u.email, u.account_status, u.created_at
             FROM veterans v
             JOIN users u ON v.user_id = u.id
             WHERE v.user_id = $1`,
            [req.user.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Veteran profile not found."
            });
        }

        return res.status(200).json({
            success: true,
            data: result.rows[0]
        });

    } catch (error) {
        console.error("getProfile error:", error);
        return res.status(500).json({ success: false, message: "Server error." });
    }
};


// ===========================
// UPDATE OWN PROFILE
// ===========================

const updateProfile = async (req, res) => {
    try {
        const { phone, service_branch, rank } = req.body;

        const result = await db.query(
            `UPDATE veterans
             SET phone = COALESCE($1, phone),
                 service_branch = COALESCE($2, service_branch),
                 rank = COALESCE($3, rank)
             WHERE user_id = $4
             RETURNING id, phone, service_branch, rank`,
            [phone, service_branch, rank, req.user.userId]
        );

        return res.status(200).json({
            success: true,
            message: "Profile updated successfully.",
            data: result.rows[0]
        });

    } catch (error) {
        console.error("updateProfile error:", error);
        return res.status(500).json({ success: false, message: "Server error." });
    }
};


// ===========================
// GET OWN DOCUMENTS
// ===========================

const getDocuments = async (req, res) => {
    try {
        const vetResult = await db.query(
            "SELECT id FROM veterans WHERE user_id = $1",
            [req.user.userId]
        );

        if (vetResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: "Veteran not found." });
        }

        const veteranId = vetResult.rows[0].id;

        const docs = await db.query(
            `SELECT id, document_type, file_name, verification_status, uploaded_at
             FROM verification_documents
             WHERE veteran_id = $1
             ORDER BY uploaded_at DESC`,
            [veteranId]
        );

        return res.status(200).json({
            success: true,
            data: docs.rows
        });

    } catch (error) {
        console.error("getDocuments error:", error);
        return res.status(500).json({ success: false, message: "Server error." });
    }
};


// ===========================
// GET DASHBOARD SUMMARY
// Returns all fields needed by the new dashboard in one call
// ===========================

const getDashboard = async (req, res) => {
    try {
        // 1. Veteran + user row
        const profileResult = await db.query(
            `SELECT
                v.id           AS veteran_id,
                v.first_name,
                v.last_name,
                v.rank,
                v.service_number,
                v.service_branch,
                v.years_served,
                v.phone,
                v.verification_status,
                u.email,
                u.account_status,
                u.created_at
             FROM veterans v
             JOIN users u ON v.user_id = u.id
             WHERE v.user_id = $1`,
            [req.user.userId]
        );

        if (profileResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: "Profile not found." });
        }

        const veteran = profileResult.rows[0];

        // 2. Document count (total uploaded)
        const docCountResult = await db.query(
            `SELECT COUNT(*) AS total,
                    COUNT(*) FILTER (WHERE verification_status = 'Verified') AS verified
             FROM verification_documents
             WHERE veteran_id = $1`,
            [veteran.veteran_id]
        );

        const { total: docs_total, verified: docs_verified } = docCountResult.rows[0];

        // 3. Build response — placeholders for features not yet in DB
        //    When you add appointments / messages tables, replace 0s below
        //    with real COUNT queries against those tables.
        return res.status(200).json({
            success: true,
            data: {
                // Identity
                first_name:          veteran.first_name,
                last_name:           veteran.last_name,
                rank:                veteran.rank,
                service_number:      veteran.service_number,
                service_branch:      veteran.service_branch,
                years_served:        veteran.years_served,
                phone:               veteran.phone,
                email:               veteran.email,

                // Status
                verification_status: veteran.verification_status,
                account_status:      veteran.account_status,
                member_since:        veteran.created_at,

                // Counts
                documents_uploaded:  parseInt(docs_total)  || 0,
                documents_verified:  parseInt(docs_verified) || 0,

                // Placeholders — replace with real queries when tables exist
                appointments_upcoming: 0,
                messages_unread:       0,
                requests_pending:      0,
            }
        });

    } catch (error) {
        console.error("getDashboard error:", error);
        return res.status(500).json({ success: false, message: "Server error." });
    }
};


module.exports = {
    getProfile,
    updateProfile,
    getDocuments,
    getDashboard
};