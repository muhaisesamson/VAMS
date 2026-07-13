const express = require('express');
const router = express.Router();

const { verifyToken } = require('../middleware/authMiddleware');
const requireRole = require('../middleware/requireRole');
const {
  getAllVeterans,
  getVeteranById,
  listDocuments,
  reviewDocument,
  listApplications,
  reviewApplication,
  getOverview
} = require('../controllers/adminController');

router.use(verifyToken);

router.get('/veterans', requireRole('doc-verifier', 'pension-committee', 'healthcare-committee', 'education-committee', 'super-admin'), getAllVeterans);
router.get('/veterans/:id', requireRole('doc-verifier', 'pension-committee', 'healthcare-committee', 'education-committee', 'super-admin'), getVeteranById);
router.get('/documents', requireRole('doc-verifier', 'super-admin'), listDocuments);
router.patch('/documents/:id', requireRole('doc-verifier', 'super-admin'), reviewDocument);
router.get('/applications', requireRole('pension-committee', 'healthcare-committee', 'education-committee', 'super-admin'), listApplications);
router.patch('/applications/:id', requireRole('pension-committee', 'healthcare-committee', 'education-committee', 'super-admin'), reviewApplication);
router.get('/overview', requireRole('super-admin'), getOverview);

module.exports = router;
