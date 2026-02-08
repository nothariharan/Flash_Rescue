const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const User = require('./models/User');
const Message = require('./models/Message');
const Listing = require('./models/Listing');

const connectDB = require('./config/db');

const reset = async () => {
    try {
        await connectDB();

        console.log('Clearing Messages...');
        await Message.deleteMany({});

        console.log('Clearing Users...');
        await User.deleteMany({});

        console.log('Clearing Listings...');
        await Listing.deleteMany({});

        console.log('Database reset complete. Please re-register.');
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

reset();
