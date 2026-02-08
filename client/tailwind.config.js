/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['"DM Sans"', 'Inter', 'sans-serif'],
                heading: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
                accent: ['"Caveat"', 'cursive'],
                mono: ['"IBM Plex Mono"', 'monospace'],
                display: ['"Racing Sans One"', 'cursive'],
            },
            colors: {
                brand: {
                    primary: '#FF6B00', // Primary Orange
                    'primary-light': '#FF8F33', // Hover
                    'primary-dark': '#E55A00', // Active

                    secondary: '#10B981', // Success Green
                    'secondary-accent': '#34D399', // Map highlights

                    bg: '#FAFAF9', // Warm off-white
                    surface: '#FFFFFF',

                    text: '#1F2937', // Gray-900 equivalent
                    'text-secondary': '#6B7280', // Gray-500

                    warning: '#F59E0B', // Amber
                    expired: '#EF4444', // Soft Red
                    success: '#10B981',

                    // Legacy support (mapping old names to new palette where possible)
                    cyan: '#10B981',
                    red: '#EF4444',
                    yellow: '#F59E0B',
                    gray: '#6B7280',
                    border: '#E5E7EB',
                }
            },
            boxShadow: {
                'soft': '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
                'card': '0 10px 30px -5px rgba(0, 0, 0, 0.08)',
                'glow': '0 0 15px rgba(255, 107, 0, 0.3)',
            },
            animation: {
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'float': 'float 6s ease-in-out infinite',
            },
            keyframes: {
                float: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-10px)' },
                }
            }
        },
    },
    plugins: [],
}
