const express = require('express');
const router = express.Router();
const feesController = require('../controllers/feesController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

router.use(authMiddleware);
router.use(roleMiddleware('admin'));

// Fees routes
router.get('/', feesController.listFees);
router.get('/collect', feesController.getCollectFee);
router.post('/collect', feesController.collectFee);
router.get('/structure', feesController.viewFeeStructure);
router.post('/structure', feesController.updateFeeStructure);
router.get('/student/:studentId', feesController.viewStudentFees);
router.get('/report', feesController.getFeeReport);
router.post('/report', feesController.generateFeeReport);
router.get('/invoice/:id', feesController.generateInvoice);

module.exports = router;