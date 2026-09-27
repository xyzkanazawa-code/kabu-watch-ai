import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0B0F19",
        foreground: "#F9FAFB",
        card: {
          DEFAULT: "#111827",
          foreground: "#F9FAFB",
          hover: "#1F2937",
          border: "#1F2937"
        },
        brand: {
          emerald: "#10B981",
          cyan: "#06B6D4",
          violet: "#8B5CF6",
          rose: "#F43F5E",
          amber: "#F59E0B"
        }
      },
      keyframes: {
        glowPulse: {
          "0%, 100%": {
            boxShadow: "0 0 15px rgba(16, 185, 129, 0.6), inset 0 0 10px rgba(16, 185, 129, 0.2)",
            borderColor: "rgba(16, 185, 129, 0.8)"
          },
          "50%": {
            boxShadow: "0 0 25px rgba(6, 182, 212, 0.8), inset 0 0 15px rgba(6, 182, 212, 0.3)",
            borderColor: "rgba(6, 182, 212, 0.9)"
          }
        },
        badgePulse: {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.7", transform: "scale(1.05)" }
        }
      },
      animation: {
        glow: "glowPulse 2.5s infinite ease-in-out",
        badge: "badgePulse 2s infinite ease-in-out"
      }
    },
  },
  plugins: [],
};

export default config;
