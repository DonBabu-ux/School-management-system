const express = require('express');
const router = express.Router();
const User = require('../models/userModel'); // Changed from 'User' to 'userModel'

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
    if (req.session.userId) {
        next();
    } else {
        res.redirect('/auth/login');
    }
};

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
    if (req.session.user && req.session.user.role === 'admin') {
        next();
    } else {
        res.status(403).render('error', {
            title: 'Access Denied',
            message: 'You do not have permission to access this page',
            user: req.session.user || null
        });
    }
};

// Main dashboard route - redirects based on role
router.get('/', isAuthenticated, async (req, res) => {
    try {
        // Get user details from session
        const user = req.session.user;
        
        if (user.role === 'admin') {
            // Fetch admin-specific data
            const Class = require('../models/classModel');
            const Fee = require('../models/feeModel');
            const Student = require('../models/studentModel');
            const Teacher = require('../models/teacherModel');

            const stats = {
                totalStudents: await Student.countDocuments(),
                totalTeachers: await Teacher.countDocuments(),
                totalParents: await User.countDocuments({ role: 'parent' }),
                totalClasses: await Class.countDocuments(),
                pendingFees: await Fee.aggregate([
                    { $match: { status: 'Pending' } },
                    { $group: { _id: null, total: { $sum: '$amount' } } }
                ]).then(res => res[0] ? res[0].total : 0)
            };
            
            res.render('dashboard/admin', {
                title: 'Admin Dashboard',
                user: user,
                stats: stats,
                moment: require('moment')
            });
        } else {
            // Regular user dashboard (students, teachers, etc.)
            res.render('dashboard/user', {
                title: 'User Dashboard',
                user: user,
                moment: require('moment')
            });
        }
    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).render('error', {
            title: 'Error',
            message: 'Error loading dashboard',
            user: req.session.user || null
        });
    }
});

// Admin specific routes
router.get('/admin', isAuthenticated, isAdmin, async (req, res) => {
    try {
        // Fetch admin dashboard data
        const Class = require('../models/classModel');
        const Fee = require('../models/feeModel');
        const Student = require('../models/studentModel');
        const Teacher = require('../models/teacherModel');
        const latestFees = await Fee.find().sort({ createdAt: -1 }).limit(5).populate('student');
        const recentActivities = latestFees.map(f => ({
            user: f.student ? f.student.fullName : 'Admin',
            description: `Fee Collection: ${f.amount} KES`,
            date: f.date,
            status: f.status === 'Paid' ? 'completed' : 'pending'
        }));

        // Calculate Online Users based on a 15 min window (using lastLogin if available, else fallback to 1)
        const onlineCount = await User.countDocuments({ lastLogin: { $gte: new Date(Date.now() - 15*60*1000) } });

        const stats = {
            totalStudents: await Student.countDocuments(),
            totalTeachers: await Teacher.countDocuments(),
            totalParents: await User.countDocuments({ role: 'parent' }),
            totalClasses: await Class.countDocuments(),
            pendingFees: await Fee.aggregate([
                { $match: { status: 'Pending' } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]).then(res => res[0] ? res[0].total : 0),
            online: onlineCount || 1,
            recentActivities: recentActivities
        };
        
        res.render('dashboard/admin', {
            title: 'Admin Panel',
            user: req.session.user,
            stats: stats,
            moment: require('moment')
        });
    } catch (error) {
        console.error('Admin dashboard error:', error);
        res.status(500).render('error', {
            title: 'Error',
            message: 'Error loading admin dashboard',
            user: req.session.user
        });
    }
});

// Student dashboard
router.get('/student', isAuthenticated, (req, res) => {
    if (req.session.user.role !== 'student') {
        return res.status(403).render('error', {
            title: 'Access Denied',
            message: 'Student access only',
            user: req.session.user
        });
    }
    
    res.render('dashboard/student', {
        title: 'Student Dashboard',
        user: req.session.user,
        moment: require('moment')
    });
});

// Teacher dashboard
router.get('/teacher', isAuthenticated, (req, res) => {
    if (req.session.user.role !== 'teacher') {
        return res.status(403).render('error', {
            title: 'Access Denied',
            message: 'Teacher access only',
            user: req.session.user
        });
    }
    
    res.render('dashboard/teacher', {
        title: 'Teacher Dashboard',
        user: req.session.user,
        moment: require('moment')
    });
});

// Support Tickets (Admin only)
router.get('/tickets', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const SupportTicket = require('../models/supportTicketModel');
        const tickets = await SupportTicket.find().sort({ createdAt: -1 });
        
        res.render('dashboard/tickets', {
            title: 'Support Requests',
            user: req.session.user,
            tickets,
            moment: require('moment')
        });
    } catch (error) {
        console.error('Tickets error:', error);
        res.status(500).redirect('/dashboard');
    }
});

// Ticket Actions
router.post('/tickets/:id/status', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const SupportTicket = require('../models/supportTicketModel');
        const { status } = req.body;
        await SupportTicket.findByIdAndUpdate(req.params.id, { status });
        res.redirect('/dashboard/tickets');
    } catch (error) {
        console.error('Status error:', error);
        res.redirect('/dashboard/tickets');
    }
});

