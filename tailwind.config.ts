import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        rrce: {
          blue: "#1a365d",
          navy: "#0f172a",
          gold: "#d97706",
          red: "#991b1b",
          light: "#f8fafc",
          accent: "#2563eb",
          success: "#16a34a",
          warning: "#ca8a04",
          danger: "#dc2626",
        },
      },
    },
  },
  plugins: [],
};
export default config;
