const mongoose = require('mongoose');
const Listing = require('../models/Listing');
const connectDB = require('../config/db');
const dotenv = require('dotenv');

dotenv.config({ path: '../.env' });

const fixIndexes = async () => {
    try {
        await connectDB();
        console.log('DB Connected');

        // List indexes
        const indexes = await Listing.collection.indexes();
        console.log('Current Indexes:', indexes);

        // Drop the 2dsphere index if it exists
        // The name is usually 'location_2dsphere'
        const indexName = 'location_2dsphere';
        const exists = indexes.find(i => i.name === indexName);

        if (exists) {
            console.log(`Dropping index: ${indexName}...`);
            await Listing.collection.dropIndex(indexName);
            console.log('Index dropped successfully.');
        } else {
            console.log(`Index ${indexName} not found. Safe to proceed.`);
        }

        process.exit();
    } catch (error) {
        console.error('Error:', error);
        // Process didn't crash because we want to see output
        process.exit(1);
    }
};

fixIndexes();
