const mongoose = require('mongoose');

const listingSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a name for the item']
    },
    category: {
        type: String,
        enum: ['produce', 'bakery', 'prepared', 'cooked', 'packaged', 'construction', 'furniture', 'clothing', 'electronics', 'medical', 'school', 'household', 'general', 'other'],
        default: 'other'
    },
    unit: {
        type: String,
        enum: ['kg', 'g', 'l', 'ml', 'items', 'boxes', 'bags'],
        default: 'items'
    },
    quantity: {
        type: Number, // Changed from String to Number
        required: [true, 'Please specify quantity value']
    },
    pricePerUnit: {
        type: Number,
        default: 0
    },
    initialPrice: {
        type: Number,
        default: 0
    },
    currentPrice: {
        type: Number,
        default: 0
    },
    expiryWindow: {
        type: Number, // In hours
        default: 4
    },
    freeAt: {
        type: Date,
        required: true
    },
    donor: {
        type: String, // Changed to String to support migrated legacy IDs
        ref: 'User',
        required: true
    },
    description: String,
    imageUrl: {
        type: String, // URL to cloud storage or base64 placeholder (discouraged)
        default: ''
    },
    status: {
        type: String,
        enum: ['active', 'claimed', 'collected', 'expired'],
        default: 'active'
    },
    location: {
        lat: Number,
        lng: Number,
        address: String
    },
    claimedBy: {
        type: String, // Changed to String to support migrated legacy IDs
        ref: 'User'
    },
    claimCode: String, // OTP
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Index for geospatial queries if we decide to use them
// listingSchema.index({ location: '2dsphere' }); // Disabled for MVP due to schema structure mismatch

module.exports = mongoose.model('Listing', listingSchema);
