/** @type {import('tailwindcss').Config} */
const config = {
  reactStrictMode: false, // Set to false to prevent double-rendering in development
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'gtgram-white': '#FFFFFF',
        'gtgram-offwhite': '#F5F5F5',
        'gtgram-gold': '#D4AF37',
        'gtgram-light-gold': '#F2D279',
        'gtgram-green': '#2E8B57',
        'gtgram-light-green': '#3CB371',
        'gtgram-sage': '#E8F5E9', // Light sage green for sidebar background
        'gtgram-gray': '#E0E0E0',
        'gtgram-dark': '#202020',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        slideUp: {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' }
        },
        heartPulse: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.2)' },
          '100%': { transform: 'scale(1)' }
        }
      },
      animation: {
        fadeIn: 'fadeIn 0.3s ease-in-out',
        slideUp: 'slideUp 0.3s ease-out',
        heartPulse: 'heartPulse 0.3s ease-in-out'
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
};

module.exports = config; 