import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        institutional: {
          900: "#091428",
          800: "#0f2347",
          700: "#1a365d",
          600: "#2b4c7e",
          500: "#3b6998",
          100: "#e8eff7",
          50: "#f4f7fb",
        },
        rrce: {
          gold: "#f59e0b",
          maroon: "#881337",
          navy: "#0f172a",
        },
      },
    },
  },
  plugins: [],
};

export default config;

