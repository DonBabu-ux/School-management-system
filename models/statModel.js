const mongoose = require('mongoose');

const statSchema = new mongoose.Schema({
    totalVisits: { type: Number, default: 0 },
    totalInquiries: { type: Number, default: 0 },
    newsletterSubscribers: [{ 
        email: { type: String, unique: true }, 
        date: { type: Date, default: Date.now } 
    }],
    lastReset: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Stat', statSchema);
