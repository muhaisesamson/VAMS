/*const express = require("express");

const router = express.Router();

const upload = require("../middleware/uploadMiddleware");

const {

    registerUser

} = require("../controllers/authController");

router.post(

    "/register",

    upload.fields([

        {

            name: "national_id_file",

            maxCount: 1

        },

        {

            name: "army_id_file",

            maxCount: 1

        },

        {

            name: "discharge_file",

            maxCount: 1

        },

        {

            name: "supporting_docs",

            maxCount: 10

        }

    ]),

    registerUser

);

module.exports = router;

*/




const express = require("express");
const router = express.Router();

const upload = require("../middleware/uploadMiddleware");
const { registerUser, loginUser } = require("../controllers/authController");

// POST /api/auth/register
router.post(
    "/register",
    upload.fields([
        { name: "national_id_file", maxCount: 1 },
        { name: "army_id_file", maxCount: 1 },
        { name: "discharge_file", maxCount: 1 },
        { name: "supporting_docs", maxCount: 10 }
    ]),
    registerUser
);

// POST /api/auth/login
router.post("/login", loginUser);

module.exports = router;
