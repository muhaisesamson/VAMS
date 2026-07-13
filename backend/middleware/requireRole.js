module.exports = function requireRole(...allowedRoles) {
  return (req, res, next) => {
    const userRole = req.user && req.user.role;

    if (allowedRoles.includes(userRole)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: "Access denied"
    });
  };
};
