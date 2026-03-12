const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

// Import routes
const authRoutes = require('./routes/authRoutes');
const studentRoutes = require('./routes/studentRoutes');
const teacherRoutes = require('./routes/teacherRoutes');
const classRoutes = require('./routes/classRoutes');
const examRoutes = require('./routes/examRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const feesRoutes = require('./routes/feesRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

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

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI,
        ttl: 24 * 60 * 60,
        autoRemove: 'native',
    }),
    cookie: {
        maxAge: 1000 * 60 * 60 * 24,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
    },
    name: 'school.sid'
}));

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
mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
})
.then(() => console.log('✅ MongoDB Atlas connected successfully'))
.catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
});

// Routes
app.use('/auth', authRoutes);
app.use('/students', studentRoutes);
app.use('/teachers', teacherRoutes);
app.use('/classes', classRoutes);
app.use('/exams', examRoutes);
app.use('/attendance', attendanceRoutes);
app.use('/fees', feesRoutes);
app.use('/dashboard', dashboardRoutes);

// expose profile and settings at root as well
const authController = require('./controllers/authController');
app.get('/profile', authController.getProfile);
app.post('/profile', authController.updateProfile);
app.get('/settings', authController.getSettings);
app.post('/settings', authController.updateSettings);

// Home route
app.get('/', (req, res) => {
    if (req.session.userId) {
        res.redirect('/dashboard');
    } else {
        res.redirect('/auth/login');
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
});