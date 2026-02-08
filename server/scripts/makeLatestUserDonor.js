const mongoose = require('mongoose');
const User = require('../models/User');
const connectDB = require('../config/db');
const dotenv = require('dotenv');

dotenv.config({ path: '../.env' });

const makeDonor = async () => {
    try {
        await connectDB();
        console.log('DB Connected');

        const user = await User.findOne().sort({ createdAt: -1 });
        if (user) {
            console.log(`Found User: ${user.email} (${user.role})`);
            user.role = 'donor';
            await user.save();
            console.log(`UPDATED User: ${user.email} to ROLE: ${user.role}`);
        } else {
            console.log('No users found.');
        }

        process.exit();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

makeDonor();
