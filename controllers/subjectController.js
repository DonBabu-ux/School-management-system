const Subject = require('../models/subjectModel');

exports.getSubjects = async (req, res) => {
    try {
        const subjects = await Subject.find();
        res.render('subjects', { title: 'Subjects', subjects });
    } catch (err) {
        res.status(500).send(err);
    }
};

exports.addSubject = async (req, res) => {
    try {
        const newSubject = new Subject(req.body);
        await newSubject.save();
        res.redirect('/subjects');
    } catch (err) {
        res.status(500).send(err);
    }
};

exports.deleteSubject = async (req, res) => {
    try {
        await Subject.findByIdAndDelete(req.params.id);
        res.redirect('/subjects');
    } catch (err) {
        res.status(500).send(err);
    }
};
