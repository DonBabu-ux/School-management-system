const Class = require('../models/classModel');
const Teacher = require('../models/teacherModel');
const Student = require('../models/studentModel');

// List all classes
exports.listClasses = async (req, res) => {
    try {
        const classes = await Class.find()
            .populate('classTeacher', 'firstName lastName')
            .populate('subjects.subject')
            .populate('subjects.teacher', 'firstName lastName')
            .sort({ className: 1, section: 1 });
        
        res.render('classes/list', {
            title: 'Classes',
            classes,
            user: req.session.user
        });
    } catch (error) {
        console.error(error);
        res.status(500).render('error', {
            message: 'Error loading classes',
            error
        });
    }
};

// Show add class form
exports.getAddClass = async (req, res) => {
    try {
        const teachers = await Teacher.find({ status: 'Active' });
        res.render('classes/add', {
            title: 'Add Class',
            teachers,
            user: req.session.user,
            error: null
        });
    } catch (error) {
        console.error(error);
        res.redirect('/classes');
    }
};

// Add new class
exports.addClass = async (req, res) => {
    try {
        const classData = req.body;
        
        const newClass = new Class(classData);
        await newClass.save();

        res.redirect('/classes');
    } catch (error) {
        console.error(error);
        const teachers = await Teacher.find({ status: 'Active' });
        res.render('classes/add', {
            title: 'Add Class',
            teachers,
            user: req.session.user,
            error: error.message
        });
    }
};

// View single class
exports.viewClass = async (req, res) => {
    try {
        const classItem = await Class.findById(req.params.id)
            .populate('classTeacher')
            .populate('students')
            .populate('subjects.subject')
            .populate('subjects.teacher');
        
        if (!classItem) {
            return res.status(404).render('404', { user: req.session.user });
        }

        res.render('classes/profile', {
            title: `${classItem.className} - Class`,
            class: classItem,
            user: req.session.user
        });
    } catch (error) {
        console.error(error);
        res.redirect('/classes');
    }
};

// Show edit class form
exports.getEditClass = async (req, res) => {
    try {
        const classItem = await Class.findById(req.params.id);
        const teachers = await Teacher.find({ status: 'Active' });
        
        if (!classItem) {
            return res.status(404).render('404', { user: req.session.user });
        }

        res.render('classes/edit', {
            title: 'Edit Class',
            class: classItem,
            teachers,
            user: req.session.user,
            error: null
        });
    } catch (error) {
        console.error(error);
        res.redirect('/classes');
    }
};

// Update class
exports.updateClass = async (req, res) => {
    try {
        const classItem = await Class.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!classItem) {
            return res.status(404).render('404', { user: req.session.user });
        }

        res.redirect(`/classes/${classItem._id}`);
    } catch (error) {
        console.error(error);
        const teachers = await Teacher.find({ status: 'Active' });
        res.render('classes/edit', {
            title: 'Edit Class',
            class: await Class.findById(req.params.id),
            teachers,
            user: req.session.user,
            error: error.message
        });
    }
};

// Delete class
exports.deleteClass = async (req, res) => {
    try {
        await Class.findByIdAndDelete(req.params.id);
        res.redirect('/classes');
    } catch (error) {
        console.error(error);
        res.redirect('/classes');
    }
};

// Get class timetable
exports.getClassTimetable = async (req, res) => {
    try {
        const classItem = await Class.findById(req.params.id)
            .populate('subjects.subject')
            .populate('subjects.teacher');
        
        if (!classItem) {
            return res.status(404).render('404', { user: req.session.user });
        }

        res.render('classes/timetable', {
            title: `${classItem.className} - Timetable`,
            class: classItem,
            user: req.session.user
        });
    } catch (error) {
        console.error(error);
        res.redirect('/classes');
    }
};

// Update timetable
exports.updateTimetable = async (req, res) => {
    try {
        // This would handle timetable updates
        // You'd need a timetable schema/model for this
        res.redirect(`/classes/${req.params.id}/timetable`);
    } catch (error) {
        console.error(error);
        res.redirect('/classes');
    }
};