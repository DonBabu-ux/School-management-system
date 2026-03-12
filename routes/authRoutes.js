const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// GET routes
router.get('/login', authController.getLogin);
router.get('/register', authController.getRegister);
router.get('/logout', authController.logout);
// add profile/settings under auth prefix as well
router.get('/profile', authController.getProfile);
router.post('/profile', authController.updateProfile);
router.get('/settings', authController.getSettings);
router.post('/settings', authController.updateSettings);

// POST routes
router.post('/register', authController.register);
router.post('/login', authController.login);

module.exports = router;