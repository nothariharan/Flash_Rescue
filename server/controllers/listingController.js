const Listing = require('../models/Listing');
const User = require('../models/User');
const { analyzeClusters } = require('../services/clusterEngine');

// Create a new listing
exports.createListing = async (req, res) => {
    try {
        console.log('Create Listing Request Body:', req.body); // DEBUG LOG
        const { name, category, quantity, unit, pricePerUnit, initialPrice, expiryWindow, location, freeAt, donorId, imageUrl } = req.body;

        // Validation
        if (!name || !quantity || !location || !unit) {
            console.log('Missing validation fields:', { name, quantity, unit, location }); // DEBUG LOG
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const listing = await Listing.create({
            name,
            category,
            quantity: Number(quantity),
            unit,
            pricePerUnit: Number(pricePerUnit) || 0,
            initialPrice: Number(initialPrice) || 0,
            currentPrice: Number(initialPrice) || 0,
            expiryWindow,
            location,
            freeAt: new Date(freeAt),
            donor: req.user.id, // Auth middleware sets req.user
            status: 'active',
            imageUrl: imageUrl || ''
        });

        const io = req.app.get('socketio');
        if (io) {
            io.emit('newListing', listing);
            // Trigger cluster analysis on new listing
            analyzeClusters(io);
        }

        res.status(201).json(listing);
    } catch (error) {
        console.error('Create Listing Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Get all active listings (Consumer Feed) or Filtered by User
exports.getListings = async (req, res) => {
    try {
        const { category, donor, claimedBy, id } = req.query;
        let query = {};

        // If specific ID is requested
        if (id) {
            query._id = id;
            const listings = await Listing.find(query);
            return res.json(listings);
        }

        // If filtering by donor (My Listings)
        if (donor) {
            query.donor = donor;
            // distinct from status: 'active', we want all statuses for the donor
        }
        // If filtering by claimant (My Claims)
        else if (claimedBy) {
            query.claimedBy = claimedBy;
            // Show both currently claimed and previously collected items
            query.status = { $in: ['claimed', 'collected'] };
        }
        // General Feed (only active items)
        else {
            query.status = 'active';
            query.freeAt = { $gt: new Date() }; // Only show items that haven't expired
            if (category && category !== 'all') {
                query.category = category;
            }
        }

        const listings = await Listing.find(query).sort({ createdAt: -1 });
        res.json(listings);
    } catch (error) {
        console.error('Get Listings Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Collect listings (Organization / NGO)
exports.collectListings = async (req, res) => {
    try {
        const { listingIds } = req.body;

        if (!listingIds || !Array.isArray(listingIds)) {
            return res.status(400).json({ message: 'Invalid listing IDs' });
        }

        // Find the listings before updating to get their details for impact calculation
        const collectedListings = await Listing.find({ _id: { $in: listingIds }, status: 'active' });

        if (collectedListings.length === 0) {
            return res.status(404).json({ message: 'No active listings found to collect' });
        }

        await Listing.updateMany(
            { _id: { $in: listingIds }, status: 'active' },
            {
                $set: {
                    status: 'collected',
                    claimedBy: req.user.id
                }
            }
        );

        // --- Gamification Logic for Collection ---
        let totalCo2Saved = 0;
        let totalMealsSaved = 0;
        const donorImpacts = {}; // To aggregate impact per donor

        try {
            for (const listing of collectedListings) {
                // Calculate Impact for each listing
                let co2Factor = 0.5; // Default (items)
                if (['produce', 'bakery', 'prepared', 'cooked'].includes(listing.category)) co2Factor = 2.5; // Food (per kg/unit)
                if (['furniture', 'electronics'].includes(listing.category)) co2Factor = 20; // Durable goods
                if (listing.category === 'clothing') co2Factor = 5;

                let quantityVal = listing.quantity || 1;
                if (listing.unit === 'g' || listing.unit === 'ml') quantityVal = quantityVal / 1000;

                const listingCo2Saved = Math.round(quantityVal * co2Factor * 10) / 10;

                totalCo2Saved += listingCo2Saved;
                totalMealsSaved += 1; // Each listing counts as one "meal" or item saved

                // Aggregate donor impact
                if (listing.donor) {
                    if (!donorImpacts[listing.donor]) {
                        donorImpacts[listing.donor] = { co2Saved: 0, mealsSaved: 0, points: 0 };
                    }
                    donorImpacts[listing.donor].co2Saved += listingCo2Saved;
                    donorImpacts[listing.donor].mealsSaved += 1;
                    donorImpacts[listing.donor].points += 50; // Points for donating
                }
            }

            // Update Collector (Organization) stats
            await User.findByIdAndUpdate(req.user.id, {
                $inc: {
                    'stats.co2Saved': totalCo2Saved,
                    'stats.mealsSaved': totalMealsSaved,
                    'stats.points': totalMealsSaved * 10, // Points for collecting
                    'stats.familiesHelped': totalMealsSaved // Assuming 1 recovery = 1 family helped (simplified)
                }
            });

            // Update Donor stats
            for (const donorId in donorImpacts) {
                await User.findByIdAndUpdate(donorId, {
                    $inc: {
                        'stats.co2Saved': donorImpacts[donorId].co2Saved,
                        'stats.mealsSaved': donorImpacts[donorId].mealsSaved,
                        'stats.points': donorImpacts[donorId].points
                    }
                });
            }

        } catch (statsErr) {
            console.error('Error updating gamification stats for collection:', statsErr);
            // Don't fail the collection if stats fail
        }

        const io = req.app.get('socketio');
        if (io) {
            io.emit('listingsCollected', listingIds);
            analyzeClusters(io);
        }

        res.json({
            message: 'Listings collected successfully',
            count: collectedListings.length,
            impact: {
                co2Saved: totalCo2Saved,
                mealsSaved: totalMealsSaved
            }
        });
    } catch (error) {
        console.error('Collect Listings Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Claim a listing (Consumer)
exports.claimListing = async (req, res) => {
    try {
        const { id } = req.params;

        const listing = await Listing.findById(id);
        if (!listing) {
            return res.status(404).json({ message: 'Listing not found' });
        }

        if (listing.status !== 'active') {
            return res.status(400).json({ message: 'Listing already claimed or not available' });
        }

        // Generate OTP
        const otp = Math.floor(1000 + Math.random() * 9000).toString();

        // Update listing status
        listing.status = 'claimed';
        listing.claimedBy = req.user.id;
        listing.claimedAt = new Date();
        listing.claimCode = otp; // Keep the OTP for the consumer
        await listing.save();

        // --- Gamification Logic ---
        let co2Saved = 0;
        try {
            // User model is already imported at the top, no need to re-require

            // Calculate Impact
            let co2Factor = 0.5; // Default (items)
            if (['produce', 'bakery', 'prepared', 'cooked'].includes(listing.category)) co2Factor = 2.5; // Food (per kg/unit)
            if (['furniture', 'electronics'].includes(listing.category)) co2Factor = 20; // Durable goods
            if (listing.category === 'clothing') co2Factor = 5;

            // Estimate weight/quantity if unit is just 'items'
            let quantityVal = listing.quantity || 1;
            // If unit is grams, convert to kg
            if (listing.unit === 'g') quantityVal = quantityVal / 1000;
            if (listing.unit === 'ml') quantityVal = quantityVal / 1000;

            co2Saved = Math.round(quantityVal * co2Factor * 10) / 10; // 1 decimal place

            // Update Consumer (The Hero who rescued it)
            await User.findByIdAndUpdate(req.user.id, {
                $inc: {
                    'stats.co2Saved': co2Saved,
                    'stats.mealsSaved': 1,
                    'stats.points': 10
                }
            });

            // Update Donor (The Hero who shared it)
            const donorUpdate = {
                $inc: {
                    'stats.co2Saved': co2Saved,
                    'stats.mealsSaved': 1,
                    'stats.points': 50 // More points for donating
                }
            };

            // Check if it was a Sale (Price > 0) or Donation (Price = 0)
            if (listing.currentPrice > 0) {
                donorUpdate.$inc['stats.itemsSold'] = 1;
            } else {
                donorUpdate.$inc['stats.itemsDonated'] = 1;
            }

            await User.findByIdAndUpdate(listing.donor, donorUpdate);

            // Emit explicit socket event for the claiming user (to trigger confetti)
            // (The existing 'listingClaimed' is broadcast to all)
            // We need a specific one or just payload in the response? 
            // Response is easier for the initiator. 
            // But if we want real-time profile update without refresh...
            // Let's rely on the response for the immediate "Wow" and maybe socket for profile data.

        } catch (statsErr) {
            console.error('Error updating gamification stats:', statsErr);
            // Don't fail the claim if stats fail
        }

        // Notify everyone
        const io = req.app.get('socketio');
        if (io) {
            io.emit('listingClaimed', {
                id: listing._id,
                claimedBy: req.user.id,
                donor: listing.donor // Send donor ID so they can update their stats
            });
            analyzeClusters(io);
        }

        res.json({
            message: 'Listing claimed successfully',
            otp, // Include OTP in the response
            listing,
            impact: { co2Saved: co2Saved } // Send impact data in response for immediate UI
        });
    } catch (error) {
        console.error('Claim Listing Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Get current clusters
exports.getClusters = async (req, res) => {
    try {
        // Pass null for io since we just want the return value
        const clusters = await analyzeClusters(null);
        res.status(200).json(clusters);
    } catch (error) {
        console.error('Get Clusters Error:', error);
        res.status(500).json({ message: error.message });
    }
};
