import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Zap, ArrowRight, User, Mail, Lock } from 'lucide-react';

const RegisterPage = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'donor'
    });
    const [error, setError] = useState('');
    const { login, register } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await register(formData.name, formData.email, formData.password, formData.role);
            // Note: I can't call useAuth() inside handleSubmit, it violates hooks rules. 
            // I should destructure register from useAuth() at the top.
            // Oh wait, I only destructured { login } at the top.
            // I need to update the destructuring line first.
            if (res.success) {
                if (res.user.role === 'donor') navigate('/donor');
                else if (res.user.role === 'organization') navigate('/org');
                else navigate('/');
            } else {
                setError(res.message);
            }
        } catch (err) {
            setError('Registration failed');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-brand-bg relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-brand-primary/10 blur-[100px]"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-brand-secondary/10 blur-[120px]"></div>
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="glass w-full max-w-4xl grid md:grid-cols-2 rounded-3xl overflow-hidden shadow-2xl m-4 relative z-10"
            >
                {/* Left Side: Form */}
                <div className="p-8 md:p-12 flex flex-col justify-center">
                    <div className="mb-8">
                        <Link to="/" className="text-brand-primary font-display text-3xl mb-6 block tracking-wide">
                            Flash-Rescue
                        </Link>
                        <h2 className="text-3xl font-heading font-extrabold text-brand-text mb-2">Create Account</h2>
                        <p className="text-brand-text-secondary">Join the movement to end food waste.</p>
                    </div>

                    {error && <div className="bg-brand-expired/10 text-brand-expired p-4 rounded-xl mb-6 text-sm font-bold flex items-center"><div className="w-2 h-2 rounded-full bg-brand-expired mr-2"></div>{error}</div>}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-4">
                            <div className="relative group">
                                <User className="absolute left-4 top-3.5 text-brand-text-secondary/50 group-focus-within:text-brand-primary transition-colors" size={20} />
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="Full Name"
                                    className="input-field pl-12"
                                    required
                                />
                            </div>

                            <div className="relative group">
                                <Mail className="absolute left-4 top-3.5 text-brand-text-secondary/50 group-focus-within:text-brand-primary transition-colors" size={20} />
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="Email Address"
                                    className="input-field pl-12"
                                    required
                                />
                            </div>

                            <div className="relative group">
                                <Lock className="absolute left-4 top-3.5 text-brand-text-secondary/50 group-focus-within:text-brand-primary transition-colors" size={20} />
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="Password"
                                    className="input-field pl-12"
                                    required
                                />
                            </div>

                            <div className="pt-2">
                                <label className="block text-xs font-bold text-brand-text-secondary mb-2 uppercase tracking-wider">I want to...</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {['consumer', 'donor', 'organization'].map((roleOp) => (
                                        <button
                                            key={roleOp}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, role: roleOp })}
                                            className={`py-2 rounded-xl text-sm font-bold border transition-all ${formData.role === roleOp ? 'bg-brand-primary text-white border-brand-primary shadow-lg shadow-brand-primary/25' : 'bg-white border-brand-border text-brand-text-secondary hover:bg-brand-bg'}`}
                                        >
                                            {roleOp.charAt(0).toUpperCase() + roleOp.slice(1)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <button type="submit" className="w-full bg-gradient-to-r from-brand-primary to-brand-primary-light text-white font-bold px-6 py-4 rounded-xl shadow-lg shadow-brand-primary/20 hover:shadow-brand-primary/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center group">
                            <span className="mr-2">Create Account</span>
                            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    </form>

                    <p className="mt-8 text-center text-brand-text-secondary text-sm">
                        Already have an account? <Link to="/login" className="text-brand-primary font-bold hover:underline">Log In</Link>
                    </p>
                </div>

                {/* Right Side: Visual */}
                <div className="hidden md:block bg-brand-text relative overflow-hidden">
                    <img
                        src="https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&q=80&w=800"
                        className="absolute inset-0 w-full h-full object-cover opacity-60"
                        alt="Community Food"
                    />
                    <div className="absolute inset-0 bg-gradient-to-br from-brand-text/90 to-brand-primary/40"></div>

                    <div className="relative z-10 h-full flex flex-col justify-end p-12 text-white">
                        <blockquote className="text-2xl font-heading font-bold mb-6">
                            "Flash-Rescue helped us save over 500kg of food this month alone. It's a game changer."
                        </blockquote>
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm"></div>
                            <div>
                                <p className="font-bold">Sarah Jenkins</p>
                                <p className="text-sm opacity-80">Bakery Owner</p>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default RegisterPage;
