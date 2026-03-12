const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

router.use(authMiddleware);
router.use(roleMiddleware('admin'));

// Attendance routes
router.get('/', attendanceController.viewAttendance);
router.get('/mark', attendanceController.getMarkAttendance);
router.post('/mark', attendanceController.markAttendance);
router.get('/report', attendanceController.getAttendanceReport);
router.post('/report', attendanceController.generateReport);
router.get('/student/:studentId', attendanceController.viewStudentAttendance);

module.exports = router;