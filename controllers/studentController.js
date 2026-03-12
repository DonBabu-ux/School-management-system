const Student = require('../models/studentModel');
const Class = require('../models/classModel');
const Attendance = require('../models/attendanceModel');
const Result = require('../models/resultModel');
const Fee = require('../models/feeModel');

// List all students
exports.listStudents = async (req, res) => {
    try {
        const filter = {};
        const { classId, search } = req.query;
        if (classId) filter.class = classId;
        if (search) {
            filter.$or = [
                { firstName: new RegExp(search, 'i') },
                { lastName: new RegExp(search, 'i') },
                { admissionNumber: new RegExp(search, 'i') }
            ];
        }
        const students = await Student.find(filter)
            .populate('class', 'className section')
            .sort({ createdAt: -1 });
        const classes = await Class.find();
        
        res.render('students/list', {
            title: 'Students',
            students,
            user: req.session.user,
            classes,
            selectedClass: classId || '',
            searchQuery: search || ''
        });
    } catch (error) {
        console.error(error);
        res.status(500).render('error', {
            message: 'Error loading students',
            error
        });
    }
};

// Show add student form
exports.getAddStudent = async (req, res) => {
    try {
        const classes = await Class.find({ status: 'Active' });
        res.render('students/add', {
            title: 'Add Student',
            classes,
            user: req.session.user,
            error: null
        });
    } catch (error) {
        console.error(error);
        res.redirect('/students');
    }
};

// Add new student
exports.addStudent = async (req, res) => {
    try {
        const studentData = req.body;
        
        // Generate admission number
        const lastStudent = await Student.findOne().sort({ createdAt: -1 });
        let admissionNumber = 'STU001';
        if (lastStudent && lastStudent.admissionNumber) {
            const lastNum = parseInt(lastStudent.admissionNumber.replace('STU', ''));
            admissionNumber = `STU${String(lastNum + 1).padStart(3, '0')}`;
        }
        studentData.admissionNumber = admissionNumber;
        if (req.file) {
            studentData.profilePicture = req.file.filename;
        }
        const student = new Student(studentData);
        await student.save();

        // Add student to class
        if (studentData.class) {
            await Class.findByIdAndUpdate(studentData.class, {
                $push: { students: student._id }
            });
        }

        res.redirect('/students');
    } catch (error) {
        console.error(error);
        const classes = await Class.find({ status: 'Active' });
        res.render('students/add', {
            title: 'Add Student',
            classes,
            user: req.session.user,
            error: error.message
        });
    }
};

// Show student profile
exports.viewStudent = async (req, res) => {
    try {
        const student = await Student.findById(req.params.id)
            .populate('class');
        
        if (!student) {
            return res.status(404).render('404', { user: req.session.user });
        }

        // compute quick stats
        const attendanceRecords = await Attendance.find({ student: student._id });
        const totalDays = attendanceRecords.length;
        const presentDays = attendanceRecords.filter(a => a.status === 'Present').length;
        const attendanceRate = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : null;

        const results = await Result.find({ student: student._id });
        let avgMarks = null;
        if (results.length > 0) {
            const sum = results.reduce((acc, r) => acc + (r.marksObtained || 0), 0);
            avgMarks = (sum / results.length).toFixed(1);
        }

        const fees = await Fee.find({ student: student._id });
        const totalPaid = fees.reduce((acc, f) => acc + (f.amount || 0), 0);

        res.render('students/profile', {
            title: `${student.fullName} - Profile`,
            student,
            user: req.session.user,
            stats: {
                attendanceRate,
                averageMarks: avgMarks,
                feesPaid: totalPaid
            }
        });
    } catch (error) {
        console.error(error);
        res.redirect('/students');
    }
};

// Show edit student form
exports.getEditStudent = async (req, res) => {
    try {
        const student = await Student.findById(req.params.id);
        const classes = await Class.find({ status: 'Active' });
        
        if (!student) {
            return res.status(404).render('404', { user: req.session.user });
        }

        res.render('students/edit', {
            title: 'Edit Student',
            student,
            classes,
            user: req.session.user,
            error: null
        });
    } catch (error) {
        console.error(error);
        res.redirect('/students');
    }
};

// Update student
exports.updateStudent = async (req, res) => {
    try {
        if (req.file) {
            req.body.profilePicture = req.file.filename;
        }
        const student = await Student.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!student) {
            return res.status(404).render('404', { user: req.session.user });
        }

        res.redirect(`/students/${student._id}`);
    } catch (error) {
        console.error(error);
        const student = await Student.findById(req.params.id);
        const classes = await Class.find({ status: 'Active' });
        res.render('students/edit', {
            title: 'Edit Student',
            student,
            classes,
            user: req.session.user,
            error: error.message
        });
    }
};

// Delete student
exports.deleteStudent = async (req, res) => {
    try {
        const student = await Student.findByIdAndDelete(req.params.id);
        
        if (student && student.class) {
            // Remove student from class
            await Class.findByIdAndUpdate(student.class, {
                $pull: { students: student._id }
            });
        }

        res.redirect('/students');
    } catch (error) {
        console.error(error);
        res.redirect('/students');
    }
};

// Export students as CSV
exports.exportStudents = async (req, res) => {
    try {
        const students = await Student.find().populate('class');
        let csv = 'AdmissionNumber,FirstName,LastName,Class,Email,Phone\n';
        students.forEach(s => {
            const cls = s.class ? `${s.class.className} ${s.class.section}` : '';
            csv += `${s.admissionNumber},${s.firstName},${s.lastName},${cls},${s.email || ''},${s.phoneNumber || ''}\n`;
        });
        res.setHeader('Content-disposition', 'attachment; filename=students.csv');
        res.set('Content-Type', 'text/csv');
        res.status(200).send(csv);
    } catch (error) {
        console.error(error);
        res.redirect('/students');
    }
};