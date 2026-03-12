const mongoose = require('mongoose');

const examSchema = new mongoose.Schema({
    examName: {
        type: String,
        required: true
    },
    examType: {
        type: String,
        enum: ['Midterm', 'Final', 'Quiz', 'Test'],
        required: true
    },
    class: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class',
        required: true
    },
    subject: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject',
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    startTime: String,
    endTime: String,
    totalMarks: {
        type: Number,
        required: true
    },
    passingMarks: Number,
    room: String,
    invigilator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Teacher'
    },
    status: {
        type: String,
        enum: ['Scheduled', 'Ongoing', 'Completed', 'Cancelled'],
        default: 'Scheduled'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Exam', examSchema);