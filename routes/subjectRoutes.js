const express = require('express');
const router = express.Router();
const subjectController = require('../controllers/subjectController');

router.get('/', subjectController.getSubjects);
router.post('/add', subjectController.addSubject);
router.get('/delete/:id', subjectController.deleteSubject);

module.exports = router;
