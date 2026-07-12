const express = require('express');
const router = express.Router();

const upload = require('../middleware/uploadMiddleware');
const { verifyToken } = require('../middleware/authMiddleware');
const {
  getProfile,
  updateProfile,
  uploadDocument,
  getMyDocuments,
  submitApplication,
  getMyApplications,
  getDashboard
} = require('../controllers/veteranController');

router.post('/veterans/register', upload.fields([
  { name: 'national_id_file', maxCount: 1 },
  { name: 'army_id_file', maxCount: 1 },
  { name: 'discharge_file', maxCount: 1 },
  { name: 'supporting_docs', maxCount: 10 }
]), require('../controllers/authController').veteranRegister);

router.use(verifyToken);

router.get('/veterans/me', getProfile);
router.put('/veterans/me', updateProfile);
router.post('/documents/upload', upload.single('document'), uploadDocument);
router.get('/documents/me', getMyDocuments);
router.post('/applications', submitApplication);
router.get('/applications/me', getMyApplications);
router.get('/dashboard', getDashboard);

router.get('/veteran/dashboard', getDashboard);
router.get('/veteran/profile', getProfile);
router.put('/veteran/profile', updateProfile);
router.get('/veteran/documents', getMyDocuments);

module.exports = router;
