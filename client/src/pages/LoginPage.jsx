import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, ArrowRight, Mail, Lock } from 'lucide-react';

const LoginPage = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await login(formData.email, formData.password);
            if (res.success) {
                if (res.user.role === 'donor') navigate('/donor');
                else if (res.user.role === 'organization') navigate('/org');
                else navigate('/consumer');
            } else {
                setError(res.message);
            }
        } catch (err) {
            setError('Login failed');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-brand-bg relative overflow-hidden">
            {/* Dynamic Background */}
            <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full bg-brand-primary/10 blur-[120px] animate-float"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[700px] h-[700px] rounded-full bg-brand-secondary/10 blur-[150px] animate-pulse-slow"></div>
                <div className="absolute top-[40%] left-[20%] w-[300px] h-[300px] rounded-full bg-brand-warning/5 blur-[100px]"></div>
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.98, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
                className="glass-dark md:glass w-full max-w-[1000px] grid md:grid-cols-2 rounded-[2.5rem] overflow-hidden shadow-2xl m-4 relative z-10 border border-white/40"
            >
                {/* Left Side: Form */}
                <div className="p-8 md:p-14 flex flex-col justify-center relative">
                    <div className="mb-10">
                        <Link to="/" className="inline-flex items-center space-x-2 text-brand-primary font-display text-2xl mb-8 tracking-wide hover:scale-105 transition-transform">
                            <Zap size={24} className="fill-current" />
                            <span>Flash-Rescue</span>
                        </Link>
                        <h2 className="text-4xl font-heading font-extrabold text-white mb-3">Welcome Back</h2>
                        <p className="text-gray-300 text-lg">Enter your details to access your dashboard.</p>
                    </div>

                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="bg-brand-expired/10 border border-brand-expired/20 text-brand-expired px-4 py-3 rounded-xl mb-6 text-sm font-bold flex items-center"
                            >
                                <div className="w-2 h-2 rounded-full bg-brand-expired mr-3 animate-pulse"></div>
                                {error}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-5">
                            <div className="relative group">
                                <label className="text-xs font-bold text-gray-300 uppercase ml-1 mb-1.5 block">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-3.5 text-gray-500 group-focus-within:text-brand-primary transition-colors duration-300" size={20} />
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="user@example.com"
                                        autoComplete="email"
                                        className="input-field pl-12 py-3.5 bg-white/90 border-transparent focus:bg-white focus:border-brand-primary/50 focus:ring-4 focus:ring-brand-primary/10 transition-all duration-300 text-brand-text"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="relative group">
                                <label className="text-xs font-bold text-gray-300 uppercase ml-1 mb-1.5 block">Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-3.5 text-gray-500 group-focus-within:text-brand-primary transition-colors duration-300" size={20} />
                                    <input
                                        type="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        placeholder="••••••••"
                                        autoComplete="current-password"
                                        className="input-field pl-12 py-3.5 bg-white/90 border-transparent focus:bg-white focus:border-brand-primary/50 focus:ring-4 focus:ring-brand-primary/10 transition-all duration-300 text-brand-text"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between text-sm pt-2">
                            <label className="flex items-center text-gray-300 cursor-pointer hover:text-white transition-colors">
                                <input type="checkbox" className="mr-2.5 rounded border-gray-500 bg-transparent text-brand-primary focus:ring-brand-primary/30 w-4 h-4" />
                                <span className="font-medium">Remember me</span>
                            </label>
                            <a href="#" className="font-bold text-brand-primary hover:text-brand-primary-light transition-colors">Forgot Password?</a>
                        </div>

                        <button type="submit" className="w-full bg-gradient-to-r from-brand-primary to-brand-primary-light text-white font-bold text-lg px-6 py-4 rounded-xl shadow-lg shadow-brand-primary/20 hover:shadow-brand-primary/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center group overflow-hidden relative">
                            <span className="relative z-10 mr-2">Sign In</span>
                            <ArrowRight size={20} className="relative z-10 group-hover:translate-x-1 transition-transform" />
                            <div className="absolute inset-0 bg-gradient-to-r from-brand-primary-dark to-brand-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        </button>
                    </form>

                    <p className="mt-8 text-center text-brand-text-secondary text-sm">
                        New to Flash-Rescue? <Link to="/register" className="text-brand-primary font-bold hover:underline">Create Account</Link>
                    </p>
                </div>

                {/* Right Side: Visual */}
                <div className="hidden md:block relative overflow-hidden bg-brand-text">
                    <div className="absolute inset-0 bg-brand-primary/20 mix-blend-overlay z-10"></div>
                    <img
                        src="https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&q=80&w=1200"
                        className="absolute inset-0 w-full h-full object-cover opacity-80 scale-105 group-hover:scale-110 transition-transform duration-1000"
                        alt="Community Food Share"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-20"></div>

                    <div className="relative z-30 h-full flex flex-col justify-end p-12 text-white">
                        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10 shadow-lg mb-8 transform transition-transform hover:-translate-y-2 duration-500">
                            <div className="flex items-center space-x-2 text-brand-primary-light mb-2">
                                <Zap size={18} className="fill-current" />
                                <span className="text-xs font-bold uppercase tracking-wider">Impact Update</span>
                            </div>
                            <h3 className="text-2xl font-heading font-bold mb-3 leading-tight text-brand-warning">Every meal saved makes a difference.</h3>
                            <p className="opacity-90 leading-relaxed text-sm text-gray-200">
                                "We connected 500+ surplus meals to local shelters just last week. Join the movement today."
                            </p>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default LoginPage;
