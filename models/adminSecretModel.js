const mongoose = require('mongoose');

const adminSecretSchema = new mongoose.Schema({
    keyType: {
        type: String,
        required: true,
        unique: true
    },
    secretKey: {
        type: String,
        required: true
    }
});

module.exports = mongoose.model('AdminSecret', adminSecretSchema);