router.post('/tickets/:id/resolve', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const SupportTicket = require('../models/supportTicketModel');
        const User = require('../models/userModel');
        const crypto = require('crypto');
        
        const ticket = await SupportTicket.findById(req.params.id);
        if (!ticket) return res.redirect('/dashboard/tickets');
        
        // Find the user by their System ID (username)
        const userAccount = await User.findOne({ username: ticket.systemId });
        if (!userAccount) {
            ticket.adminNotes = 'Error: User account not found for ID: ' + ticket.systemId;
            await ticket.save();
            return res.redirect('/dashboard/tickets');
        }
        
        // Generate new password
        const newPassword = crypto.randomBytes(4).toString('hex').toUpperCase(); // 8 char hex
        userAccount.password = newPassword;
        await userAccount.save();
        
        // Update ticket
        ticket.status = 'Resolved';
        ticket.adminNotes = 'Successfully reset password to: ' + newPassword;
        await ticket.save();
        
        res.render('dashboard/tickets', {
            title: 'Support Requests',
            user: req.session.user,
            tickets: await SupportTicket.find().sort({ createdAt: -1 }),
            moment: require('moment'),
            success: `Credentials reset for ${ticket.fullName}. New Password: ${newPassword}`
        });
    } catch (error) {
        console.error('Resolve error:', error);
        res.redirect('/dashboard/tickets');
    }
});

router.post('/tickets/:id/delete', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const SupportTicket = require('../models/supportTicketModel');
        await SupportTicket.findByIdAndDelete(req.params.id);
        res.redirect('/dashboard/tickets');
    } catch (error) {
        console.error('Delete error:', error);
        res.redirect('/dashboard/tickets');
    }
});

// User Management (Admin only)
router.get('/users', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const users = await User.find().sort({ createdAt: -1 });
        res.render('dashboard/users', {
            title: 'User Management',
            user: req.session.user,
            users
        });
    } catch (error) {
        console.error('Users error:', error);
        res.redirect('/dashboard');
    }
});

router.post('/users/:id/suspend', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const userToUpdate = await User.findById(req.params.id);
        if (userToUpdate) {
            userToUpdate.isActive = !userToUpdate.isActive;
            await userToUpdate.save();
        }
        res.redirect('/dashboard/users');
    } catch (error) {
        res.redirect('/dashboard/users');
    }
});

router.post('/users/:id/role', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const { role } = req.body;
        await User.findByIdAndUpdate(req.params.id, { role });
        res.redirect('/dashboard/users');
    } catch (error) {
        res.redirect('/dashboard/users');
    }
});

// PIGEON HOLE SECTIONS
router.get('/pigeon', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const AdminSecret = require('../models/adminSecretModel');
        const PigeonHole = require('../models/pigeonHoleModel');

        // Check if secret key exists, if not generate one
        let secretConf = await AdminSecret.findOne({ keyType: 'pigeon_hole' });
        if (!secretConf) {
            const randomKey = require('crypto').randomBytes(3).toString('hex').toUpperCase(); // 6 chars
            secretConf = new AdminSecret({ keyType: 'pigeon_hole', secretKey: randomKey });
            await secretConf.save();
        }

        // If not unlocked in this session, show lock screen
        if (!req.session.pigeonUnlocked) {
            return res.render('dashboard/pigeon-lock', {
                title: 'Unlock Pigeon Hole',
                user: req.session.user,
                error: null
            });
        }

        // Fetch credentials
        const credentials = await PigeonHole.find().sort({ createdAt: -1 });

        res.render('dashboard/pigeon', {
            title: 'Pigeon Hole (Vault)',
            user: req.session.user,
            credentials,
            currentSecret: secretConf.secretKey,
            success: null,
            error: null
        });
    } catch (error) {
        console.error('Pigeon error:', error);
        res.redirect('/dashboard/admin');
    }
});

router.post('/pigeon/auth', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const AdminSecret = require('../models/adminSecretModel');
        const { secretKey } = req.body;
        
        const secretConf = await AdminSecret.findOne({ keyType: 'pigeon_hole' });
        if (secretConf && secretConf.secretKey === secretKey) {
            req.session.pigeonUnlocked = true;
            return res.redirect('/dashboard/pigeon');
        }

        res.render('dashboard/pigeon-lock', {
            title: 'Unlock Pigeon Hole',
            user: req.session.user,
            error: 'Invalid Secret Key. Access Denied.'
        });
    } catch (error) {
        res.redirect('/dashboard/admin');
    }
});

router.post('/pigeon/reset', isAuthenticated, isAdmin, async (req, res) => {
    try {
        if (!req.session.pigeonUnlocked) return res.redirect('/dashboard/pigeon');
        
        const AdminSecret = require('../models/adminSecretModel');
        const { newSecret } = req.body;
        
        if (newSecret && newSecret.length >= 4) {
            await AdminSecret.findOneAndUpdate(
                { keyType: 'pigeon_hole' },
                { secretKey: newSecret }
            );
        }
        res.redirect('/dashboard/pigeon');
    } catch (error) {
        res.redirect('/dashboard/admin');
    }
});

router.get('/pigeon/lock', isAuthenticated, isAdmin, (req, res) => {
    req.session.pigeonUnlocked = false;
    res.redirect('/dashboard/admin');
});

// Post Announcement
router.post('/announcements', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const Announcement = require('../models/announcementModel');
        const Notification = require('../models/notificationModel');
        const { title, message, type, mediaUrl } = req.body;
        
        const announcement = new Announcement({
            title, message, type, mediaUrl, 
            postedBy: req.session.userId 
        });
        await announcement.save();

        // Create notification for everyone
        const notification = new Notification({
            title: 'New Update: ' + title,
            message: message.substring(0, 100) + '...',
            type: 'update',
            link: '/' 
        });
        await notification.save();

        res.redirect('/dashboard/admin');
    } catch (error) {
        console.error('Announcement error:', error);
        res.redirect('/dashboard/admin');
    }
});

module.exports = router;