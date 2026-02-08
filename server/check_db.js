const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const User = require('./models/User');
const Message = require('./models/Message');
const Listing = require('./models/Listing');

const connectDB = require('./config/db');

const check = async () => {
    await connectDB();

    console.log('--- Checking Recent Messages ---');
    const messages = await Message.find().sort({ createdAt: -1 }).limit(5).populate('sender');

    messages.forEach(msg => {
        console.log(`\nMsg ID: ${msg._id}`);
        console.log(`Text: ${msg.text}`);
        console.log(`Sender ID (Raw): ${msg.get('sender')}`); // Should be string if not populated, but here we requested populate
        console.log(`Sender (Populated):`, msg.sender);

        if (!msg.sender) {
            console.log('!!! SENDER POPULATION FAILED !!!');
            console.log('Checking if user exists with this ID...');
            // Check raw sender ID
            // We need to query the raw document to get the unpopulated sender ID if mongoose hid it
        }
    });

    console.log('\n--- Checking Users ---');
    const users = await User.find().limit(5);
    users.forEach(u => {
        console.log(`User ID: ${u._id} | Name: ${u.name}`);
    });

    process.exit();
};

check();
