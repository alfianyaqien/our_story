/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Bluish romantic theme
        'love-blue': '#6B9FE8',        // Soft blue
        'love-sky': '#87CEEB',         // Sky blue
        'love-ocean': '#4A90E2',       // Ocean blue
        'love-lavender': '#B8C5E6',    // Blue lavender
        'love-ice': '#E6F2FF',         // Ice blue
        'love-navy': '#2C5AA0',        // Deep navy
        // Legacy pink colors (for gradual migration)
        'love-pink': '#6B9FE8',
        'love-red': '#4A90E2',
        'love-purple': '#B8C5E6',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0) translateX(0)' },
          '33%': { transform: 'translateY(-20px) translateX(10px)' },
          '66%': { transform: 'translateY(-10px) translateX(-10px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        float: 'float 8s ease-in-out infinite',
        shimmer: 'shimmer 3s linear infinite',
        fadeIn: 'fadeIn 0.5s ease-out',
      },
    },
  },
  plugins: [],
}
