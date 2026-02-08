import { useState, useEffect } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import { Clock, MapPin, Tag, ShoppingBag, ArrowRight, Check, MessageSquare } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import ChatWindow from '../components/ChatWindow';
import L from 'leaflet';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext'; // Import useChat
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

// Fix Leaflet marker icon issue
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

import { getCategoryImage } from '../utils/categoryImages';

// Helper for placeholder images REMOVED (now imported)


const ConsumerPage = () => {
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [categoryFilter, setCategoryFilter] = useState('all');
    // const [activeChat, setActiveChat] = useState(null); // REMOVED
    const { user, refreshUser } = useAuth(); // Get user
    const { setActiveChat } = useChat(); // Use global context


    const categories = [
        { id: 'all', label: 'All' },
        { id: 'produce', label: 'Produce' },
        { id: 'bakery', label: 'Bakery' },
        { id: 'prepared', label: 'Meals' },
        { id: 'construction', label: 'Construction' },
        { id: 'furniture', label: 'Furniture' },
        { id: 'clothing', label: 'Clothing' },
        { id: 'electronics', label: 'Tech' },
        { id: 'medical', label: 'Medical' },
        { id: 'school', label: 'School' },
        { id: 'other', label: 'Other' }
    ];

    // Default Bangalore location
    const center = [12.9716, 77.5946];

    useEffect(() => {
        fetchListings();
        const socket = io('http://localhost:5000');

        socket.on('priceUpdate', ({ id, newPrice, newUnitParam }) => {
            setListings(prevListings =>
                prevListings.map(item =>
                    item._id === id
                        ? { ...item, currentPrice: newPrice, pricePerUnit: newUnitParam }
                        : item
                )
            );
        });

        // Listen for claims to remove items immediately for everyone (unless it's MY claim)
        socket.on('listingClaimed', ({ id, claimedBy }) => {
            if (user && claimedBy === user.id) {
                // If I claimed it, I want to keep seeing it (or fetch fresh to get updated status)
                fetchListings();
            } else {
                // If someone else claimed it, remove it
                setListings(prev => prev.filter(item => item._id !== id));
            }
        });

        socket.on('missionUpdate', () => {
            fetchListings();
        });

        return () => socket.disconnect();
    }, [user]); // Re-fetch if user changes (login/logout)

    const fetchListings = async () => {
        try {
            // Fetch Active Listings
            const resActive = await axios.get('http://localhost:5000/api/listings');
            let combined = resActive.data;

            // If logged in, also fetch My Claims
            if (user) {
                const token = localStorage.getItem('token');
                const resClaims = await axios.get(`http://localhost:5000/api/listings?claimedBy=${user.id || user._id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                // Merge claims (avoiding duplicates if API returns them weirdly, though active vs claimed shouldn't overlap)
                const claimIds = new Set(resClaims.data.map(i => i._id));
                combined = [...combined.filter(i => !claimIds.has(i._id)), ...resClaims.data];
            }

            setListings(combined);
        } catch (error) {
            console.error('Error fetching listings:', error);
        } finally {
            setLoading(false);
        }
    };

    const calculateTimeRemaining = (freeAt) => {
        const diff = new Date(freeAt) - new Date();
        if (diff <= 0) return 'Expired';
        const mins = Math.floor(diff / 60000);
        const hrs = Math.floor(mins / 60);
        return hrs > 0 ? `${hrs}h ${mins % 60}m` : `${mins}m`;
    };

    const getUrgencyColor = (freeAt) => {
        const diff = new Date(freeAt) - new Date();
        const mins = Math.floor(diff / 60000);
        if (mins < 30) return 'text-brand-expired bg-brand-expired/10 border-brand-expired/20'; // Critical
        if (mins < 60) return 'text-brand-warning bg-brand-warning/10 border-brand-warning/20'; // Warning
        return 'text-brand-success bg-brand-success/10 border-brand-success/20'; // Safe
    };

    // Haversine Distance Calc
    const calcDist = (lat1, lon1, lat2, lon2) => {
        const R = 6371; // km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    const handleClaim = async (item) => {
        if (user.role === 'donor') {
            alert("Donors cannot claim items. Please switch to a Consumer or Organization account.");
            return;
        }

        if (!navigator.geolocation) {
            alert("Geolocation is not supported by your browser. Cannot verify location.");
            return;
        }

        const confirmClaim = window.confirm(`Initiating Claim for: ${item.name}\n\nWe need to verify if you are nearby.`);
        if (!confirmClaim) return;

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const userLat = position.coords.latitude;
                const userLng = position.coords.longitude;
                const itemLat = item.location?.lat || center[0]; // Fallback if missing
                const itemLng = item.location?.lng || center[1];

                const distance = calcDist(userLat, userLng, itemLat, itemLng);

                // Allow if within 5km (relaxed for testing)
                if (distance <= 5) {
                    try {
                        const token = localStorage.getItem('token');
                        const response = await axios.post(`http://localhost:5000/api/listings/${item._id}/claim`, {}, {
                            headers: { Authorization: `Bearer ${token}` }
                        });

                        // Trigger Confetti
                        confetti({
                            particleCount: 150,
                            spread: 70,
                            origin: { y: 0.6 },
                            zIndex: 9999
                        });

                        // Refresh User Stats
                        refreshUser();

                        alert(`✅ Verified! You are ${distance.toFixed(2)}km away.\n\nClaim Approved! Code: ${response.data.otp || 'N/A'}`);
                        // Optimistic update
                        setListings(prev => prev.filter(i => i._id !== item._id));
                    } catch (error) {
                        console.error(error);
                        alert("Claim Failed: " + (error.response?.data?.message || "Server Error"));
                    }
                } else {
                    alert(`❌ You are too far! (${distance.toFixed(2)}km)\n\nYou must be within 5km to claim this item.`);
                }
            },
            () => {
                alert("Unable to retrieve your location. Claim denied.");
            }
        );
    };

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] md:flex-row bg-brand-bg">
            {/* List View - Scrollable */}
            <div className="w-full md:w-5/12 lg:w-4/12 h-full overflow-y-auto border-r border-brand-border bg-brand-bg relative z-10 shadow-2xl">
                <div className="p-6 pb-24">
                    <div className="flex justify-between items-end mb-6">
                        <div>
                            <h2 className="text-3xl font-heading font-extrabold text-brand-text leading-tight">
                                Available<br /><span className="text-brand-primary">Rescues</span>
                            </h2>
                            <p className="text-brand-text-secondary mt-2 font-medium">Verified items nearby, updated live.</p>
                        </div>
                        <div className="bg-brand-primary/10 text-brand-primary font-bold px-4 py-2 rounded-2xl">
                            {listings.filter(i => categoryFilter === 'all' || i.category === categoryFilter).length} items
                        </div>
                    </div>

                    {/* Category Filter */}
                    <div className="flex overflow-x-auto pb-4 mb-4 gap-2 no-scrollbar">
                        {categories.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setCategoryFilter(cat.id)}
                                className={`whitespace-nowrap px-4 py-2 rounded-xl text-sm font-bold transition-all ${categoryFilter === cat.id
                                    ? 'bg-brand-text text-white shadow-lg'
                                    : 'bg-white border border-brand-border text-brand-text-secondary hover:bg-brand-bg hover:text-brand-text'
                                    }`}
                            >
                                {cat.label}
                            </button>
                        ))}
                    </div>

                    {loading ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="bg-white h-48 rounded-3xl animate-pulse shadow-soft"></div>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <AnimatePresence>
                                {listings
                                    .filter(item => categoryFilter === 'all' || item.category === categoryFilter)
                                    .map((item, index) => (
                                        <motion.div
                                            initial={{ opacity: 0, y: 30 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.1, type: "spring", stiffness: 50 }}
                                            key={item._id}
                                            className="bg-white rounded-3xl p-4 shadow-card hover:shadow-xl transition-shadow group relative overflow-hidden border border-brand-border/40"
                                        >
                                            {/* Image Header with Decay Overlay */}
                                            <div className="relative h-40 rounded-2xl overflow-hidden mb-4">
                                                <img
                                                    src={item.imageUrl || getCategoryImage(item.category)}
                                                    alt={item.name}
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>

                                                <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-brand-text uppercase tracking-wide flex items-center">
                                                    <Tag size={12} className="mr-1" /> {item.category}
                                                </div>

                                                <div className="absolute bottom-3 right-3 text-white text-right">
                                                    <p className="text-xs opacity-90 font-medium">Current Price</p>
                                                    <p className="text-2xl font-bold font-heading">
                                                        {item.pricePerUnit ? `₹${item.pricePerUnit}/${item.unit}` : `₹${item.currentPrice}`}
                                                    </p>
                                                </div>

                                                <div className="absolute bottom-3 left-3">
                                                    <span className={clsx("text-xs font-bold px-2 py-1 rounded-lg flex items-center backdrop-blur-md bg-white/90", getUrgencyColor(item.freeAt).split(' ')[0])}>
                                                        <Clock size={12} className="mr-1" />
                                                        {calculateTimeRemaining(item.freeAt)}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="px-1">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <h3 className="font-bold text-xl text-brand-text leading-tight group-hover:text-brand-primary transition-colors">{item.name}</h3>
                                                        <div className="flex items-center text-brand-text-secondary text-sm mt-1">
                                                            <MapPin size={14} className="mr-1 text-brand-primary" />
                                                            <span className="truncate max-w-[200px]">{item.location?.address || 'Unknown Location'}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between mt-4">
                                                    <div className="text-sm font-medium text-brand-text-secondary bg-brand-bg px-3 py-1.5 rounded-lg border border-brand-border/50">
                                                        Qty: <span className="text-brand-text">{item.unit ? `${item.quantity} ${item.unit}` : item.quantity}</span>
                                                    </div>
                                                    <p className="text-sm text-brand-text-secondary line-through mr-auto ml-3">
                                                        {item.pricePerUnit ? `₹${(item.quantity * item.pricePerUnit)}` : `₹${item.initialPrice}`}
                                                    </p>

                                                    <div className="flex space-x-2">
                                                        <motion.button
                                                            whileHover={{ scale: 1.05 }}
                                                            whileTap={{ scale: 0.95 }}
                                                            onClick={() => setActiveChat(item._id)}
                                                            className="bg-white border-2 border-brand-border text-brand-text font-bold p-2.5 rounded-xl hover:bg-brand-bg transition-colors flex items-center shadow-sm"
                                                            title="Chat with Donor"
                                                        >
                                                            <MessageSquare size={20} className="text-brand-primary" />
                                                        </motion.button>
                                                        <motion.button
                                                            whileHover={{ scale: 1.05 }}
                                                            whileTap={{ scale: 0.95 }}
                                                            onClick={() => handleClaim(item)}
                                                            className="bg-brand-text text-white font-bold py-2.5 px-6 rounded-xl hover:bg-brand-primary transition-colors flex items-center shadow-lg hover:shadow-brand-primary/30"
                                                        >
                                                            Claim <ArrowRight size={16} className="ml-2" />
                                                        </motion.button>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                            </AnimatePresence>
                        </div>
                    )}
                </div>
            </div>

            {/* Map View - Fixed */}
            <div className="hidden md:block w-full md:w-7/12 lg:w-8/12 h-full relative z-0">
                <MapContainer
                    center={center}
                    zoom={13}
                    scrollWheelZoom={true}
                    className="h-full w-full"
                    style={{ height: '100%', width: '100%' }}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                    />
                    {listings
                        .filter(item => categoryFilter === 'all' || item.category === categoryFilter)
                        .map(item => {
                            const isMyClaim = user && (item.claimedBy === user.id || item.claimedBy === user._id);

                            return (
                                <Marker
                                    key={item._id}
                                    position={[item.location?.lat || center[0], item.location?.lng || center[1]]}
                                    opacity={isMyClaim ? 1 : 0.9} // Highlight claims
                                >
                                    <Popup className="custom-popup" closeButton={false}>
                                        <div className="w-[280px]">
                                            <div className="h-32 w-full relative">
                                                <img src={item.imageUrl || getCategoryImage(item.category)} className="w-full h-full object-cover rounded-t-xl" alt="" />
                                                <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/70 to-transparent p-3 pt-8">
                                                    <h3 className="font-bold text-white text-lg">{item.name}</h3>
                                                </div>
                                                {isMyClaim && (
                                                    <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-lg shadow-md">
                                                        MY CLAIM
                                                    </div>
                                                )}
                                            </div>
                                            <div className="p-4 bg-white rounded-b-xl">
                                                <div className="flex justify-between items-end mb-4">
                                                    <div>
                                                        <p className="text-xs text-brand-text-secondary uppercase tracking-wider font-bold">Current Price</p>
                                                        <p className="font-heading font-bold text-2xl text-brand-primary">
                                                            {item.pricePerUnit ? `₹${item.pricePerUnit}/${item.unit}` : `₹${item.currentPrice}`}
                                                        </p>
                                                    </div>
                                                    {!isMyClaim && (
                                                        <div className={`px-2 py-1 rounded-lg text-xs font-bold ${getUrgencyColor(item.freeAt)}`}>
                                                            {calculateTimeRemaining(item.freeAt)} left
                                                        </div>
                                                    )}
                                                </div>

                                                {isMyClaim ? (
                                                    <div className="space-y-2">
                                                        <div className="bg-brand-bg p-2 rounded-lg text-center border border-brand-border">
                                                            <p className="text-xs font-bold text-brand-text-secondary uppercase">Pickup Code</p>
                                                            <p className="text-xl font-mono font-bold text-brand-text">{item.claimCode || '----'}</p>
                                                        </div>
                                                        <button
                                                            onClick={() => setActiveChat(item._id)}
                                                            className="w-full bg-brand-primary text-white py-2 rounded-lg font-bold hover:bg-brand-primary-dark transition-colors flex justify-center items-center"
                                                        >
                                                            <MessageSquare size={18} className="mr-2" /> Chat with Donor
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="flex space-x-2">
                                                        <button
                                                            onClick={() => setActiveChat(item._id)}
                                                            className="p-2 bg-gray-100 rounded-lg text-brand-text hover:bg-brand-primary/10 hover:text-brand-primary transition-colors"
                                                            title="Chat"
                                                        >
                                                            <MessageSquare size={20} />
                                                        </button>
                                                        {user.role !== 'donor' ? (
                                                            <button
                                                                onClick={() => handleClaim(item)}
                                                                className="flex-1 bg-brand-text text-white py-2 rounded-lg font-bold hover:bg-brand-primary transition-colors flex justify-center items-center"
                                                            >
                                                                Claim Now
                                                            </button>
                                                        ) : (
                                                            <div className="flex-1 bg-gray-100 text-gray-400 py-2 rounded-lg font-bold flex justify-center items-center cursor-not-allowed">
                                                                View Only
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </Popup>
                                </Marker>
                            );
                        })}
                </MapContainer>

                {/* Overlay Stats/Info */}
                <div className="absolute bottom-8 left-8 z-[1000] glass p-5 rounded-2xl max-w-xs animate-float">
                    <div className="flex items-center space-x-3 mb-2">
                        <div className="bg-brand-success/10 p-2 rounded-full">
                            <Check size={16} className="text-brand-success" />
                        </div>
                        <h4 className="font-bold text-brand-text">Flash-Rescue Network</h4>
                    </div>
                    <p className="text-sm text-brand-text-secondary">
                        <span className="font-bold text-brand-primary">{listings.length}</span> items are currently priced below market value.
                    </p>
                </div>
            </div>

            {/* Local Chat Overlay Removed - Handled Globally */}
        </div>
    );
};

export default ConsumerPage;
