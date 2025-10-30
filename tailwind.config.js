/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        neon: {
          red: "#ff0033",
          pink: "#ff3355",
          dark: "#0a0a0a",
        },
      },
      fontFamily: {
        display: ["Rajdhani", "System"],
        body: ["Inter", "System"],
      },
      dropShadow: {
        neon: "0 0 12px rgba(255,0,51,0.75)",
      },
    },
  },
  plugins: [],
};
