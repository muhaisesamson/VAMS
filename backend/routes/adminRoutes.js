const express = require("express");
const router = express.Router();

const { verifyToken, requireAdmin } = require("../middleware/authMiddleware");
const {
    getAllVeterans,
    getVeteranById,
    verifyVeteran,
    updateAccountStatus,
    getStats
} = require("../controllers/adminController");

// All admin routes require a valid JWT AND admin role
router.use(verifyToken, requireAdmin);

// GET  /api/admin/stats
router.get("/stats", getStats);

// GET  /api/admin/veterans?status=Pending&page=1&limit=20
router.get("/veterans", getAllVeterans);

// GET  /api/admin/veterans/:id
router.get("/veterans/:id", getVeteranById);

// PUT  /api/admin/veterans/:id/verify   body: { action: "approve" | "reject" }
router.put("/veterans/:id/verify", verifyVeteran);

// PUT  /api/admin/veterans/:id/status   body: { status: "active" | "suspended" | "pending" }
router.put("/veterans/:id/status", updateAccountStatus);

module.exports = router;
