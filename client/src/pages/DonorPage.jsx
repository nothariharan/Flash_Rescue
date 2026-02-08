import { useState } from 'react';
import axios from 'axios';
import { Camera, Clock, DollarSign, Package, Check, AlertCircle, FileText, Calendar, MapPin } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import InteractiveHoverButton from '../components/ui/InteractiveHoverButton';
import { getCategoryImage } from '../utils/categoryImages';

const DonorPage = () => {
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        name: '',
        category: 'produce',
        quantity: '',
        unit: 'kg', // Default
        pricePerUnit: '',
        expiryWindow: '4' // hours
    });
    const [location, setLocation] = useState({ lat: 12.9352, lng: 77.6245, address: 'Koramangala, Bangalore' });
    const [imagePreview, setImagePreview] = useState(null); // Base64 string
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    // Unit Options per Category
    const getUnitsForCategory = (cat) => {
        switch (cat) {
            case 'produce':
            case 'bakery':
            case 'cooked':
            case 'prepared':
                return ['kg', 'g', 'items', 'boxes'];
            case 'packaged':
            case 'canned':
                return ['items', 'boxes', 'cans'];
            case 'construction':
            case 'furniture':
            case 'household':
                return ['items', 'sets', 'kg'];
            case 'medical':
            case 'school':
                return ['items', 'boxes', 'sets'];
            default:
                return ['items', 'kg', 'boxes'];
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const updated = { ...prev, [name]: value };

            // Auto-update unit if category changes
            if (name === 'category') {
                updated.unit = getUnitsForCategory(value)[0];
            }

            return updated;
        });
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                alert("File size exceeds 5MB. Please upload a smaller image.");
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        try {
            const freeAt = new Date(Date.now() + parseInt(formData.expiryWindow) * 60 * 60 * 1000);

            const qtyNum = Number(formData.quantity);
            const priceNum = Number(formData.pricePerUnit);
            const total = qtyNum * priceNum;

            const payload = {
                name: formData.name,
                category: formData.category,
                quantity: qtyNum,
                unit: formData.unit,
                pricePerUnit: priceNum,
                initialPrice: total,
                freeAt: freeAt.toISOString(),
                donorId: user.id || user._id,
                location: location,
                imageUrl: imagePreview // Send Base64 if available
            };

            const token = localStorage.getItem('token');
            await axios.post('http://localhost:5000/api/listings', payload, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            setMessage('Listing created successfully!');
            setFormData({ name: '', category: 'produce', quantity: '', initialPrice: '', expiryWindow: '4' });
        } catch (error) {
            console.error(error);
            setMessage('Error creating listing.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen pt-12 pb-20 px-4 bg-brand-bg relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[10%] w-[600px] h-[600px] rounded-full bg-brand-primary/5 blur-[100px]"></div>
                <div className="absolute bottom-[10%] right-[10%] w-[500px] h-[500px] rounded-full bg-brand-secondary/5 blur-[100px]"></div>
            </div>

            <div className="max-w-5xl mx-auto relative z-10">
                <div className="flex items-center justify-between mb-10">
                    <div>
                        <h1 className="text-4xl font-heading font-extrabold text-brand-text mb-2">Donor Dashboard</h1>
                        <p className="text-brand-text-secondary text-lg">Manage your donations and impact.</p>
                    </div>
                    {/* User Profile Card Mini */}
                    <div className="hidden md:flex items-center space-x-4 glass px-6 py-3 rounded-2xl">
                        <div className="w-12 h-12 bg-gradient-to-br from-brand-primary to-brand-primary-light rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">
                            {user?.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <p className="font-bold text-brand-text">{user?.name}</p>
                            <p className="text-xs text-brand-text-secondary font-medium uppercase tracking-wider">Verified Donor</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Post Form */}
                    <div className="lg:col-span-2">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="glass rounded-3xl p-8 md:p-10 shadow-xl border-t-4 border-brand-primary relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-8 opacity-5">
                                <Package size={100} />
                            </div>

                            <div className="flex items-center mb-8">
                                <div className="bg-brand-primary/10 p-3 rounded-2xl mr-4 text-brand-primary">
                                    <Package size={28} />
                                </div>
                                <h2 className="text-2xl font-heading font-bold text-brand-text">Post New Donation</h2>
                            </div>

                            <AnimatePresence>
                                {message && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className={`p-4 rounded-2xl mb-8 flex items-center ${message.includes('Error') ? 'bg-brand-expired/10 text-brand-expired' : 'bg-brand-success/10 text-brand-success'}`}
                                    >
                                        {message.includes('Error') ? <AlertCircle className="mr-2" size={20} /> : <Check className="mr-2" size={20} />}
                                        <span className="font-bold">{message}</span>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <form onSubmit={handleSubmit} className="space-y-8">
                                {/* Item Details */}
                                <div className="space-y-6">
                                    <div>
                                        <label className="flex items-center text-xs font-bold text-brand-text-secondary mb-2 uppercase tracking-wide">
                                            <FileText size={14} className="mr-1.5" /> Item Name
                                        </label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            placeholder="What are you donating? (e.g., 5kg Mixed Bagels)"
                                            className="input-field text-lg font-medium shadow-sm bg-brand-bg/50 focus:bg-white transition-colors"
                                            required
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="flex items-center text-xs font-bold text-brand-text-secondary mb-2 uppercase tracking-wide">
                                                Category
                                            </label>
                                            <div className="relative">
                                                <select
                                                    name="category"
                                                    value={formData.category}
                                                    onChange={handleChange}
                                                    className="input-field appearance-none cursor-pointer bg-brand-bg/50 focus:bg-white"
                                                >
                                                    <option value="produce">Fresh Produce</option>
                                                    <option value="cooked">Cooked Leftovers</option>
                                                    <option value="bakery">Bakery & Breads</option>
                                                    <option value="construction">Construction Materials</option>
                                                    <option value="household">Household Items</option>
                                                    <option value="general">General Waste</option>
                                                    <option value="prepared">Prepared Meals</option>
                                                    <option value="packaged">Packaged Goods</option>
                                                </select>
                                                <div className="absolute right-4 top-4 pointer-events-none text-brand-text-secondary">
                                                    <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="flex items-center text-xs font-bold text-brand-text-secondary mb-2 uppercase tracking-wide">
                                                Quantity & Unit
                                            </label>
                                            <div className="flex space-x-2">
                                                <input
                                                    type="number"
                                                    name="quantity"
                                                    value={formData.quantity}
                                                    onChange={handleChange}
                                                    placeholder="0"
                                                    className="input-field bg-brand-bg/50 focus:bg-white w-2/3"
                                                    required
                                                />
                                                <div className="relative w-1/3">
                                                    <select
                                                        name="unit"
                                                        value={formData.unit}
                                                        onChange={handleChange}
                                                        className="input-field appearance-none cursor-pointer bg-brand-bg/50 focus:bg-white"
                                                    >
                                                        {getUnitsForCategory(formData.category).map(u => (
                                                            <option key={u} value={u}>{u}</option>
                                                        ))}
                                                    </select>
                                                    <div className="absolute right-2 top-4 pointer-events-none text-brand-text-secondary">
                                                        <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Image Upload Section */}
                                    <div>
                                        <label className="flex items-center text-xs font-bold text-brand-text-secondary mb-2 uppercase tracking-wide">
                                            <Camera size={14} className="mr-1.5" /> Upload Photo (Optional)
                                        </label>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageChange}
                                            className="block w-full text-sm text-brand-text-secondary
                                                file:mr-4 file:py-2 file:px-4
                                                file:rounded-full file:border-0
                                                file:text-sm file:font-semibold
                                                file:bg-brand-primary/10 file:text-brand-primary
                                                hover:file:bg-brand-primary/20
                                            "
                                        />
                                        <p className="text-xs text-brand-text-secondary mt-1">Max 5MB. Real photos help items go faster!</p>
                                    </div>
                                </div>

                                <div className="border-t border-brand-border/60 border-dashed"></div>

                                {/* Pricing & Timing */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="group">
                                        <label className="flex items-center text-xs font-bold text-brand-text-secondary mb-2 uppercase tracking-wide group-focus-within:text-brand-primary transition-colors">
                                            <DollarSign size={14} className="mr-1" /> Price Per {formData.unit || 'Unit'} (₹)
                                        </label>
                                        <input
                                            type="number"
                                            name="pricePerUnit"
                                            value={formData.pricePerUnit}
                                            onChange={handleChange}
                                            placeholder="0"
                                            className="input-field bg-brand-bg/50 focus:bg-white font-mono"
                                            required
                                        />
                                        {formData.quantity && formData.pricePerUnit && (
                                            <p className="text-xs text-brand-primary font-bold mt-2">
                                                Total Value: ₹{(Number(formData.quantity) * Number(formData.pricePerUnit)).toLocaleString()}
                                            </p>
                                        )}
                                    </div>
                                    <div className="group">
                                        <label className="flex items-center text-xs font-bold text-brand-text-secondary mb-2 uppercase tracking-wide group-focus-within:text-brand-primary transition-colors">
                                            <Clock size={14} className="mr-1" /> Expires In (Hours)
                                        </label>
                                        <input
                                            type="number"
                                            name="expiryWindow"
                                            value={formData.expiryWindow}
                                            onChange={handleChange}
                                            placeholder="4"
                                            className="input-field bg-brand-bg/50 focus:bg-white font-mono"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Image Preview Section */}
                                <div className="bg-brand-bg p-4 rounded-2xl flex items-center space-x-4 border border-brand-border">
                                    <div className="w-16 h-16 rounded-xl overflow-hidden shadow-sm relative bg-brand-bg md:w-20 md:h-20 shrink-0">
                                        <img
                                            // Show uploaded preview if exists, else category default
                                            src={imagePreview || getCategoryImage(formData.category)}
                                            alt="Preview"
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-brand-text">Listing Image Preview</p>
                                        <p className="text-xs text-brand-text-secondary">
                                            {imagePreview ? 'Using uploaded image.' : 'Using category default.'}
                                        </p>
                                    </div>
                                </div>

                                <div className="pt-2">
                                    <InteractiveHoverButton
                                        type="submit"
                                        disabled={loading}
                                        className="w-full flex justify-center bg-brand-text text-white"
                                    >
                                        {loading ? 'Publishing...' : 'Publish Listing'}
                                    </InteractiveHoverButton>
                                </div>
                            </form>
                        </motion.div>
                    </div>

                    {/* Right Column: Stats & Info */}
                    <div className="space-y-8">
                        {/* Location Card */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 }}
                            className="glass p-6 rounded-3xl"
                        >
                            <h3 className="text-lg font-heading font-bold text-brand-text mb-4 flex items-center">
                                <MapPin size={20} className="mr-2 text-brand-primary" /> Location
                            </h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-brand-text-secondary uppercase mb-2 block">Quick Select Hub</label>
                                    <select
                                        className="input-field bg-brand-bg/50"
                                        onChange={(e) => {
                                            const [lat, lng, address] = e.target.value.split('|');
                                            setLocation({ lat: parseFloat(lat), lng: parseFloat(lng), address });
                                        }}
                                    >
                                        <option value="12.9352|77.6245|Koramangala, Bangalore">Koramangala</option>
                                        <option value="12.9719|77.6412|Indiranagar, Bangalore">Indiranagar</option>
                                        <option value="12.9698|77.7500|Whitefield, Bangalore">Whitefield</option>
                                        <option value="12.9304|77.5834|Jayanagar, Bangalore">Jayanagar</option>
                                        <option value="12.9756|77.6097|MG Road, Bangalore">MG Road</option>
                                    </select>
                                </div>

                                <div className="text-center text-xs text-brand-text-secondary font-bold uppercase tracking-widest my-2">- OR -</div>

                                <button
                                    type="button"
                                    onClick={() => {
                                        if (navigator.geolocation) {
                                            navigator.geolocation.getCurrentPosition((position) => {
                                                setLocation({
                                                    lat: position.coords.latitude,
                                                    lng: position.coords.longitude,
                                                    address: "Live Location (GPS)"
                                                });
                                                alert("Location updated to your current position!");
                                            }, () => alert("Could not fetch location."));
                                        } else {
                                            alert("Geolocation is not supported by this browser.");
                                        }
                                    }}
                                    className="w-full py-3 rounded-xl border-2 border-dashed border-brand-primary/30 text-brand-primary font-bold hover:bg-brand-primary/5 transition-colors flex items-center justify-center"
                                >
                                    <MapPin size={16} className="mr-2" /> Use Live Location
                                </button>

                                <div className="bg-brand-success/10 p-4 rounded-xl border border-brand-success/20">
                                    <p className="text-xs text-brand-text-secondary uppercase mb-1">Selected Location</p>
                                    <p className="font-bold text-brand-text">{location.address}</p>
                                    <p className="text-xs font-mono text-brand-text-secondary mt-1">{location.lat.toFixed(4)}, {location.lng.toFixed(4)}</p>
                                </div>
                            </div>
                        </motion.div>

                        {/* Recent Activity / Placeholder */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                            className="glass p-6 rounded-3xl bg-brand-primary/5 border-none"
                        >
                            <h3 className="text-lg font-heading font-bold text-brand-text mb-4">Your Impact</h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center bg-white p-3 rounded-xl shadow-sm">
                                    <span className="text-sm font-medium text-brand-text-secondary">Resources Sold</span>
                                    <span className="text-lg font-bold text-brand-primary">{user?.stats?.itemsSold || 0}</span>
                                </div>
                                <div className="flex justify-between items-center bg-white p-3 rounded-xl shadow-sm">
                                    <span className="text-sm font-medium text-brand-text-secondary">Resources Donated</span>
                                    <span className="text-lg font-bold text-green-600">{user?.stats?.itemsDonated || 0}</span>
                                </div>
                                <div className="flex justify-between items-center bg-white p-3 rounded-xl shadow-sm">
                                    <span className="text-sm font-medium text-brand-text-secondary">CO2 Avoided</span>
                                    <span className="text-lg font-bold text-brand-secondary">{user?.stats?.co2Saved || 0}kg</span>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DonorPage;
