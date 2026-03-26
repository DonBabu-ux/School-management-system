const Exam = require('../models/examModel');
const Result = require('../models/resultModel');
const Class = require('../models/classModel');
const Subject = require('../models/subjectModel');
const Teacher = require('../models/teacherModel');
const Student = require('../models/studentModel');

// List all exams
exports.listExams = async (req, res) => {
    try {
        const exams = await Exam.find()
            .populate('class')
            .populate('subject')
            .populate('invigilator')
            .sort({ date: -1 });
        
        res.render('exams/list', {
            title: 'Exams',
            exams,
            user: req.session.user
        });
    } catch (error) {
        console.error(error);
        res.status(500).render('error', {
            message: 'Error loading exams',
            error
        });
    }
};

// Show add exam form
exports.getAddExam = async (req, res) => {
    try {
        const classes = await Class.find();
        const subjects = await Subject.find();
        const teachers = await Teacher.find();
        
        res.render('exams/add', {
            title: 'Schedule Exam',
            classes,
            subjects,
            teachers,
            user: req.session.user,
            error: null
        });
    } catch (error) {
        console.error(error);
        res.redirect('/exams');
    }
};

// Add new exam
exports.addExam = async (req, res) => {
    try {
        const exam = new Exam(req.body);
        await exam.save();
        res.redirect('/exams');
    } catch (error) {
        console.error(error);
        res.redirect('/exams/add');
    }
};

// View exam details
exports.viewExam = async (req, res) => {
    try {
        const exam = await Exam.findById(req.params.id)
            .populate('class')
            .populate('subject')
            .populate('invigilator');
        
        if (!exam) {
            return res.status(404).render('404', { user: req.session.user });
        }

        res.render('exams/profile', {
            title: `${exam.examName} - Exam`,
            exam,
            user: req.session.user
        });
    } catch (error) {
        console.error(error);
        res.redirect('/exams');
    }
};

// Show edit exam form
exports.getEditExam = async (req, res) => {
    try {
        const exam = await Exam.findById(req.params.id);
        const classes = await Class.find();
        const subjects = await Subject.find();
        const teachers = await Teacher.find({ status: 'Active' });
        
        if (!exam) {
            return res.status(404).render('404', { user: req.session.user });
        }

        res.render('exams/edit', {
            title: 'Edit Exam',
            exam,
            classes,
            subjects,
            teachers,
            user: req.session.user,
            error: null
        });
    } catch (error) {
        console.error(error);
        res.redirect('/exams');
    }
};

// Update exam
exports.updateExam = async (req, res) => {
    try {
        const exam = await Exam.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!exam) {
            return res.status(404).render('404', { user: req.session.user });
        }

        res.redirect(`/exams/${exam._id}`);
    } catch (error) {
        console.error(error);
        res.redirect('/exams');
    }
};

// Delete exam
exports.deleteExam = async (req, res) => {
    try {
        await Exam.findByIdAndDelete(req.params.id);
        res.redirect('/exams');
    } catch (error) {
        console.error(error);
        res.redirect('/exams');
    }
};

// View results
exports.viewResults = async (req, res) => {
    try {
        const exam = await Exam.findById(req.params.id);
        const results = await Result.find({ exam: req.params.id })
            .populate('student')
            .sort({ publishedDate: -1 });
        let students = [];
        if (exam && exam.class) {
            students = await Student.find({ class: exam.class, status: 'Active' });
        }
        res.render('exams/results', {
            title: 'Exam Results',
            exam,
            results,
            students,
            user: req.session.user
        });
    } catch (error) {
        console.error(error);
        res.redirect('/exams');
    }
};

// Add result
exports.addResult = async (req, res) => {
    try {
        const { studentId, marksObtained, status, remarks } = req.body;
        // simple validation
        if (!studentId || marksObtained == null) {
            return res.redirect(`/exams/${req.params.id}/results`);
        }
        const result = new Result({
            student: studentId,
            exam: req.params.id,
            marksObtained,
            status: status || 'Pass',
            remarks,
            publishedBy: req.session.user.id
        });
        await result.save();
        res.redirect(`/exams/${req.params.id}/results`);
    } catch (error) {
        console.error(error);
        res.redirect('/exams');
    }
};