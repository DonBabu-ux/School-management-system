const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// GET routes
router.get('/login', authController.getLogin);
router.get('/logout', authController.logout);

// Support & Resource Request (Forgot Password Ticket)
router.get('/forgot-password', authController.getForgotPassword);
router.post('/forgot-password', authController.postForgotPassword);

// Profile & Settings
router.get('/profile', authController.getProfile);
router.post('/profile', authController.updateProfile);
router.get('/settings', authController.getSettings);
router.post('/settings', authController.updateSettings);

// POST Login
router.post('/login', authController.login);

module.exports = router;