const fs = require("fs");
const path = require("path");
const multer = require("multer");
const { randomUUID } = require("crypto");

const UPLOAD_DIRS = [
    "uploads/national_ids",
    "uploads/army_ids",
    "uploads/discharge_certificates",
    "uploads/supporting_docs",
    "uploads/profile_images"
];

UPLOAD_DIRS.forEach(dir => {
    fs.mkdirSync(path.join(__dirname, "..", dir), { recursive: true });
});

const storage = multer.diskStorage({

    destination(req, file, cb) {

        let folder = "uploads/supporting_docs";

        if (file.fieldname === "national_id_file") {
            folder = "uploads/national_ids";
        } else if (file.fieldname === "army_id_file") {
            folder = "uploads/army_ids";
        } else if (file.fieldname === "discharge_file") {
            folder = "uploads/discharge_certificates";
        }

        cb(null, folder);
    },

    filename(req, file, cb) {
        const extension = path.extname(file.originalname);
        cb(null, randomUUID() + extension);
    }

});

const upload = multer({

    storage,

    limits: {
        fileSize: 5 * 1024 * 1024
    },

    fileFilter(req, file, cb) {
        const allowed = ["image/jpeg", "image/png", "application/pdf"];
        if (allowed.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error("Invalid file type"));
        }
    }

});

module.exports = upload;