import { useRef } from 'react';
import { motion } from 'framer-motion';

const AnimatedButton = ({ children, onClick, className = "", type = "button", disabled = false }) => {
    return (
        <motion.button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`relative overflow-hidden group bg-brand-text text-white font-bold rounded-xl px-8 py-4 ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            whileTap={{ scale: 0.98 }}
        >
            <span className="relative z-10 flex items-center justify-center gap-2 group-hover:text-white transition-colors duration-300">
                {children}
            </span>
            <span className="absolute inset-0 bg-brand-primary transform scale-0 rounded-full group-hover:scale-[2.5] transition-transform duration-500 origin-center -z-0 ease-out" />
        </motion.button>
    );
};

export default AnimatedButton;
