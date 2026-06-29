const express = require("express");
const router = express.Router();

const { verifyToken } = require("../middleware/authMiddleware");
const {
    getProfile,
    updateProfile,
    getDocuments,
    getDashboard
} = require("../controllers/veteranController");

// All veteran routes require a valid JWT
router.use(verifyToken);

// GET  /api/veteran/dashboard
router.get("/dashboard", getDashboard);

// GET  /api/veteran/profile
router.get("/profile", getProfile);

// PUT  /api/veteran/profile
router.put("/profile", updateProfile);

// GET  /api/veteran/documents
router.get("/documents", getDocuments);

module.exports = router;
