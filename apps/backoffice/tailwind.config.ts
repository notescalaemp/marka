import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./features/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        marka: {
          black: "#0B0B0B",
          white: "#FFFFFF",
          off: "#F5F5F2",
          graphite: "#242424",
          gray: "#8A8A8A",
          green: {
            DEFAULT: "#309577",
            dark: "#22705A",
            mid: "#36A080",
            light: "#6AC0A2",
            soft: "#EAF6F1",
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
        card: "0 1px 2px rgba(11,11,11,0.04), 0 12px 28px -16px rgba(11,11,11,0.14)",
        "card-hover":
          "0 4px 10px rgba(11,11,11,0.05), 0 20px 40px -18px rgba(48,149,119,0.28)",
        glass: "0 8px 32px -12px rgba(11,11,11,0.12)",
        pop: "0 24px 64px -20px rgba(11,11,11,0.35)",
        glow: "0 0 0 4px rgba(48,149,119,0.12)",
      },
      backgroundImage: {
        "marka-gradient": "linear-gradient(135deg, #309577 0%, #36A080 55%, #6AC0A2 100%)",
        "marka-mesh":
          "radial-gradient(60rem 30rem at 100% -10%, rgba(106,192,162,0.16), transparent), radial-gradient(40rem 24rem at -10% 10%, rgba(48,149,119,0.10), transparent)",
      },
      keyframes: {
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.96)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "slide-in-right": {
          "0%": { opacity: "0", transform: "translateX(16px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-400px 0" },
          "100%": { backgroundPosition: "400px 0" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.45" },
        },
      },
      animation: {
        "fade-in-up": "fade-in-up 0.45s cubic-bezier(0.16,1,0.3,1) both",
        "scale-in": "scale-in 0.2s cubic-bezier(0.16,1,0.3,1) both",
        "slide-in-right": "slide-in-right 0.3s cubic-bezier(0.16,1,0.3,1) both",
        shimmer: "shimmer 1.6s ease-in-out infinite",
        "pulse-soft": "pulse-soft 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
