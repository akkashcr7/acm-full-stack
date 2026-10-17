import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "#090A10",
        surface: {
          50: "#161B2E",
          100: "#121626",
          200: "#0D111E",
          DEFAULT: "#121626",
        },
        border: "#1F2847",
        primary: {
          DEFAULT: "#00F0FF",
          glow: "rgba(0, 240, 255, 0.25)",
          dark: "#00B4D8",
        },
        accent: {
          DEFAULT: "#8B5CF6",
          glow: "rgba(139, 92, 246, 0.25)",
        },
        success: "#10B981",
        warning: "#F59E0B",
        danger: "#EF4444",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "glow": "glow 2s ease-in-out infinite alternate",
        "float": "float 4s ease-in-out infinite",
      },
      keyframes: {
        glow: {
          "0%": { boxShadow: "0 0 10px rgba(0, 240, 255, 0.2)" },
          "100%": { boxShadow: "0 0 25px rgba(0, 240, 255, 0.6)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-6px)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
