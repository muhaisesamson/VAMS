const db = require("../config/db");


// ===========================
// GET ALL VETERANS (paginated)
// ===========================

const getAllVeterans = async (req, res) => {

    try {

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;

        // Optional: filter by verification_status e.g. ?status=Pending
        const { status } = req.query;

        let query = `
            SELECT
                v.id, v.first_name, v.last_name, v.national_id,
                v.service_number, v.service_branch, v.rank,
                v.years_served, v.verification_status,
                u.email, u.account_status, u.created_at
            FROM veterans v
            JOIN users u ON v.user_id = u.id
        `;

        const params = [];

        if (status) {
            params.push(status);
            query += ` WHERE v.verification_status = $1`;
        }

        query += ` ORDER BY u.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(limit, offset);

        const result = await db.query(query, params);

        // Total count for pagination
        const countResult = await db.query(
            status
                ? "SELECT COUNT(*) FROM veterans WHERE verification_status = $1"
                : "SELECT COUNT(*) FROM veterans",
            status ? [status] : []
        );

        return res.status(200).json({
            success: true,
            data: result.rows,
            pagination: {
                total: parseInt(countResult.rows[0].count),
                page,
                limit,
                pages: Math.ceil(countResult.rows[0].count / limit)
            }
        });

    } catch (error) {
        console.error("getAllVeterans error:", error);
        return res.status(500).json({ success: false, message: "Server error." });
    }

};


// ===========================
// GET SINGLE VETERAN + DOCUMENTS
// ===========================

const getVeteranById = async (req, res) => {

    try {

        const { id } = req.params;

        const vetResult = await db.query(
            `SELECT
                v.*, u.email, u.account_status, u.role, u.created_at
             FROM veterans v
             JOIN users u ON v.user_id = u.id
             WHERE v.id = $1`,
            [id]
        );

        if (vetResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: "Veteran not found." });
        }

        const docsResult = await db.query(
            `SELECT id, document_type, file_name, verification_status, uploaded_at
             FROM verification_documents
             WHERE veteran_id = $1
             ORDER BY uploaded_at DESC`,
            [id]
        );

        return res.status(200).json({
            success: true,
            data: {
                ...vetResult.rows[0],
                documents: docsResult.rows
            }
        });

    } catch (error) {
        console.error("getVeteranById error:", error);
        return res.status(500).json({ success: false, message: "Server error." });
    }

};


// ===========================
// VERIFY VETERAN (Approve / Reject)
// ===========================

const verifyVeteran = async (req, res) => {

    const client = await db.connect();

    try {

        await client.query("BEGIN");

        const { id } = req.params;
        const { action } = req.body; // "approve" or "reject"

        if (!["approve", "reject"].includes(action)) {
            return res.status(400).json({
                success: false,
                message: "Action must be 'approve' or 'reject'."
            });
        }

        const newVerificationStatus = action === "approve" ? "Verified" : "Rejected";

        // Update veteran's verification_status
        const vetResult = await client.query(
            `UPDATE veterans
             SET verification_status = $1
             WHERE id = $2
             RETURNING user_id, verification_status`,
            [newVerificationStatus, id]
        );

        if (vetResult.rows.length === 0) {
            await client.query("ROLLBACK");
            return res.status(404).json({ success: false, message: "Veteran not found." });
        }

        const userId = vetResult.rows[0].user_id;

        // If approved → activate their account
        // If rejected → keep pending (admin can suspend separately)
        if (action === "approve") {
            await client.query(
                "UPDATE users SET account_status = 'active' WHERE id = $1",
                [userId]
            );
        }

        await client.query("COMMIT");

        return res.status(200).json({
            success: true,
            message: `Veteran ${action === "approve" ? "approved" : "rejected"} successfully.`,
            data: vetResult.rows[0]
        });

    } catch (error) {
        await client.query("ROLLBACK");
        console.error("verifyVeteran error:", error);
        return res.status(500).json({ success: false, message: "Server error." });
    } finally {
        client.release();
    }

};


// ===========================
// SUSPEND / REINSTATE ACCOUNT
// ===========================

const updateAccountStatus = async (req, res) => {

    try {

        const { id } = req.params; // veteran id
        const { status } = req.body; // "active", "suspended", "pending"

        if (!["active", "suspended", "pending"].includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Status must be 'active', 'suspended', or 'pending'."
            });
        }

        // Get user_id from veteran id
        const vet = await db.query(
            "SELECT user_id FROM veterans WHERE id = $1",
            [id]
        );

        if (vet.rows.length === 0) {
            return res.status(404).json({ success: false, message: "Veteran not found." });
        }

        await db.query(
            "UPDATE users SET account_status = $1 WHERE id = $2",
            [status, vet.rows[0].user_id]
        );

        return res.status(200).json({
            success: true,
            message: `Account status updated to '${status}'.`
        });

    } catch (error) {
        console.error("updateAccountStatus error:", error);
        return res.status(500).json({ success: false, message: "Server error." });
    }

};


// ===========================
// DASHBOARD STATS
// ===========================

const getStats = async (req, res) => {

    try {

        const [total, pending, verified, rejected, suspended] = await Promise.all([
            db.query("SELECT COUNT(*) FROM veterans"),
            db.query("SELECT COUNT(*) FROM veterans WHERE verification_status = 'Pending'"),
            db.query("SELECT COUNT(*) FROM veterans WHERE verification_status = 'Verified'"),
            db.query("SELECT COUNT(*) FROM veterans WHERE verification_status = 'Rejected'"),
            db.query("SELECT COUNT(*) FROM users WHERE account_status = 'suspended'")
        ]);

        return res.status(200).json({
            success: true,
            data: {
                total_veterans: parseInt(total.rows[0].count),
                pending_verification: parseInt(pending.rows[0].count),
                verified: parseInt(verified.rows[0].count),
                rejected: parseInt(rejected.rows[0].count),
                suspended_accounts: parseInt(suspended.rows[0].count)
            }
        });

    } catch (error) {
        console.error("getStats error:", error);
        return res.status(500).json({ success: false, message: "Server error." });
    }

};


module.exports = {
    getAllVeterans,
    getVeteranById,
    verifyVeteran,
    updateAccountStatus,
    getStats
};
