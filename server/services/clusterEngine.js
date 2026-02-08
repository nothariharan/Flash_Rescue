const Listing = require('../models/Listing');

// Haversine formula to calculate distance in km
const deg2rad = (deg) => {
    return deg * (Math.PI / 180);
};

const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
};

// Cluster Analysis
const analyzeClusters = async (io) => {
    try {
        // Fetch active listings from MongoDB
        const activeListings = await Listing.find({ status: 'active' });

        const clusters = [];
        const visited = new Set();

        activeListings.forEach((current, i) => {
            if (visited.has(current._id.toString())) return;

            // Start a new cluster
            const cluster = {
                id: `mission-${Date.now()}-${i}`,
                center: current.location,
                items: [current],
                // quantity is string "5kg", extract number or default to 1
                totalWeight: parseFloat(current.quantity) || 1,
                stops: 1
            };
            visited.add(current._id.toString());

            // Look for neighbors
            activeListings.forEach((neighbor) => {
                if (current._id.toString() === neighbor._id.toString() || visited.has(neighbor._id.toString())) return;

                const dist = calculateDistance(
                    current.location.lat, current.location.lng,
                    neighbor.location.lat, neighbor.location.lng
                );

                // If within 2km AND same category, add to cluster
                if (dist <= 2 && current.category === neighbor.category) {
                    cluster.items.push(neighbor);
                    cluster.totalWeight += parseFloat(neighbor.quantity) || 1;
                    cluster.stops += 1;
                    visited.add(neighbor._id.toString());
                }
            });

            // If cluster is "worthy" (e.g. > 1 item or specific weight), add to list
            // For MVP, even 2 items is a cluster
            if (cluster.items.length > 1) {
                clusters.push(cluster);
            }
        });

        console.log(`[ClusterEngine] Formed ${clusters.length} missions.`);

        if (io) {
            io.emit('missionUpdate', clusters);
        }

        return clusters;

    } catch (error) {
        console.error('Cluster Engine Error:', error);
        return [];
    }
};

module.exports = { analyzeClusters };
