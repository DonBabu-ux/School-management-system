const User = require('../models/userModel');
const SupportTicket = require('../models/supportTicketModel');
const crypto = require('crypto');

// Show login form
exports.getLogin = (req, res) => {
    if (req.session.userId) {
        return res.redirect('/dashboard');
    }
    
    res.render('auth/login', {
        title: 'Login',
        user: null,
        error: null
    });
};

// Handle login
exports.login = async (req, res) => {
    try {
        const { loginId, password } = req.body;

        if (!loginId || !password) {
            return res.render('auth/login', {
                title: 'Login',
                error: 'Login ID and password are required',
                user: null
            });
        }

        const user = await User.findOne({
            $or: [
                { email: loginId.toLowerCase() },
                { username: loginId }
            ]
        });

        if (!user) {
            return res.render('auth/login', {
                title: 'Login',
                error: 'Invalid ID or password',
                user: null
            });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.render('auth/login', {
                title: 'Login',
                error: 'Invalid ID or password',
                user: null
            });
        }

        req.session.userId = user._id;
        req.session.user = {
            id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
            profilePicture: user.profilePicture
        };

        res.redirect('/dashboard');
    } catch (error) {
        console.error('Login error:', error);
        res.render('auth/login', {
            title: 'Login',
            error: 'Server error during login',
            user: null
        });
    }
};

exports.logout = (req, res) => {
    req.session.destroy((err) => {
        if (err) console.error('Logout error:', err);
        res.clearCookie('school.sid');
        res.redirect('/auth/login');
    });
};

// Forgot Password - Support Ticket Request
exports.getForgotPassword = (req, res) => {
    res.render('auth/forgot-password', {
        title: 'Support Request',
        user: null,
        error: null,
        success: null
    });
};

exports.postForgotPassword = async (req, res) => {
    try {
        const { contactEmail, credentialId, description } = req.body;
        
        const crypto = require('crypto');
        const ticketId = 'TKT' + crypto.randomBytes(3).toString('hex').toUpperCase();

        const ticket = new SupportTicket({
            ticketId,
            credentialId: credentialId,
            contactEmail: contactEmail,
            description: description || `Password issue for ${credentialId}`
        });
        
        await ticket.save();
        
        res.render('auth/forgot-password', {
            title: 'Request Received',
            user: null,
            error: null,
            success: 'Support ticket submitted as #' + ticket._id.toString().slice(-6).toUpperCase() + '. The administrator will review your request.'
        });
    } catch (error) {
        console.error('Ticket error:', error);
        res.render('auth/forgot-password', {
            title: 'Support Request',
            user: null,
            error: 'Unable to submit ticket. Please check your details.',
            success: null
        });
    }
};

exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.session.userId);
        if (!user) return res.redirect('/auth/login');
        res.render('auth/profile', { 
            title: 'My Profile', 
            user: user,
            profileData: user,
            error: null,
            success: null 
        });
    } catch (error) {
        res.redirect('/dashboard');
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const { firstName, lastName, phoneNumber } = req.body;
        const user = await User.findByIdAndUpdate(req.session.userId, { firstName, lastName, phoneNumber }, { new: true });
        req.session.user = { ...req.session.user, firstName: user.firstName, lastName: user.lastName };
        res.render('auth/profile', { 
            title: 'My Profile', 
            user: user, 
            profileData: user,
            success: 'Profile updated',
            error: null 
        });
    } catch (error) {
        res.render('auth/profile', { 
            title: 'My Profile', 
            user: req.session.user, 
            profileData: req.session.user,
            error: 'Error updating profile',
            success: null 
        });
    }
};

exports.getSettings = (req, res) => {
    res.render('auth/settings', { title: 'Settings', user: req.session.user, error: null, success: null });
};

exports.updateSettings = async (req, res) => {
    try {
        const { currentPassword, newPassword, confirmPassword } = req.body;
        if (newPassword !== confirmPassword) {
            return res.render('auth/settings', { title: 'Settings', user: req.session.user, error: 'Passwords do not match', success: null });
        }
        const user = await User.findById(req.session.userId);
        if (!await user.comparePassword(currentPassword)) {
            return res.render('auth/settings', { title: 'Settings', user: req.session.user, error: 'Current password incorrect', success: null });
        }
        const salt = await require('bcryptjs').genSalt(10);
        const hashedPassword = await require('bcryptjs').hash(newPassword, salt);
        
        await User.findByIdAndUpdate(req.session.userId, { 
            password: hashedPassword,
            updatedAt: Date.now()
        }, { runValidators: false }); // Bypass strict document checks on legacy data

        res.render('auth/settings', { title: 'Settings', user: req.session.user, error: null, success: 'Password updated successfully' });
    } catch (error) {
        res.render('auth/settings', { title: 'Settings', user: req.session.user, error: 'Error', success: null });
    }
};