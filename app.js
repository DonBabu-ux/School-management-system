const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const moment = require('moment');
require('dotenv').config();

const app = express();
app.locals.moment = moment; // Make moment available in all templates

// Import routes
const authRoutes = require('./routes/authRoutes');
const studentRoutes = require('./routes/studentRoutes');
const teacherRoutes = require('./routes/teacherRoutes');
const classRoutes = require('./routes/classRoutes');
const examRoutes = require('./routes/examRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const feesRoutes = require('./routes/feesRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const { Stat, DailyVisit } = require('./models/statModel');
const Announcement = require('./models/announcementModel');
const User = require('./models/userModel');
const Notification = require('./models/notificationModel');

// Security middleware
app.use(helmet({
    contentSecurityPolicy: false,
}));

app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Session configuration with fallback for development
const sessionOptions = {
    secret: process.env.SESSION_SECRET || 'EduSmart-Secret-2026',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24, // 24 hours
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
    },
    name: 'school.sid'
};

if (process.env.MONGODB_URI) {
    sessionOptions.store = MongoStore.create({
        mongoUrl: process.env.MONGODB_URI,
        ttl: 24 * 60 * 60,
        autoRemove: 'native',
    });
} else {
    console.warn('⚠️ Warning: MONGODB_URI not found. Using memory store for sessions (sessions will clear on restart).');
}

app.use(session(sessionOptions));

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// disable view caching in development so template edits take effect immediately
if (process.env.NODE_ENV !== 'production') {
    app.set('view cache', false);
}

// Global variables middleware
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    res.locals.currentUrl = req.url;
    res.locals.moment = require('moment');
    next();
});

// Database connection
if (!process.env.MONGODB_URI) {
    console.warn('⚠️ Warning: MONGODB_URI not set. Application will not connect to database.');
} else {
    mongoose.connect(process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: 30000,
        socketTimeoutMS: 45000,
    })
    .then(() => console.log('✅ MongoDB Atlas connected successfully'))
    .catch(err => {
        console.error('❌ MongoDB connection error:', err);
    });
}

// Global middleware for notifications & user session visibility
app.use(async (req, res, next) => {
    res.locals.user = req.session.user || null;
    if (req.session.userId) {
        try {
            res.locals.notifications = await Notification.find({ 
                $or: [ { userId: req.session.userId }, { userId: null } ] 
            }).sort({ createdAt: -1 }).limit(5);
            res.locals.unreadCount = await Notification.countDocuments({ 
                $or: [ { userId: req.session.userId }, { userId: null } ],
                isRead: false 
            });
        } catch (e) {
            res.locals.notifications = [];
            res.locals.unreadCount = 0;
        }
    } else {
        res.locals.notifications = [];
        res.locals.unreadCount = 0;
    }
    next();
});

// Routes
const subjectRoutes = require('./routes/subjectRoutes');
app.use('/subjects', subjectRoutes);
app.use('/auth', authRoutes);
app.use('/students', studentRoutes);
app.use('/teachers', teacherRoutes);
app.use('/classes', classRoutes);
app.use('/exams', examRoutes);
app.use('/attendance', attendanceRoutes);
app.use('/fees', feesRoutes);
app.use('/dashboard', dashboardRoutes);

// expose profile and settings at root as well (now securely protected)
const authController = require('./controllers/authController');
const authMiddleware = require('./middleware/authMiddleware');

app.use('/profile', authMiddleware); // Protect root profile
app.get('/profile', authController.getProfile);
app.post('/profile', authController.updateProfile);

app.use('/settings', authMiddleware); // Protect root settings
app.get('/settings', authController.getSettings);
app.post('/settings', authController.updateSettings);
app.get('/logout', (req, res) => res.redirect('/auth/logout'));
app.get('/login', (req, res) => res.redirect('/auth/login'));
// Home route (Landing Page)
app.get('/', async (req, res) => {
    try {
        const today = new Date().toISOString().slice(0, 10); // 'YYYY-MM-DD'
        const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

        // Track total + today's visit
        let stats = await Stat.findOne();
        if (!stats) stats = new Stat();
        stats.totalVisits += 1;
        await stats.save();

        // Upsert daily visit counter
        await DailyVisit.findOneAndUpdate(
            { date: today },
            { $inc: { count: 1 } },
            { upsert: true, new: true }
        );

        const todayVisit = await DailyVisit.findOne({ date: today });
        const yesterdayVisit = await DailyVisit.findOne({ date: yesterday });

        // Fetch announcements
        const announcements = await Announcement.find({ status: 'published' }).sort({ createdAt: -1 }).limit(3);
        
        // Count online (active users in last 15 mins)
        const onlineCount = await User.countDocuments({ lastLogin: { $gte: new Date(Date.now() - 15*60*1000) } });

        res.render('landing', {
            title: 'Welcome to Edu Learning',
            announcements,
            stats: {
                visits: stats.totalVisits,
                online: onlineCount || 1,
                today: todayVisit ? todayVisit.count : 1,
                yesterday: yesterdayVisit ? yesterdayVisit.count : 0
            }
        });
    } catch (error) {
        console.error('Landing error:', error);
        res.render('landing', { title: 'Welcome to Edu Learning', announcements: [], stats: { visits: 0, online: 1, today: 1, yesterday: 0 } });
    }
});

// Legal & Newsletters
app.get('/terms', (req, res) => res.render('terms', { title: 'Terms and Conditions' }));
app.get('/privacy', (req, res) => res.render('privacy', { title: 'Privacy Policy' }));

app.post('/subscribe', async (req, res) => {
    try {
        const { email } = req.body;
        let stats = await Stat.findOne();
        if (!stats) stats = new Stat();
        if (!stats.newsletterSubscribers.some(s => s.email === email)) {
            stats.newsletterSubscribers.push({ email });
            await stats.save();
        }
        res.json({ success: true, message: 'Institutional newsletter subscription successful.' });
    } catch (e) {
        res.status(500).json({ success: false });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date(),
        mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        environment: process.env.NODE_ENV,
        uptime: process.uptime()
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('❌ Error:', err.stack);
    
    if (err.name === 'ValidationError') {
        return res.status(400).json({ error: err.message });
    }
    
    if (process.env.NODE_ENV === 'production') {
        res.status(500).render('error', { 
            title: 'Error',
            message: 'Something went wrong! Please try again later.',
            error: {}
        });
    } else {
        res.status(500).render('error', { 
            title: 'Error',
            message: err.message,
            error: err
        });
    }
});

// 404 handler
app.use((req, res) => {
    res.status(404).render('404', { 
        title: 'Page Not Found',
        user: req.session.user || null
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`📍 http://localhost:${PORT}`);

    // Start keep-alive to prevent Render.com from sleeping
    const { startKeepAlive } = require('./utils/keepAlive');
    startKeepAlive(PORT);
});