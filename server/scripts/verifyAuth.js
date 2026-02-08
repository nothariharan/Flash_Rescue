const mongoose = require('mongoose');
const User = require('../models/User');
const connectDB = require('../config/db');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

dotenv.config({ path: '../.env' });

const verifyAuth = async () => {
    try {
        await connectDB();
        console.log('DB Connected');

        // 1. Check if migrated user exists
        const testUser = await User.findOne({ email: 'test@auth.com' }).select('+password');
        if (testUser) {
            console.log('Found migrated user:', testUser.email);
            console.log('Stored Hash:', testUser.password);
        } else {
            console.log('Migrated user NOT found.');
        }

        // 2. Create a fresh test user
        const freshEmail = 'verify_' + Date.now() + '@test.com';
        const freshPass = 'password123';

        console.log(`Creating fresh user: ${freshEmail} with pass: ${freshPass}`);
        const newUser = await User.create({
            name: 'Verify User',
            email: freshEmail,
            password: freshPass, // Should be hashed by pre-save
            role: 'consumer'
        });

        console.log('Fresh user created.');

        // 3. Fetch and Compare
        const fetchedUser = await User.findOne({ email: freshEmail }).select('+password');
        console.log('Fetched fresh user hash:', fetchedUser.password);

        const isMatch = await fetchedUser.matchPassword(freshPass);
        console.log(`Password Match Result: ${isMatch}`);

        if (isMatch) {
            console.log('SUCCESS: Auth logic is working correctly.');
        } else {
            console.error('FAILURE: Password did not match.');
        }

        process.exit();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

verifyAuth();
