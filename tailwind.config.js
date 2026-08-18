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
      fontFamily: {
        sans: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'sans-serif',
        ],
      },
      colors: {
        // Surface/foreground tokens backed by CSS vars (see globals.css).
        // Declared as rgb(... / <alpha-value>) so opacity modifiers such as
        // `bg-surface-2/60` and `text-muted/60` actually generate rules.
        app: 'rgb(var(--app-bg-rgb) / <alpha-value>)',
        surface: {
          DEFAULT: 'rgb(var(--surface-rgb) / <alpha-value>)',
          2: 'rgb(var(--surface-2-rgb) / <alpha-value>)',
        },
        fg: 'rgb(var(--fg-rgb) / <alpha-value>)',
        muted: 'rgb(var(--fg-muted-rgb) / <alpha-value>)',
        default: 'rgb(var(--border-rgb) / <alpha-value>)',
        // Teal brand scale (matches the #0C8B7C -> #32B49F gradient).
        brand: {
          50: '#e8f7f4',
          100: '#c7ece5',
          200: '#95dccd',
          300: '#5cc8b4',
          400: '#32b49f',
          500: '#15a18b',
          600: '#0c8b7c',
          700: '#0b7064',
          800: '#0c5a51',
          900: '#0c4a43',
        },
        // Muted accents used by the decorative dashboard cards.
        accent: {
          gold: '#bfa23a',
          coral: '#c2706a',
          purple: '#7e6cc0',
          blue: '#6f86c9',
        },
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1.125rem',
      },
      boxShadow: {
        soft: '0 1px 2px rgba(16, 24, 40, 0.04), 0 4px 16px rgba(16, 24, 40, 0.01)',
        card: '0 1px 3px rgba(16, 24, 40, 0.05), 0 12px 32px -12px rgba(16, 24, 40, 0.12)',
        pop: '0 12px 40px -8px rgba(16, 24, 40, 0.22)',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.96)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        pop: {
          '0%': { transform: 'scale(0)', opacity: '0' },
          '60%': { transform: 'scale(1.12)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'slide-in-right': {
          from: { transform: 'translateX(100%)' },
          to: { transform: 'translateX(0)' },
        },
        // Used by Decorations.tsx.
        float: {
          '0%, 100%': { transform: 'translateY(0) translateX(0)' },
          '33%': { transform: 'translateY(-20px) translateX(10px)' },
          '66%': { transform: 'translateY(-10px) translateX(-10px)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.25s ease-out',
        'slide-up': 'slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'scale-in': 'scale-in 0.18s ease-out',
        pop: 'pop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'slide-in-right': 'slide-in-right 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        float: 'float 8s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
