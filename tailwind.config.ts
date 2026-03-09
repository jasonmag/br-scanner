import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#101422",
        mist: "#edf2f4",
        accent: "#f97316",
        sea: "#0f766e",
        signal: "#ef4444"
      },
      boxShadow: {
        scanner: "0 24px 80px rgba(16, 20, 34, 0.24)"
      }
    }
  },
  plugins: []
};

export default config;
