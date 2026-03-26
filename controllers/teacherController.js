const Teacher = require('../models/teacherModel');
const User = require('../models/userModel');
const crypto = require('crypto');

exports.listTeachers = async (req, res) => {
    try {
        const teachers = await Teacher.find()
            .populate('subjects')
            .populate('classes')
            .sort({ createdAt: -1 });
        
        res.render('teachers/list', {
            title: 'Teachers',
            teachers,
            user: req.session.user
        });
    } catch (error) {
        console.error(error);
        res.status(500).render('error', {
            message: 'Error loading teachers',
            error
        });
    }
};

exports.getAddTeacher = (req, res) => {
    res.render('teachers/add', {
        title: 'Add Teacher',
        user: req.session.user,
        error: null
    });
};

exports.addTeacher = async (req, res) => {
    try {
        const PigeonHole = require('../models/pigeonHoleModel');
        const teacherData = req.body;
        // handle legacy phoneNumber field
        if (teacherData.phoneNumber && !teacherData.phone) {
            teacherData.phone = teacherData.phoneNumber;
        }
        
        // Generate employee ID
        const lastTeacher = await Teacher.findOne().sort({ createdAt: -1 });
        let employeeId = 'TCH001';
        if (lastTeacher && lastTeacher.employeeId) {
            const lastNum = parseInt(lastTeacher.employeeId.replace('TCH', ''));
            employeeId = `TCH${String(lastNum + 1).padStart(3, '0')}`;
        }
        teacherData.employeeId = employeeId;
        if (req.file) {
            teacherData.profilePicture = 'teachers/' + req.file.filename;
        }

        // Generate a temporary random password
        const generatedPassword = crypto.randomBytes(4).toString('hex').toUpperCase(); // 8 char password

        // Create the Teacher profile
        const teacher = new Teacher(teacherData);
        await teacher.save();
        
        // Save credential to Pigeon Hole
        const pigeonHole = new PigeonHole({
            ownerName: `${teacherData.firstName} ${teacherData.lastName}`,
            username: employeeId,
            plainPassword: generatedPassword,
            role: 'teacher'
        });
        await pigeonHole.save();

        // Create the corresponding User account
        const user = new User({
            firstName: teacherData.firstName,
            lastName: teacherData.lastName,
            username: employeeId, // Set the login ID
            email: teacherData.email,
            password: generatedPassword,
            role: 'teacher',
            phoneNumber: teacherData.phone,
            address: {
                street: teacherData.address ? teacherData.address.street : '',
                city: teacherData.address ? teacherData.address.city : '',
                state: teacherData.address ? teacherData.address.state : '',
                zipCode: teacherData.address ? teacherData.address.zipCode : ''
            }
        });
        await user.save();

        // Show success with credentials to the Admin
        res.render('teachers/add-success', {
            title: 'Teacher Successfully Registered',
            user: req.session.user,
            credentials: {
                regNo: employeeId,
                email: teacherData.email,
                password: generatedPassword,
                name: `${teacherData.firstName} ${teacherData.lastName}`
            }
        });
    } catch (error) {
        console.error(error);
        res.render('teachers/add', {
            title: 'Add Teacher',
            user: req.session.user,
            error: error.message
        });
    }
};

exports.viewTeacher = async (req, res) => {
    try {
        const teacher = await Teacher.findById(req.params.id)
            .populate('subjects')
            .populate('classes');
        
        if (!teacher) {
            return res.status(404).render('404', { user: req.session.user });
        }

        res.render('teachers/profile', {
            title: `${teacher.fullName} - Profile`,
            teacher,
            user: req.session.user
        });
    } catch (error) {
        console.error(error);
        res.redirect('/teachers');
    }
};

// Show edit form
exports.getEditTeacher = async (req, res) => {
    try {
        const teacher = await Teacher.findById(req.params.id);
        if (!teacher) {
            return res.status(404).render('404', { user: req.session.user });
        }
        res.render('teachers/edit', {
            title: 'Edit Teacher',
            teacher,
            user: req.session.user,
            error: null,
            success: null
        });
    } catch (error) {
        console.error(error);
        res.redirect('/teachers');
    }
};

// Update teacher
exports.updateTeacher = async (req, res) => {
    try {
        const updateData = { ...req.body };
        if (updateData.phoneNumber && !updateData.phone) {
            updateData.phone = updateData.phoneNumber;
        }
        if (req.file) {
            updateData.profilePicture = 'teachers/' + req.file.filename;
        }
        const teacher = await Teacher.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        );
        if (!teacher) {
            return res.status(404).render('404', { user: req.session.user });
        }
        res.redirect(`/teachers/${teacher._id}`);
    } catch (error) {
        console.error(error);
        const teacher = await Teacher.findById(req.params.id);
        res.render('teachers/edit', {
            title: 'Edit Teacher',
            teacher,
            user: req.session.user,
            error: error.message
        });
    }
};

// Delete teacher (optional)
exports.deleteTeacher = async (req, res) => {
    try {
        await Teacher.findByIdAndDelete(req.params.id);
        res.redirect('/teachers');
    } catch (error) {
        console.error(error);
        res.redirect('/teachers');
    }
};