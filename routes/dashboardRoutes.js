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
        const stats = {
            totalStudents: await Student.countDocuments(),
            totalTeachers: await Teacher.countDocuments(),
            totalParents: await User.countDocuments({ role: 'parent' }),
            totalClasses: await Class.countDocuments(),
            pendingFees: await Fee.aggregate([
                { $match: { status: 'Pending' } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]).then(res => res[0] ? res[0].total : 0),
            recentActivities: [] // Fetch from your activity log
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

module.exports = router;