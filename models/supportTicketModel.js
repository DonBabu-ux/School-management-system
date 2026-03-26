const mongoose = require('mongoose');

const supportTicketSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    ticketId: { type: String, unique: true },
    contactEmail: { type: String, required: true },
    credentialId: { type: String, required: true },
    description: { type: String, required: true },
    status: { 
        type: String, 
        enum: ['pending', 'active', 'complete', 'deleted'], 
        default: 'pending' 
    },
    actionTaken: { type: String },
    resolvedAt: { type: Date },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('SupportTicket', supportTicketSchema);
