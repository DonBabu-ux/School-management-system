const mongoose = require('mongoose');

const pigeonHoleSchema = new mongoose.Schema({
    ownerName: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true,
        unique: true
    },
    plainPassword: {
        type: String,
        required: true
    },
    role: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('PigeonHole', pigeonHoleSchema);
