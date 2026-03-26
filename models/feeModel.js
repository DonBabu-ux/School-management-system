const mongoose = require('mongoose');

const feeSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['Paid', 'Pending', 'Cancelled'],
        default: 'Paid'
    },
    description: String,
    term: {
        type: String,
        enum: ['Term 1', 'Term 2', 'Term 3', 'Semester 1', 'Semester 2'],
        required: true
    },
    academicYear: {
        type: String,
        required: true
    },
    paymentMethod: {
        type: String,
        enum: ['Cash', 'Bank Transfer', 'MPESA', 'Cheque'],
        default: 'Cash'
    },
    receiptNo: {
        type: String,
        unique: true
    },
    collectedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, { timestamps: true });

// Generate random receipt number before saving
feeSchema.pre('save', function(next) {
    if (!this.receiptNo) {
        this.receiptNo = 'RCP' + Math.floor(100000 + Math.random() * 900000);
    }
    next();
});

module.exports = mongoose.model('Fee', feeSchema);