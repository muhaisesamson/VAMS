/*const express = require("express");
const cors = require("cors");
require("dotenv").config();

const db = require("./config/db");

const authRoutes = require("./routes/authRoutes");

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {

    res.send("Uganda Veterans Affairs Management System API Running");

});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {

    console.log(`Server running on port ${PORT}`);

});
*/

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const db = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const veteranRoutes = require("./routes/veteranRoutes");
const adminRoutes = require("./routes/adminRoutes");

const app = express();

// ===========================
// MIDDLEWARE
// ===========================

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`➡️ ${req.method} ${req.url}`);
  next();
});

// Serve uploaded files as static (so frontend can display them)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));


// ===========================
// ROUTES
// ===========================

app.use("/api/auth", authRoutes);
app.use("/api/veteran", veteranRoutes);
app.use("/api/admin", adminRoutes);

// After your app.use routes, before the generic error handler:
app.use((err, req, res, next) => {
    if (err.name === "MulterError" || err.message === "Invalid file type") {
        return res.status(400).json({ success: false, message: err.message });
    }
    console.error("Unhandled error:", err.message);
    res.status(500).json({ success: false, message: "An unexpected error occurred." });
});

process.on("unhandledRejection", (err) => {
  console.error("🔥 UNHANDLED PROMISE REJECTION:", err);
});

process.on("uncaughtException", (err) => {
  console.error("🔥 UNCAUGHT EXCEPTION:", err);
});

app.use((err, req, res, next) => {
  console.error("🔥 EXPRESS ERROR:", err);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
    stack: err.stack,
  });
});

// ===========================
// HEALTH CHECK
// ===========================

app.get("/", (req, res) => {
    res.json({
        status: "running",
        project: "Uganda Veterans Affairs Management System API"
    });
});


// ===========================
// GLOBAL ERROR HANDLER
// ===========================

app.use((err, req, res, next) => {
    console.error("Unhandled error:", err.message);
    res.status(500).json({
        success: false,
        message: "An unexpected error occurred."
    });
});


// ===========================
// START SERVER
// ===========================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
