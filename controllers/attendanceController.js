const Attendance = require('../models/attendanceModel');
const Student = require('../models/studentModel');
const Class = require('../models/classModel');

// View attendance page
exports.viewAttendance = async (req, res) => {
    try {
        const classes = await Class.find();
        res.render('attendance/index', {
            title: 'Attendance',
            classes,
            user: req.session.user
        });
    } catch (error) {
        console.error(error);
        res.redirect('/dashboard');
    }
};

// Show mark attendance form
exports.getMarkAttendance = async (req, res) => {
    try {
        const classes = await Class.find();
        const students = req.query.classId ? 
            await Student.find({ class: req.query.classId, status: 'Active' }) : [];
        
        res.render('attendance/mark', {
            title: 'Mark Attendance',
            classes,
            students,
            selectedClass: req.query.classId || null,
            date: new Date().toISOString().split('T')[0],
            user: req.session.user,
            error: null
        });
    } catch (error) {
        console.error(error);
        res.redirect('/attendance');
    }
};

// Mark attendance
exports.markAttendance = async (req, res) => {
    try {
        const { classId, date, attendance } = req.body;
        
        // Delete existing attendance for this class and date
        await Attendance.deleteMany({ 
            class: classId, 
            date: new Date(date) 
        });

        // Create new attendance records
        if (attendance) {
            for (const [studentId, status] of Object.entries(attendance)) {
                const attendanceRecord = new Attendance({
                    student: studentId,
                    class: classId,
                    date: new Date(date),
                    status,
                    markedBy: req.session.user.id
                });
                await attendanceRecord.save();
            }
        }

        res.redirect('/attendance/report');
    } catch (error) {
        console.error(error);
        res.redirect('/attendance/mark');
    }
};

// Get attendance report
exports.getAttendanceReport = async (req, res) => {
    try {
        const classes = await Class.find();
        res.render('attendance/report', {
            title: 'Attendance Report',
            classes,
            user: req.session.user
        });
    } catch (error) {
        console.error(error);
        res.redirect('/attendance');
    }
};

// Generate report
exports.generateReport = async (req, res) => {
    try {
        const { classId, startDate, endDate } = req.body;
        
        const attendance = await Attendance.find({
            class: classId,
            date: { $gte: new Date(startDate), $lte: new Date(endDate) }
        })
        .populate('student')
        .sort({ date: 1 });

        res.render('attendance/report', {
            title: 'Attendance Report',
            classes: await Class.find(),
            attendance,
            classId,
            startDate,
            endDate,
            user: req.session.user
        });
    } catch (error) {
        console.error(error);
        res.redirect('/attendance');
    }
};

// View student attendance
exports.viewStudentAttendance = async (req, res) => {
    try {
        const attendance = await Attendance.find({ 
            student: req.params.studentId 
        })
        .populate('class')
        .sort({ date: -1 });

        const student = await Student.findById(req.params.studentId);

        res.render('attendance/student', {
            title: `${student.fullName} - Attendance`,
            attendance,
            student,
            user: req.session.user
        });
    } catch (error) {
        console.error(error);
        res.redirect('/attendance');
    }
};