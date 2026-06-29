const jwt = require("jsonwebtoken");


// ===========================
// VERIFY JWT TOKEN
// ===========================

const verifyToken = (req, res, next) => {

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            success: false,
            message: "Access denied. No token provided."
        });
    }

    const token = authHeader.split(" ")[1];

    try {

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Attach user info to every request so controllers can use it
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
// REQUIRE ADMIN ROLE
// ===========================

const requireAdmin = (req, res, next) => {

    if (req.user.role !== "admin") {
        return res.status(403).json({
            success: false,
            message: "Access denied. Admins only."
        });
    }

    next();

};


module.exports = {
    verifyToken,
    requireAdmin
};
