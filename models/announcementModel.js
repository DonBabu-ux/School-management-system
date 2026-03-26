const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Announcement title is required'],
        trim: true
    },
    message: {
        type: String,
        required: [true, 'Announcement message is required']
    },
    type: {
        type: String,
        enum: ['text', 'image', 'video'],
        default: 'text'
    },
    mediaUrl: {
        type: String
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
    },
    postedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    targetAudience: {
        type: String,
        enum: ['all', 'students', 'teachers', 'parents'],
        default: 'all'
    },
    status: {
        type: String,
        enum: ['published', 'draft', 'archived'],
        default: 'published'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

announcementSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Announcement', announcementSchema);
