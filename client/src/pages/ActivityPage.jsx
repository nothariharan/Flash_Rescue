import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Package, MessageSquare, CheckCircle, Clock } from 'lucide-react';
import { useChat } from '../context/ChatContext';

const ActivityPage = () => {
    const { user } = useAuth();
    const [myListings, setMyListings] = useState([]);
    const [myClaims, setMyClaims] = useState([]);
    const [loading, setLoading] = useState(true);
    // const [activeChat, setActiveChat] = useState(null); // REMOVED
    const { setActiveChat } = useChat(); // Use global context

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('token');
                const config = { headers: { Authorization: `Bearer ${token}` } };

                // Fetch My Listings (if Donor)
                if (user.role === 'donor' || user.role === 'organization') {
                    const res = await axios.get(`http://localhost:5000/api/listings?donor=${user.id || user._id}`, config);
                    setMyListings(res.data);
                }

                // Fetch My Claims (Everyone can claim)
                const resClaims = await axios.get(`http://localhost:5000/api/listings?claimedBy=${user.id || user._id}`, config);
                setMyClaims(resClaims.data);

            } catch (error) {
                console.error("Error fetching activity:", error);
            } finally {
                setLoading(false);
            }
        };

        if (user) fetchData();
    }, [user]);

    const getStatusColor = (status) => {
        switch (status) {
            case 'active': return 'bg-green-100 text-green-700 border-green-200';
            case 'claimed': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'collected': return 'bg-gray-100 text-gray-700 border-gray-200';
            default: return 'bg-gray-50 text-gray-500';
        }
    };

    return (
        <div className="min-h-screen bg-brand-bg pt-8 px-4 pb-20">
            <div className="max-w-5xl mx-auto">
                <h1 className="text-3xl font-heading font-extrabold text-brand-text mb-8">Activity Hub</h1>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                    {/* My Claims Column */}
                    <div>
                        <h2 className="text-xl font-bold text-brand-text mb-4 flex items-center">
                            <Package className="mr-2 text-brand-primary" /> My Claims
                        </h2>
                        <div className="space-y-4">
                            {loading ? <p>Loading...</p> : myClaims.length === 0 ? (
                                <div className="bg-white p-6 rounded-2xl border border-dashed border-brand-border text-center text-brand-text-secondary">
                                    You haven't claimed any items yet.
                                </div>
                            ) : (
                                myClaims.map(item => (
                                    <div key={item._id} className="bg-white p-4 rounded-2xl shadow-sm border border-brand-border hover:shadow-md transition-shadow">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="font-bold text-brand-text">{item.name}</h3>
                                                <p className="text-xs text-brand-text-secondary">{item.quantity} {item.unit} • {item.location?.address}</p>

                                                {/* OTP Display */}
                                                {item.status === 'claimed' && (
                                                    <div className="mt-2 bg-brand-bg inline-block px-3 py-1 rounded-lg border border-brand-border">
                                                        <span className="text-xs font-bold text-brand-text-secondary uppercase mr-2">Pickup Code:</span>
                                                        <span className="font-mono font-bold text-lg text-brand-primary">{item.claimCode || '----'}</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className={`text-xs px-2 py-1 rounded-lg border ${getStatusColor(item.status)}`}>
                                                {item.status}
                                            </div>
                                        </div>

                                        <div className="mt-4 pt-4 border-t border-brand-border/50 flex justify-end">
                                            <button
                                                onClick={() => setActiveChat(item._id)}
                                                className="bg-brand-text text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center hover:bg-brand-primary transition-colors"
                                            >
                                                <MessageSquare size={16} className="mr-2" /> Chat with Donor
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* My Listings Column */}
                    {(user.role === 'donor' || user.role === 'organization') && (
                        <div>
                            <h2 className="text-xl font-bold text-brand-text mb-4 flex items-center">
                                <CheckCircle className="mr-2 text-brand-secondary" /> My Listings
                            </h2>
                            <div className="space-y-4">
                                {loading ? <p>Loading...</p> : myListings.length === 0 ? (
                                    <div className="bg-white p-6 rounded-2xl border border-dashed border-brand-border text-center text-brand-text-secondary">
                                        No active listings.
                                    </div>
                                ) : (
                                    myListings.map(item => (
                                        <div key={item._id} className="bg-white p-4 rounded-2xl shadow-sm border border-brand-border hover:shadow-md transition-shadow">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h3 className="font-bold text-brand-text">{item.name}</h3>
                                                    <p className="text-xs text-brand-text-secondary">{item.quantity} {item.unit} • Expires in {item.expiryWindow}h</p>
                                                </div>
                                                <div className={`text-xs px-2 py-1 rounded-lg border ${getStatusColor(item.status)}`}>
                                                    {item.status}
                                                </div>
                                            </div>

                                            <div className="mt-4 pt-4 border-t border-brand-border/50 flex justify-end space-x-2">
                                                {item.status === 'claimed' && (
                                                    <button
                                                        onClick={() => setActiveChat(item._id)}
                                                        className="bg-white border border-brand-border text-brand-text px-4 py-2 rounded-xl text-sm font-bold flex items-center hover:bg-brand-bg transition-colors"
                                                    >
                                                        <MessageSquare size={16} className="mr-2 text-brand-primary" /> Chat with Claimer
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Local Chat Overlay Removed - Handled Globally */}
        </div>
    );
};

export default ActivityPage;
