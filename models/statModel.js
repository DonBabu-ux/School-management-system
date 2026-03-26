const mongoose = require('mongoose');

const dailyVisitSchema = new mongoose.Schema({
    date: { type: String, unique: true }, // Format: 'YYYY-MM-DD'
    count: { type: Number, default: 0 }
});

const statSchema = new mongoose.Schema({
    totalVisits: { type: Number, default: 0 },
    totalInquiries: { type: Number, default: 0 },
    newsletterSubscribers: [{ 
        email: { type: String, unique: true }, 
        date: { type: Date, default: Date.now } 
    }],
    lastReset: { type: Date, default: Date.now }
});

mongoose.models = Object.fromEntries(
    Object.entries(mongoose.models).filter(([k]) => k !== 'DailyVisit')
);

const DailyVisit = mongoose.model('DailyVisit', dailyVisitSchema);
const Stat = mongoose.model('Stat', statSchema);

module.exports = { Stat, DailyVisit };
