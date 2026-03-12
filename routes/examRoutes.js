const express = require('express');
const router = express.Router();
const examController = require('../controllers/examController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

router.use(authMiddleware);
router.use(roleMiddleware('admin'));

// Exam routes
router.get('/', examController.listExams);
router.get('/add', examController.getAddExam);
router.post('/add', examController.addExam);
router.get('/:id', examController.viewExam);
router.get('/:id/edit', examController.getEditExam);
router.post('/:id/edit', examController.updateExam);
router.get('/:id/delete', examController.deleteExam);
router.get('/:id/results', examController.viewResults);
router.post('/:id/results/add', examController.addResult);

module.exports = router;