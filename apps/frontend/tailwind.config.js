/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // Enable dark mode with class strategy
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'bg-primary': '#0a0e27',
        'bg-secondary': '#131829',
        'bg-tertiary': '#1a1f35',
        'text-primary': '#ffffff',
        'text-secondary': '#8b8fa3',
        'accent-green': '#00d4aa',
        'accent-red': '#ff4976',
        'border-color': '#2a2f45',
      },
    },
  },
  plugins: [],
}

