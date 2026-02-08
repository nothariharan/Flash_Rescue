const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    _id: String, // Explicitly define as String for legacy data
    name: {
        type: String,
        required: [true, 'Please add a name']
    },
    email: {
        type: String,
        required: [true, 'Please add an email'],
        unique: true,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Please add a valid email'
        ]
    },
    password: {
        type: String,
        required: [true, 'Please add a password'],
        minlength: 6,
        select: false // Don't return password by default
    },
    role: {
        type: String,
        enum: ['donor', 'consumer', 'organization'], // 'ngo' is mapped to 'organization' in frontend often
        default: 'consumer'
    },
    location: {
        lat: Number,
        lng: Number,
        address: String
    },
    // Gamification Stats
    stats: {
        co2Saved: { type: Number, default: 0 }, // kg (Everyone)
        mealsSaved: { type: Number, default: 0 }, // count (Legacy/General)
        points: { type: Number, default: 0 }, // (Gamification)
        itemsSold: { type: Number, default: 0 }, // (Donors: Claimed > 0)
        itemsDonated: { type: Number, default: 0 }, // (Donors: Claimed = 0)
        familiesHelped: { type: Number, default: 0 } // (Orgs)
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Encrypt password using bcrypt
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
