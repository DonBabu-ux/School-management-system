const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
    subjectName: {
        type: String,
        required: true
    },
    subjectCode: {
        type: String,
        required: true,
        unique: true
    },
    description: String,
    credits: Number,
    department: String,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Subject', subjectSchema);