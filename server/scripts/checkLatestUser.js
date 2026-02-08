const mongoose = require('mongoose');
const User = require('../models/User');
const connectDB = require('../config/db');
const dotenv = require('dotenv');

dotenv.config({ path: '../.env' });

const checkLatestUser = async () => {
    try {
        await connectDB();
        console.log('DB Connected');

        const user = await User.findOne().sort({ createdAt: -1 });
        if (user) {
            console.log(`Latest User: ${user.email}`);
            console.log(`Role: ${user.role}`);
            console.log(`ID: ${user._id}`);
        } else {
            console.log('No users found.');
        }

        process.exit();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

checkLatestUser();
