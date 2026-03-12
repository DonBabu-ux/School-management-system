const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema({
    employeeId: {
        type: String,
        required: true,
        unique: true
    },
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    phone: {
        type: String,
        required: true
    },
    qualification: String,
    specialization: String,
    dateOfBirth: Date,
    gender: {
        type: String,
        enum: ['Male', 'Female', 'Other']
    },
    address: {
        street: String,
        city: String,
        state: String,
        zipCode: String
    },
    subjects: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject'
    }],
    classes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class'
    }],
    profilePicture: {
        type: String,
        default: 'default-teacher.png'
    },
    joiningDate: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['Active', 'Inactive', 'On Leave'],
        default: 'Active'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

teacherSchema.virtual('fullName').get(function() {
    return `${this.firstName} ${this.lastName}`;
});

module.exports = mongoose.model('Teacher', teacherSchema);