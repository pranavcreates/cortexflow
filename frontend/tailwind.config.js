/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Clean Enterprise Palette (Apple Xcode / Linear style)
        canvas: '#0B0E16',        // Deep OLED-friendly black
        panel: '#141927',         // Main panel backgrounds
        card: '#181C29',          // Inner cards and elevated containers
        inputBg: '#101420',       // Inputs darker than cards
        accentBlue: '#3B82F6',    // Vibrant blue primary action
        accentBlueHover: '#2B6CB7', // Hover state
      },
      fontFamily: {
        sans: [
          'Geist',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'Inter',
          'system-ui',
          'sans-serif',
        ],
        mono: [
          '"Geist Mono"',
          'ui-monospace',
          'SFMono-Regular',
          '"JetBrains Mono"',
          'Menlo',
          'Monaco',
          'Consolas',
          'monospace',
        ],
      },
      borderRadius: {
        '2xl': '1rem', // 16px for main containers
      },
    },
  },
  plugins: [],
}
