/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#17120F",
        panel: "#1E1815",
        wine: "#6E1423",
        wineLight: "#8C2438",
        gold: "#C6A15B",
        cream: "#F3E9D6",
        sage: "#6B7A5E",
        rust: "#B5482A",
        muted: "#A9998A",
      },
      fontFamily: {
        display: ["Fraunces", "serif"],
        sans: ["Inter", "sans-serif"],
        mono: ["'IBM Plex Mono'", "monospace"],
      },
    },
  },
  plugins: [],
};
