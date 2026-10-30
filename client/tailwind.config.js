/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // High-Contrast Kinetic Editorial Core Palette
        brandDark: '#0A0A0A',
        brandCream: '#F2EFE9',
        brandLime: '#C5F135',
        brandCharcoal: '#141414',
        brandMuted: '#A3A3A3',
        brandDarkMuted: '#737373',
        brandError: '#EF4444',

        // Stitch Container Tokens
        surface: '#131313',
        'surface-dim': '#131313',
        'surface-bright': '#3a3939',
        'surface-container-lowest': '#0E0E0E',
        'surface-container-low': '#1C1B1B',
        'surface-container': '#201F1F',
        'surface-container-high': '#2A2A2A',
        'surface-container-highest': '#353534',
        'on-surface': '#E5E2E1',
        'on-surface-variant': '#C4C9AE',
        'primary-container': '#C5F135',
        'on-primary-container': '#556B00',
        'outline-variant': '#444934',
        outline: '#8E937B',

        // Backward-compatible aliases
        obsidian: '#0A0A0A',
        charcoal: {
          900: '#121212',
          800: '#181818',
          700: '#201F1F',
          600: '#2A2A2A',
        },
        cream: '#F2EFE9',
        lime: {
          DEFAULT: '#C5F135',
          hover: '#D4F658',
        },
        critical: '#FF5555',
        warning: '#FFAA00',
        info: '#33AAFF',
      },
      fontFamily: {
        display: ['Oswald', 'sans-serif'],
        headline: ['Oswald', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        grotesk: ['Space Grotesk', 'sans-serif'],
      },
      boxShadow: {
        'brutal': '8px 8px 0px 0px #0A0A0A',
        'brutal-sm': '4px 4px 0px 0px #0A0A0A',
        'brutal-lime': '4px 4px 0px 0px #C5F135',
        'brutal-pressed': '2px 2px 0px 0px #0A0A0A',
      },
    },
  },
  plugins: [],
}
