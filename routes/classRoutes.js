const express = require('express');
const router = express.Router();
const classController = require('../controllers/classController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// All class routes require authenticated admin
router.use(authMiddleware);
router.use(roleMiddleware('admin'));

// Class routes
router.get('/', classController.listClasses);
router.get('/add', classController.getAddClass);
router.post('/add', classController.addClass);
router.get('/:id', classController.viewClass);
router.get('/:id/edit', classController.getEditClass);
router.post('/:id/edit', classController.updateClass);
router.get('/:id/delete', classController.deleteClass);
router.get('/:id/timetable', classController.getClassTimetable);
router.post('/:id/timetable', classController.updateTimetable);

module.exports = router;