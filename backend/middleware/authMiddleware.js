const jwt = require("jsonwebtoken");

const getTokenFromRequest = (req) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
        return authHeader.split(" ")[1];
    }

    if (req.cookies && req.cookies.token) {
        return req.cookies.token;
    }

    if (req.headers.cookie) {
        const cookieHeader = req.headers.cookie.split(";").find((part) => part.trim().startsWith("token="));
        if (cookieHeader) {
            return cookieHeader.split("=")[1];
        }
    }

    return null;
};

// ===========================
// VERIFY JWT TOKEN
// ===========================

const verifyToken = (req, res, next) => {
    const token = getTokenFromRequest(req);

    if (!token) {
        return res.status(401).json({
            success: false,
            message: "Access denied. No token provided."
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired token. Please log in again."
        });
    }
};

// ===========================
// REQUIRE ROLE
// ===========================

const requireRole = (...allowedRoles) => (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ success: false, message: "Authentication required." });
    }

    if (req.user.role === "super-admin" || allowedRoles.includes(req.user.role)) {
        return next();
    }

    return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${allowedRoles.join(" or ")}`
    });
};

// ===========================
// REQUIRE ADMIN ROLE (legacy alias)
// ===========================

const requireAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ success: false, message: "Authentication required." });
    }

    if (req.user.role === "super-admin" || req.user.role === "doc-verifier" || req.user.role === "pension-committee" || req.user.role === "healthcare-committee" || req.user.role === "education-committee") {
        return next();
    }

    return res.status(403).json({
        success: false,
        message: "Access denied. Admins only."
    });
};

module.exports = {
    verifyToken,
    requireAdmin,
    requireRole
};
