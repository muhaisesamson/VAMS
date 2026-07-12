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




const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();

const upload = require('../middleware/uploadMiddleware');
const {
  veteranRegistrationRules,
  veteranLoginRules,
  adminLoginRules,
  adminRegisterRules,
  handleValidationErrors
} = require('../middleware/validateMiddleware');
const { verifyToken } = require('../middleware/authMiddleware');
const {
  veteranLogin,
  adminLogin,
  adminRegister,
  veteranRegister
} = require('../controllers/authController');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many auth attempts. Please try again later.' }
});

router.post('/veteran/login', authLimiter, veteranLoginRules, handleValidationErrors, veteranLogin);
router.post('/admin/login', authLimiter, adminLoginRules, handleValidationErrors, adminLogin);
router.post('/admin/register', authLimiter, verifyToken, adminRegisterRules, handleValidationErrors, adminRegister);
router.post(
  '/veteran/register',
  authLimiter,
  upload.fields([
    { name: 'national_id_file', maxCount: 1 },
    { name: 'army_id_file', maxCount: 1 },
    { name: 'discharge_file', maxCount: 1 },
    { name: 'supporting_docs', maxCount: 10 }
  ]),
  veteranRegistrationRules,
  handleValidationErrors,
  veteranRegister
);

module.exports = router;
