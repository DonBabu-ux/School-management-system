const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },
    exam: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Exam',
        required: true
    },
    marksObtained: {
        type: Number,
        required: true
    },
    percentage: Number,
    grade: String,
    remarks: String,
    status: {
        type: String,
        enum: ['Pass', 'Fail', 'Absent'],
        default: 'Pass'
    },
    publishedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    publishedDate: {
        type: Date,
        default: Date.now
    }
});

// Calculate percentage before saving
resultSchema.pre('save', async function(next) {
    const exam = await mongoose.model('Exam').findById(this.exam);
    if (exam) {
        this.percentage = (this.marksObtained / exam.totalMarks) * 100;
        
        // Assign grade based on percentage
        if (this.percentage >= 80) this.grade = 'A';
        else if (this.percentage >= 70) this.grade = 'B';
        else if (this.percentage >= 60) this.grade = 'C';
        else if (this.percentage >= 50) this.grade = 'D';
        else this.grade = 'F';
    }
    next();
});

module.exports = mongoose.model('Result', resultSchema);