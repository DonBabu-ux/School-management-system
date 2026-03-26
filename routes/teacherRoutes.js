const express = require('express');
const router = express.Router();
const teacherController = require('../controllers/teacherController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// multer setup for teacher profile pictures
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join('uploads', 'teachers');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const unique = Date.now() + '-' + Math.round(Math.random()*1E9);
        cb(null, unique + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// restrict to logged-in admins
router.use(authMiddleware);
router.use(roleMiddleware('admin'));

router.get('/', teacherController.listTeachers);
router.get('/add', teacherController.getAddTeacher);
router.post('/add', upload.single('profilePicture'), teacherController.addTeacher);
router.get('/:id', teacherController.viewTeacher);
router.get('/:id/edit', teacherController.getEditTeacher);
router.post('/:id/edit', upload.single('profilePicture'), teacherController.updateTeacher);
router.get('/:id/delete', teacherController.deleteTeacher);

module.exports = router;