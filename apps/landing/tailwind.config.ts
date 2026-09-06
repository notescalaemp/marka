import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        marka: {
          white: "#FFFFFF",
          off: "#F7F9F8",
          black: "#10131A",
          gray: "#728096",
          line: "#E7EBEA",
          green: {
            DEFAULT: "#309577",
            mid: "#56B898",
            light: "#6AC0A2",
            glow: "#9CD5C0",
            tint: "#EFF7F4",
          },
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "sans-serif",
        ],
      },
      boxShadow: {
        xs: "0 1px 2px rgba(16,19,26,0.04)",
        card: "0 1px 2px rgba(16,19,26,0.04), 0 16px 36px -26px rgba(16,19,26,0.14)",
        "card-hover":
          "0 2px 4px rgba(16,19,26,0.05), 0 24px 48px -26px rgba(48,149,119,0.20)",
        button: "0 1px 2px rgba(16,19,26,0.06), 0 10px 22px -12px rgba(48,149,119,0.38)",
        panel: "0 30px 70px -34px rgba(16,19,26,0.20)",
        ring: "0 0 0 4px rgba(48,149,119,0.10)",
      },
      borderRadius: {
        "4xl": "2rem",
      },
      keyframes: {
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.98)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
        "float-subtle": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-3px)" },
        },
        "caret-blink": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0" },
        },
        "bell-wiggle": {
          "0%, 100%": { transform: "rotate(0deg)" },
          "15%": { transform: "rotate(-10deg)" },
          "30%": { transform: "rotate(8deg)" },
          "45%": { transform: "rotate(-6deg)" },
          "60%": { transform: "rotate(3deg)" },
          "75%": { transform: "rotate(0deg)" },
        },
      },
      animation: {
        "fade-in-up": "fade-in-up 0.7s cubic-bezier(0.16,1,0.3,1) both",
        "scale-in": "scale-in 0.5s cubic-bezier(0.16,1,0.3,1) both",
        float: "float 7s ease-in-out infinite",
        "float-delay": "float 7s ease-in-out 2s infinite",
        "float-subtle": "float-subtle 10s ease-in-out infinite",
        "caret-blink": "caret-blink 1s step-end infinite",
        "bell-wiggle": "bell-wiggle 650ms ease-in-out 1",
      },
    },
  },
  plugins: [],
};

export default config;
