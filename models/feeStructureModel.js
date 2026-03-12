const mongoose = require('mongoose');

const feeStructureSchema = new mongoose.Schema({
    class: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class',
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    description: String
});

module.exports = mongoose.model('FeeStructure', feeStructureSchema);