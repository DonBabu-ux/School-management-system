const express = require('express');
const router = express.Router();
const teacherController = require('../controllers/teacherController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// restrict to logged-in admins
router.use(authMiddleware);
router.use(roleMiddleware('admin'));

router.get('/', teacherController.listTeachers);
router.get('/add', teacherController.getAddTeacher);
router.post('/add', teacherController.addTeacher);
router.get('/:id', teacherController.viewTeacher);
router.get('/:id/edit', teacherController.getEditTeacher);
router.post('/:id/edit', teacherController.updateTeacher);
router.get('/:id/delete', teacherController.deleteTeacher);

module.exports = router;