const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
    className: {
        type: String,
        required: true
    },
    section: String,
    academicYear: {
        type: String,
        required: true
    },
    classTeacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Teacher'
    },
    students: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student'
    }],
    subjects: [{
        subject: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Subject'
        },
        teacher: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Teacher'
        }
    }],
    capacity: Number,
    roomNumber: String,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Class', classSchema);