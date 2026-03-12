const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const multer = require('multer');
const path = require('path');

// multer setup for student profile pictures
const fs = require('fs');
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join('uploads', 'students');
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

// Only authenticated admins can manage students
router.use(authMiddleware);
router.use(roleMiddleware('admin'));

// Student routes (CRUD)
router.get('/', studentController.listStudents);
router.get('/export', studentController.exportStudents);
router.get('/add', studentController.getAddStudent);
router.post('/add', upload.single('profilePicture'), studentController.addStudent);
router.get('/:id', studentController.viewStudent);
router.get('/:id/edit', studentController.getEditStudent);
router.post('/:id/edit', upload.single('profilePicture'), studentController.updateStudent);
router.get('/:id/delete', studentController.deleteStudent);

module.exports = router;