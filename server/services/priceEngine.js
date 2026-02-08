const cron = require('node-cron');
const Listing = require('../models/Listing');

const startPriceDecayEngine = (io) => {
    // Run every minute
    cron.schedule('*/1 * * * *', async () => {
        console.log('Running Price Decay Engine (MongoDB)...');
        try {
            // 1. Fetch all active listings
            const activeListings = await Listing.find({ status: 'active' });

            if (activeListings.length === 0) return;

            const now = new Date();
            let updatesCount = 0;

            // 2. Process each listing
            const updatePromises = activeListings.map(async (listing) => {
                const created = new Date(listing.createdAt);
                const freeBy = new Date(listing.freeAt); // Using new schema field name

                // Calculate decay
                const windowDuration = freeBy - created;
                const elapsed = now - created;

                let newPrice = 0;

                // If past expiration, price is 0 (or we could expire it)
                if (elapsed >= windowDuration) {
                    newPrice = 0;
                } else {
                    const decayFactor = 1 - (elapsed / windowDuration);
                    newPrice = Math.floor(listing.initialPrice * decayFactor);
                }

                // Ensure non-negative
                const calculatedPrice = Math.max(0, newPrice);

                // 3. Update if price changed
                if (calculatedPrice !== listing.currentPrice) {
                    listing.currentPrice = calculatedPrice;

                    // If using calculated unit price, we might want to update pricePerUnit too? 
                    // For now, let's keep it simple: currentPrice tracks the TOTAL value.
                    // If we want unit price to decay, we'd decay pricePerUnit.
                    // Let's decay the TOTAL value (currentPrice) for now as that's what the consumer sees mostly.
                    // Actually, consistent with Phase 3, we should probably decay pricePerUnit if it exists.

                    if (listing.pricePerUnit > 0) {
                        const unitDecay = Math.floor(listing.pricePerUnit * (listing.currentPrice / listing.initialPrice));
                        // This logic is circular. Let's just decay pricePerUnit directly using the factor.
                        // Recalculate factor:
                        let factor = 0;
                        if (elapsed < windowDuration) {
                            factor = 1 - (elapsed / windowDuration);
                        }
                        listing.pricePerUnit = Math.floor((listing.initialPrice / listing.quantity) * factor);
                        listing.currentPrice = listing.pricePerUnit * listing.quantity;
                    } else {
                        // Fallback for old items without unit pricing
                        listing.currentPrice = calculatedPrice;
                    }

                    await listing.save();
                    updatesCount++;

                    // 4. Emit socket event
                    if (io) {
                        console.log(`Emitting price update for ${listing._id}: ₹${listing.currentPrice}`);
                        io.emit('priceUpdate', {
                            id: listing._id,
                            newPrice: listing.currentPrice,
                            newUnitParam: listing.pricePerUnit // Optional for frontend
                        });
                    }
                }
            });

            await Promise.all(updatePromises);

            if (updatesCount > 0) {
                console.log(`Updated prices for ${updatesCount} listings.`);
            }

        } catch (error) {
            console.error('Price Decay Error:', error);
        }
    });
};

module.exports = startPriceDecayEngine;
