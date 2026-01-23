/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#0f172a", // Slate 900
          foreground: "#ffffff",
        },
        secondary: {
          DEFAULT: "#f1f5f9", // Slate 100
          foreground: "#0f172a",
        },
        accent: {
          DEFAULT: "#3b82f6", // Blue 500
          foreground: "#ffffff",
        },
        destructive: {
          DEFAULT: "#ef4444", // Red 500
          foreground: "#ffffff",
        },
        success: {
          DEFAULT: "#22c55e", // Green 500
          foreground: "#ffffff",
        },
        muted: {
          DEFAULT: "#f8fafc", // Slate 50
          foreground: "#64748b", // Slate 500
        },
        card: {
          DEFAULT: "#ffffff",
          foreground: "#0f172a",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
