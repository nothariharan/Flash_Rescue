import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom'; // Added useNavigate
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext'; // Import useChat
import { Menu, X, LogOut, Heart, Zap } from 'lucide-react';
import InteractiveHoverButton from './ui/InteractiveHoverButton';
import NotificationBell from './NotificationBell'; // Import NotificationBell
import clsx from 'clsx';

const Navbar = () => {
    const { user, logout } = useAuth();
    const { setActiveChat } = useChat(); // Use Chat Context
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="w-full bg-white/80 backdrop-blur-md border-b border-brand-border sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">

                {/* Logo */}
                <Link to="/" className="flex items-center space-x-2 group">
                    <div className="w-8 h-8 bg-brand-primary rounded-lg flex items-center justify-center text-white font-heading font-bold text-xl group-hover:scale-110 transition-transform">
                        F
                    </div>
                    <span className="font-heading font-bold text-xl text-brand-text tracking-tight">
                        Flash<span className="text-brand-primary">Rescue</span>
                    </span>
                </Link>

                {/* Desktop Nav */}
                <div className="hidden md:flex items-center space-x-6">
                    {!user ? (
                        <>
                            <Link to="/" className="text-brand-text-secondary hover:text-brand-primary font-medium text-sm transition-colors">Home</Link>
                            <Link to="/about" className="text-brand-text-secondary hover:text-brand-primary font-medium text-sm transition-colors">About</Link>
                        </>
                    ) : (
                        <>
                            {user.role === 'consumer' && <Link to="/consumer" className="text-brand-text hover:text-brand-primary font-medium text-sm">Find Food</Link>}
                            {(user.role === 'donor' || user.role === 'organization') && <Link to="/donor" className="text-brand-text hover:text-brand-primary font-medium text-sm">Donate</Link>}
                            {user.role === 'organization' && <Link to="/org" className="text-brand-text hover:text-brand-primary font-medium text-sm">Organization</Link>}
                        </>
                    )}

                    <Link to="/resources">
                        <InteractiveHoverButton>
                            Find Resources
                        </InteractiveHoverButton>
                    </Link>

                    {user ? (
                        <div className="flex items-center space-x-4 ml-2 pl-4 border-l border-brand-border h-8">
                            {/* Impact Stats Badge (Role-Based) */}
                            <div className="hidden lg:flex items-center space-x-2 bg-green-50 px-3 py-1 rounded-full border border-green-100 mr-2" title="Impact Score">
                                {user.role === 'organization' ? (
                                    <>
                                        <Heart size={14} className="text-red-500 fill-current" />
                                        <span className="text-xs font-bold text-green-700">{user.stats?.familiesHelped || 0} Families</span>
                                    </>
                                ) : (
                                    <>
                                        <Zap size={14} className="text-green-600 fill-current" />
                                        <span className="text-xs font-bold text-green-700">{user.stats?.co2Saved || 0}kg Saved</span>
                                    </>
                                )}
                            </div>

                            {/* Notification Bell */}
                            <NotificationBell onChatClick={setActiveChat} />

                            <Link to="/activity">
                                <button className="text-sm font-bold text-brand-text hover:text-brand-primary transition-colors">
                                    Activity
                                </button>
                            </Link>

                            <div className="flex items-center space-x-2">
                                <div className="w-8 h-8 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary font-bold">
                                    {user.name.charAt(0).toUpperCase()}
                                </div>
                                <span className="text-sm text-brand-text-secondary font-medium hidden lg:block">{user.name}</span>
                            </div>
                            <button onClick={handleLogout} className="text-brand-text-secondary hover:text-brand-red p-1 rounded-md hover:bg-brand-red/10 transition-colors" title="Logout">
                                <LogOut size={18} />
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center space-x-3 ml-4">
                            <Link to="/login" className="text-brand-text-secondary hover:text-brand-primary font-medium text-sm px-3 py-2">Login</Link>
                            <Link to="/register" className="bg-brand-primary text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-brand-primary/90 shadow-sm transition-all hover:shadow-md">Register</Link>
                        </div>
                    )}
                </div>

                {/* Mobile Menu Button */}
                <div className="md:hidden">
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="text-brand-text hover:text-brand-primary focus:outline-none p-2"
                    >
                        {isOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Navbar;
