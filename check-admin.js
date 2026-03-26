const mongoose = require('mongoose');
const User = require('./models/userModel');
require('dotenv').config();

async function checkAdmin() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        const admins = await User.find({ role: 'admin' });
        if (admins.length > 0) {
            console.log('Admins found:');
            admins.forEach(a => console.log(`- Username: ${a.username}, Email: ${a.email}`));
        } else {
            console.log('❌ No admin users found in the database.');
        }

        mongoose.connection.close();
    } catch (e) {
        console.error('❌ Error:', e);
    }
}

checkAdmin();
