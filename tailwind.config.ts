import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border) / <alpha-value>)",
        input: "hsl(var(--input) / <alpha-value>)",
        ring: "hsl(var(--ring) / <alpha-value>)",
        background: "hsl(var(--background) / <alpha-value>)",
        foreground: "hsl(var(--foreground) / <alpha-value>)",
        primary: {
          DEFAULT: "hsl(var(--primary) / <alpha-value>)",
          foreground: "hsl(var(--primary-foreground) / <alpha-value>)",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary) / <alpha-value>)",
          foreground: "hsl(var(--secondary-foreground) / <alpha-value>)",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive) / <alpha-value>)",
          foreground: "hsl(var(--destructive-foreground) / <alpha-value>)",
        },
        muted: {
          DEFAULT: "hsl(var(--muted) / <alpha-value>)",
          foreground: "hsl(var(--muted-foreground) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "hsl(var(--accent) / <alpha-value>)",
          foreground: "hsl(var(--accent-foreground) / <alpha-value>)",
        },
        popover: {
          DEFAULT: "hsl(var(--popover) / <alpha-value>)",
          foreground: "hsl(var(--popover-foreground) / <alpha-value>)",
        },
        card: {
          DEFAULT: "hsl(var(--card) / <alpha-value>)",
          foreground: "hsl(var(--card-foreground) / <alpha-value>)",
        },
        violet: "hsl(var(--violet) / <alpha-value>)",
        indigo: "hsl(var(--indigo) / <alpha-value>)",
        cyan: "hsl(var(--cyan) / <alpha-value>)",
        pink: "hsl(var(--pink) / <alpha-value>)",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 4px)",
        sm: "calc(var(--radius) - 8px)",
        "4xl": "2rem",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        heading: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "monospace"],
      },
      animation: {
        "aurora-1": "aurora-1 18s ease-in-out infinite",
        "aurora-2": "aurora-2 22s ease-in-out infinite",
        "aurora-3": "aurora-3 26s ease-in-out infinite",
        float: "float 6s ease-in-out infinite",
        "float-rotate": "float-rotate 7s ease-in-out infinite",
        "spin-slow": "spin-slow 18s linear infinite",
        "spin-reverse": "spin-reverse 24s linear infinite",
        shimmer: "shimmer 3s linear infinite",
        "glow-pulse": "glow-pulse 4s ease-in-out infinite",
        "gradient-drift": "gradient-drift 8s ease infinite",
        "fade-up": "fade-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "scale-in": "scale-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        marquee: "marquee 30s linear infinite",
      },
      backgroundImage: {
        "gradient-conic":
          "conic-gradient(from var(--conic-angle, 0deg), hsl(var(--violet)), hsl(var(--indigo)), hsl(var(--cyan)), hsl(var(--pink)), hsl(var(--violet)))",
        "mesh":
          "radial-gradient(at 20% 20%, hsla(252 95% 70% / 0.4) 0, transparent 50%), radial-gradient(at 80% 30%, hsla(280 95% 60% / 0.3) 0, transparent 50%), radial-gradient(at 50% 80%, hsla(192 95% 60% / 0.25) 0, transparent 50%)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
