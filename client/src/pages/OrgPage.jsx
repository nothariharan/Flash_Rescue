import { useState, useEffect } from 'react';
import io from 'socket.io-client';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents } from 'react-leaflet';
import { Package, MapPin, ArrowRight, Truck, CheckCircle, Navigation, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import L from 'leaflet';
import InteractiveHoverButton from '../components/ui/InteractiveHoverButton';
import ChatWindow from '../components/ChatWindow';

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

// Custom Mission Icon
const missionIcon = new L.DivIcon({
    className: 'custom-mission-icon',
    html: `<div class="w-8 h-8 bg-brand-primary rounded-full border-4 border-white shadow-xl flex items-center justify-center text-white"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg></div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16]
});

// Custom Truck Icon
const truckIcon = new L.DivIcon({
    className: 'custom-truck-icon',
    html: `<div class="w-10 h-10 bg-brand-text rounded-full border-4 border-white shadow-xl flex items-center justify-center text-white relative z-50 transform rotate-45"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg></div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20]
});


import { useChat } from '../context/ChatContext'; // Import useChat

const OrgPage = () => {
    const [missions, setMissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeMission, setActiveMission] = useState(null);
    const [selectedItems, setSelectedItems] = useState([]); // Array of item IDs
    // const [activeChat, setActiveChat] = useState(null); // REMOVED
    const { setActiveChat } = useChat(); // Use global context

    // Driver Simulation State
    const [driverLocation, setDriverLocation] = useState(null); // [lat, lng]
    const [isRecovering, setIsRecovering] = useState(false);
    const [pathToTarget, setPathToTarget] = useState([]);

    // Map State
    const [zoomLevel, setZoomLevel] = useState(13); // Track zoom

    // Component to capture zoom events
    const MapZoomHandler = () => {
        const map = useMapEvents({
            zoomend: () => {
                setZoomLevel(map.getZoom());
                console.log('Zoom:', map.getZoom());
            },
        });
        return null;
    };

    // Default Bangalore location
    const center = [12.9716, 77.5946];
    // Mock "Depot" location (slightly offset)
    const depotLocation = [12.9600, 77.5800];

    useEffect(() => {
        const socket = io('http://localhost:5000'); // Connect to backend

        // Listen for pre-calculated clusters/missions
        socket.on('missionUpdate', (newMissions) => {
            console.log('Received missions:', newMissions);
            setMissions(newMissions);
            setLoading(false);
        });

        // Listen for collection events to remove items from view (if needed, though missionUpdate might cover it)
        socket.on('listingsCollected', (data) => {
            // Data is now { ids: [], collectedBy: ... }
            // We mainly rely on missionUpdate or re-fetch
            const fetchClusters = async () => {
                try {
                    const response = await fetch('http://localhost:5000/api/listings/clusters');
                    const clusters = await response.json();
                    setMissions(clusters);
                } catch (e) { console.error(e); }
            };
            fetchClusters();
        });

        // Request initial state
        const fetchClusters = async () => {
            try {
                const response = await fetch('http://localhost:5000/api/listings/clusters');
                const data = await response.json();
                setMissions(data);
            } catch (error) {
                console.error('Error fetching clusters:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchClusters();

        return () => socket.disconnect();
    }, []);

    const simulateRecovery = (mission) => {
        setIsRecovering(true);
        setActiveMission(null); // Close the popup

        // Start from Depot
        setDriverLocation(depotLocation);

        const target = [mission.center.lat, mission.center.lng];
        const steps = 100; // Animation frames
        const duration = 5000; // 5 seconds to arrive
        const intervalTime = duration / steps;

        let step = 0;
        const latStep = (target[0] - depotLocation[0]) / steps;
        const lngStep = (target[1] - depotLocation[1]) / steps;

        // Path line
        setPathToTarget([depotLocation, target]);

        const interval = setInterval(() => {
            step++;
            setDriverLocation(prev => [
                depotLocation[0] + (latStep * step),
                depotLocation[1] + (lngStep * step)
            ]);

            if (step >= steps) {
                clearInterval(interval);

                // Call Backend to finalize collection
                const token = localStorage.getItem('token');

                // Use the selected items passed to the function, or default to all if not specified (safety fallback)
                const listingIds = mission.selectedIds || mission.items.map(item => item._id);

                // We use fetch inside this closure or axios if imported. 
                // Using fetch for simplicity in this callback context.
                fetch('http://localhost:5000/api/listings/collect', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ listingIds })
                })
                    .then(res => res.json())
                    .then(data => {
                        const collectedCount = listingIds.length;
                        const impactMsg = data.impact ? `\n🌱 CO2 Saved: ${data.impact.co2Saved}kg` : '';
                        alert(`🚚 Driver Arrived at Cluster!\n\nCollected ${collectedCount} items.${impactMsg}`);

                        setIsRecovering(false);
                        setDriverLocation(null);
                        setPathToTarget([]);

                        // FIX: Only remove collected items, don't delete whole mission unless empty
                        setMissions(prev => {
                            return prev.map(m => {
                                if (m.id === mission.id) {
                                    const remainingItems = m.items.filter(item => !listingIds.includes(item._id));

                                    if (remainingItems.length === 0) return null; // Mission complete

                                    // Recalculate weight
                                    const newWeight = remainingItems.reduce((sum, item) => sum + (parseFloat(item.quantity) || 0), 0);

                                    return {
                                        ...m,
                                        items: remainingItems,
                                        totalWeight: Math.round(newWeight * 10) / 10
                                    };
                                }
                                return m;
                            }).filter(Boolean); // Filter out nulls
                        });

                        // Clear selection
                        setSelectedItems([]);
                    })
                    .catch(err => {
                        console.error("Collection Failed", err);
                        alert("Driver arrived but failed to update system.");
                        setIsRecovering(false);
                    });
            }
        }, intervalTime);
    };

    const handleMissionClick = (mission) => {
        setActiveMission(mission);
        // Default select all items
        setSelectedItems(mission.items.map(i => i._id));
    };

    const toggleItemSelection = (itemId) => {
        setSelectedItems(prev => {
            if (prev.includes(itemId)) {
                return prev.filter(id => id !== itemId);
            } else {
                return [...prev, itemId];
            }
        });
    };

    const handleAcceptMission = (missionId) => {
        const mission = missions.find(m => m.id === missionId);
        if (mission) {
            if (selectedItems.length === 0) {
                alert("Please select at least one item to collect.");
                return;
            }
            // Pass selected IDs to simulation
            const missionWithSelection = {
                ...mission,
                selectedIds: selectedItems
            };
            simulateRecovery(missionWithSelection);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] md:flex-row bg-brand-bg">
            {/* Sidebar Feed */}
            <div className="w-full md:w-4/12 h-full overflow-y-auto border-r border-brand-border bg-white relative z-10 shadow-2xl">
                <div className="p-6">
                    <div className="mb-8">
                        <div className="flex items-center space-x-2 text-brand-primary mb-2">
                            <Truck size={24} />
                            <span className="font-bold text-sm uppercase tracking-wider">Logistics Command</span>
                        </div>
                        <h1 className="text-3xl font-heading font-extrabold text-brand-text">Rescue Missions</h1>
                        <p className="text-brand-text-secondary mt-2">
                            High-volume clusters optimized for pickup.
                        </p>
                    </div>

                    {loading && missions.length === 0 ? (
                        <div className="space-y-4">
                            {[1, 2].map(i => (
                                <div key={i} className="h-40 bg-brand-bg rounded-2xl animate-pulse"></div>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {missions.length === 0 ? (
                                <div className="text-center py-10 bg-brand-bg/50 rounded-2xl border-dashed border-2 border-brand-border">
                                    <CheckCircle size={48} className="mx-auto text-brand-text-secondary mb-4 opacity-50" />
                                    <p className="font-bold text-brand-text">All Clear</p>
                                    <p className="text-sm text-brand-text-secondary">No sufficient clusters found yet.</p>
                                </div>
                            ) : (
                                <AnimatePresence>
                                    {missions.map((mission) => (
                                        <motion.div
                                            layout
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                            key={mission.id}
                                            onClick={() => handleMissionClick(mission)}
                                            className={`p-5 rounded-2xl border transition-all cursor-pointer ${activeMission?.id === mission.id ? 'bg-brand-primary/5 border-brand-primary shadow-lg ring-1 ring-brand-primary' : 'bg-white border-brand-border hover:border-brand-primary/50 hover:shadow-md'}`}
                                        >
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="bg-brand-text text-white text-xs font-bold px-3 py-1 rounded-full flex items-center">
                                                    <Package size={12} className="mr-1" />
                                                    {mission.items.length} Stops
                                                </div>
                                                <span className="text-lg font-bold text-brand-primary">
                                                    {mission.totalWeight}kg Load
                                                </span>
                                            </div>

                                            <div className="space-y-2 mb-4">
                                                {mission.items.slice(0, 3).map((item, idx) => (
                                                    <div key={idx} className="flex items-center text-sm text-brand-text-secondary">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-brand-border mr-2"></div>
                                                        <span className="truncate">{item.name}</span>
                                                    </div>
                                                ))}
                                                {mission.items.length > 3 && (
                                                    <div className="text-xs text-brand-text-secondary pl-4">+ {mission.items.length - 3} more items</div>
                                                )}
                                            </div>

                                            <div className="flex items-center justify-between mt-2 pt-3 border-t border-brand-border/50">
                                                <div className="text-xs font-bold text-brand-text-secondary uppercase">
                                                    {mission.center.address || 'Koramangala Cluster'}
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setActiveChat(mission.items[0]._id); }} // Chat about the first item? Or Mission Chat? Using first item for now.
                                                        className="p-1.5 text-brand-text-secondary hover:text-brand-primary hover:bg-brand-primary/10 rounded-lg transition-colors"
                                                        title="Chat about this mission"
                                                    >
                                                        <MessageSquare size={16} />
                                                    </button>
                                                    <div className="text-brand-primary">
                                                        <ArrowRight size={20} />
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Map View */}
            <div className="w-full md:w-8/12 h-full relative z-0">
                <MapContainer
                    center={center}
                    zoom={13}
                    className="h-full w-full"
                >
                    <TileLayer
                        attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
                        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                    />

                    <MapZoomHandler />

                    {/* Driver Simulation Elements - Always Visible */}
                    {driverLocation && (
                        <>
                            <Marker position={driverLocation} icon={truckIcon}>
                                <Popup>Your Fleet Unit #42</Popup>
                            </Marker>
                            {pathToTarget.length > 0 && (
                                <Polyline
                                    positions={pathToTarget}
                                    pathOptions={{ color: '#2D3436', weight: 4, opacity: 0.6, dashArray: '10, 10' }}
                                />
                            )}
                        </>
                    )}

                    {missions.map(mission => (
                        <div key={mission.id}>
                            {/* ZOOMED OUT (<15): Show only Stack/Hub Icon */}
                            {zoomLevel < 15 && (
                                <Marker position={[mission.center.lat, mission.center.lng]} icon={missionIcon}>
                                    <Popup>
                                        <div className="p-2 text-center">
                                            <h3 className="font-bold text-lg mb-1">Mission Cluster</h3>
                                            <p className="text-sm font-medium text-brand-text-secondary">{mission.items.length} items nearby</p>
                                            <p className="text-xs text-brand-primary mt-1">Zoom in to see details</p>
                                        </div>
                                    </Popup>
                                </Marker>
                            )}

                            {/* ZOOMED IN (>=15): Show Individual Pins + Routes */}
                            {zoomLevel >= 15 && (
                                <>
                                    {/* Central Hub Marker (Optional, maybe smaller or just the route center) */}
                                    <Marker position={[mission.center.lat, mission.center.lng]} icon={missionIcon} opacity={0.6}>
                                        <Popup>
                                            <div className="p-2 text-center">
                                                <h3 className="font-bold text-lg mb-1">Mission #{mission.id.split('-')[1].slice(-4)}</h3>
                                                <div className="bg-brand-primary/10 text-brand-primary font-heading font-bold text-xl py-1 rounded-lg">
                                                    {mission.totalWeight}kg Load
                                                </div>
                                            </div>
                                        </Popup>
                                    </Marker>

                                    {/* Individual Pickup Points */}
                                    {mission.items.map(item => (
                                        <Marker
                                            key={item._id}
                                            position={[item.location?.lat || center[0], item.location?.lng || center[1]]}
                                        >
                                            <Popup>
                                                <div className="p-1">
                                                    <p className="font-bold">{item.name}</p>
                                                    <p className="text-xs">{item.quantity} {item.unit} • {item.category}</p>
                                                </div>
                                            </Popup>
                                        </Marker>
                                    ))}

                                    {/* Route Lines */}
                                    <Polyline
                                        positions={[
                                            [mission.center.lat, mission.center.lng],
                                            ...mission.items.map(item => [item.location?.lat || center[0], item.location?.lng || center[1]]),
                                            [mission.center.lat, mission.center.lng]
                                        ]}
                                        pathOptions={{ color: '#FF6B00', weight: 4, opacity: 0.8, dashArray: '10, 10' }}
                                    >
                                        <Popup>
                                            <div className="flex flex-col space-y-2">
                                                <span className="font-bold text-brand-primary">
                                                    Route: {mission.items.length} Stops ({mission.totalWeight}kg)
                                                </span>
                                                <button
                                                    onClick={() => setActiveChat(mission.items[0]._id)}
                                                    className="text-xs bg-brand-primary text-white px-2 py-1 rounded shadow flex items-center"
                                                >
                                                    <MessageSquare size={12} className="mr-1" /> Team Chat
                                                </button>
                                            </div>
                                        </Popup>
                                    </Polyline>
                                </>
                            )}
                        </div>
                    ))}
                </MapContainer>

                {/* Floating Action Panel if Mission Selected */}
                <AnimatePresence>
                    {activeMission && !isRecovering && (
                        <motion.div
                            initial={{ y: 100, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 100, opacity: 0 }}
                            className="absolute bottom-8 left-8 right-8 md:left-auto md:right-8 md:w-96 glass p-6 rounded-3xl z-[1000] shadow-2xl border-t-4 border-brand-primary"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="font-heading font-bold text-xl text-brand-text">Mission Ready</h3>
                                    <p className="text-sm text-brand-text-secondary">Est. Route: 4.2km • 25 mins</p>
                                </div>
                                <div className="bg-brand-primary/10 p-2 rounded-xl text-brand-primary">
                                    <MapPin size={24} />
                                </div>
                            </div>

                            <div className="mb-4 max-h-40 overflow-y-auto pr-2 space-y-2">
                                <p className="text-xs font-bold text-brand-text-secondary uppercase mb-2">Select Items to Pick Up</p>
                                {activeMission.items.map(item => (
                                    <div key={item._id} className="flex items-center space-x-2">
                                        <div
                                            onClick={() => toggleItemSelection(item._id)}
                                            className={`flex-1 flex items-center p-3 rounded-xl border cursor-pointer transition-all ${selectedItems.includes(item._id) ? 'bg-brand-primary/5 border-brand-primary' : 'bg-white border-brand-border hover:border-brand-primary/30'}`}
                                        >
                                            <div className={`w-5 h-5 rounded-md border flex items-center justify-center mr-3 transition-colors ${selectedItems.includes(item._id) ? 'bg-brand-primary border-brand-primary' : 'border-brand-text-secondary/30'}`}>
                                                {selectedItems.includes(item._id) && <CheckCircle size={14} className="text-white" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-sm text-brand-text truncate">{item.name}</p>
                                                <p className="text-xs text-brand-text-secondary">{item.quantity} • {item.category}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setActiveChat(item._id); }}
                                            className="p-3 bg-white border border-brand-border rounded-xl text-brand-text hover:text-brand-primary hover:border-brand-primary transition-colors"
                                            title="Chat with Donor"
                                        >
                                            <MessageSquare size={18} />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            {/* Replaced InteractiveHoverButton with a standard prominent button for visibility */}
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => handleAcceptMission(activeMission.id)}
                                disabled={selectedItems.length === 0}
                                className={`w-full font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center space-x-2 ${selectedItems.length > 0 ? 'bg-brand-primary text-white shadow-brand-primary/20 hover:bg-brand-primary-dark' : 'bg-brand-border text-brand-text-secondary cursor-not-allowed'}`}
                            >
                                <Navigation size={20} />
                                <span>Start Recovery ({selectedItems.length})</span>
                            </motion.button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Local Chat Overlay Removed - Handled Globally */}
            </div>
        </div>
    );
};

export default OrgPage;
