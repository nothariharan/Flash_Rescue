const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const User = require('../models/User');
const Listing = require('../models/Listing');
const connectDB = require('../config/db');

dotenv.config({ path: '../.env' }); // Adjust path if needed

const usersPath = path.join(__dirname, '../data/users.json');
const listingsPath = path.join(__dirname, '../data/listings.json');

const importData = async () => {
    try {
        await connectDB();

        // unique email check
        const users = JSON.parse(fs.readFileSync(usersPath, 'utf-8'));
        const listings = JSON.parse(fs.readFileSync(listingsPath, 'utf-8'));

        // Clear existing data (optional, be careful)
        // await User.deleteMany();
        // await Listing.deleteMany();

        console.log('Importing Users...');

        const userMap = {}; // Map old ID to new Mongo ID if needed (or keep strings if Schema allows)
        // Our schema uses default ObjectIds for _id, but we can override or use a lookup.
        // For simplicity in migration, let's try to match emails.

        for (const u of users) {
            const userExists = await User.findOne({ email: u.email });
            if (!userExists) {
                // Create new user
                // Password in JSON is likely hashed? If raw, it will be hashed by pre-save.
                // If already hashed, we might double hash. 
                // Assuming MVP JSON stored raw passwords or simple strings for now based on snippets seeing bcrypt usage.
                // Actually authController uses bcrypt.hash, so JSON has hashed passwords.
                // We need to bypass the pre-save hook hash or manually set it.
                // Best way: use insertMany or set specific flag, but simple create triggers hooks.
                // If password allows modification check.

                // Workaround: We will just insert them and hope the pre-save check !isModified works if we don't touch password?
                // But we are creating new doc.

                // Let's create a specific object for migration that we insert directly to bypass hooks if needed, 
                // or just accept we might need to reset passwords.
                // Let's try to use User.collection.insertOne to bypass middleware for migration.

                const newUserResult = await User.collection.insertOne({
                    name: u.name,
                    email: u.email,
                    password: u.password, // Already hashed
                    role: u.role,
                    createdAt: new Date(u.createdAt) || new Date()
                });

                // Mongoose 6/7 insertOne returns { acknowledged: true, insertedId: ... }
                userMap[u._id] = newUserResult.insertedId;
                console.log(`Migrated user: ${u.email}`);
            } else {
                console.log(`User already exists: ${u.email}`);
                userMap[u._id] = userExists._id;
            }
        }

        console.log('Importing Listings...');
        for (const l of listings) {
            // Find the new owner ID
            const newOwnerId = userMap[l.donorId];
            if (!newOwnerId) {
                console.warn(`Skipping listing ${l.name}: Owner not found`);
                continue;
            }

            // Prepare object
            const cleanListing = {
                name: l.name,
                category: l.category,
                quantity: l.quantity,
                initialPrice: l.initialPrice,
                currentPrice: l.currentPrice,
                expiryWindow: l.expiryWindow,
                freeAt: new Date(l.freeAt),
                donor: newOwnerId,
                status: l.status,
                location: l.location,
                imageUrl: l.imageUrl || '',
                createdAt: new Date(l.createdAt) || new Date()
            };

            await Listing.create(cleanListing);
        }

        console.log('Data Imported Successfully!');
        process.exit();
    } catch (error) {
        console.error(`${error}`);
        process.exit(1);
    }
};

importData();
