/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        rrce: {
          dark: "#091428",
          card: "#0f2347",
          gold: "#f59e0b",
        },
      },
    },
  },
  plugins: [],
};

