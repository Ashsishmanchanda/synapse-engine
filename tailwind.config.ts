import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        synapse: {
          bg: "#080b11",
          surface: "#0d131f",
          border: "#1e293b",
          primary: "#f59e0b",
          accent: "#ff6600",
          success: "#10b981",
        }
      }
    },
  },
  plugins: [],
};
export default config;
