const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        index: true
    },
    title: {
        type: String,
        required: [true, 'Notification title is required']
    },
    message: {
        type: String,
        required: [true, 'Notification message is required']
    },
    type: {
        type: String,
        enum: ['update', 'password_reset', 'password_change', 'alert', 'task', 'ticket'],
        default: 'update'
    },
    isRead: {
        type: Boolean,
        default: false,
        index: true
    },
    link: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now,
        index: true
    }
});

module.exports = mongoose.model('Notification', notificationSchema);
