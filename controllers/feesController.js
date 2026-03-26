const Fee = require('../models/feeModel');
const FeeStructure = require('../models/feeStructureModel');
const Student = require('../models/studentModel');
const Class = require('../models/classModel');

// List fees - show transactions and totals
exports.listFees = async (req, res) => {
    try {
        const fees = await Fee.find().populate('student');
        res.render('fees/list', {
            title: 'Fee Management',
            user: req.session.user,
            fees
        });
    } catch (error) {
        console.error(error);
        res.redirect('/dashboard');
    }
};

// Show collect fee form
exports.getCollectFee = async (req, res) => {
    try {
        const students = await Student.find({ status: 'Active' });
        res.render('fees/collect', {
            title: 'Collect Fee',
            user: req.session.user,
            error: null,
            students
        });
    } catch (error) {
        console.error(error);
        res.redirect('/fees');
    }
};

// Collect fee
exports.collectFee = async (req, res) => {
    try {
        const { studentId, amount, description, term, academicYear, method } = req.body;
        const fee = new Fee({
            student: studentId,
            amount,
            description,
            term,
            academicYear,
            paymentMethod: method,
            collectedBy: req.session.user.id
        });
        await fee.save();
        
        // Update student fee balance if needed
        const student = await Student.findById(studentId);
        if (student) {
            student.feeBalance = (student.feeBalance || 0) - Number(amount);
            await student.save();
        }

        res.redirect(`/fees/invoice/${fee._id}`);
    } catch (error) {
        console.error(error);
        res.redirect('/fees/collect');
    }
};

// View fee structure
exports.viewFeeStructure = async (req, res) => {
    try {
        const structures = await FeeStructure.find().populate('class');
        const classes = await Class.find();
        res.render('fees/structure', {
            title: 'Fee Structure',
            user: req.session.user,
            structures,
            classes
        });
    } catch (error) {
        console.error(error);
        res.redirect('/fees');
    }
};

// Update fee structure
exports.updateFeeStructure = async (req, res) => {
    try {
        const { classId, amount, description } = req.body;
        let struct = await FeeStructure.findOne({ class: classId });
        if (struct) {
            struct.amount = amount;
            struct.description = description;
            await struct.save();
        } else {
            await FeeStructure.create({ class: classId, amount, description });
        }
        res.redirect('/fees/structure');
    } catch (error) {
        console.error(error);
        res.redirect('/fees');
    }
};

// View student fees
exports.viewStudentFees = async (req, res) => {
    try {
        const student = await Student.findById(req.params.studentId);
        const fees = await Fee.find({ student: req.params.studentId });
        res.render('fees/student', {
            title: 'Student Fees',
            user: req.session.user,
            student,
            fees
        });
    } catch (error) {
        console.error(error);
        res.redirect('/fees');
    }
};

// Get fee report
exports.getFeeReport = async (req, res) => {
    try {
        const classes = await Class.find();
        res.render('fees/report', {
            title: 'Fee Report',
            user: req.session.user,
            classes,
            report: null
        });
    } catch (error) {
        console.error(error);
        res.redirect('/fees');
    }
};

// Generate fee report
exports.generateFeeReport = async (req, res) => {
    try {
        const { classId, startDate, endDate } = req.body;
        const filter = {
            date: { $gte: new Date(startDate), $lte: new Date(endDate) }
        };
        
        if (classId) {
            const studentsInClass = await Student.find({ class: classId }).select('_id');
            const studentIds = studentsInClass.map(s => s._id);
            filter.student = { $in: studentIds };
        }

        const report = await Fee.find(filter).populate('student');
        const classes = await Class.find();
        res.render('fees/report', {
            title: 'Fee Report',
            user: req.session.user,
            classes,
            report,
            classId,
            startDate,
            endDate
        });
    } catch (error) {
        console.error(error);
        res.redirect('/fees');
    }
};

// Generate invoice
exports.generateInvoice = async (req, res) => {
    try {
        const fee = await Fee.findById(req.params.id)
            .populate('student')
            .populate('collectedBy', 'firstName lastName');
        if (!fee) return res.redirect('/fees');
        res.render('fees/invoice', { fee, user: req.session.user, title: 'Fee Receipt' });
    } catch (error) {
        console.error(error);
        res.redirect('/fees');
    }
};