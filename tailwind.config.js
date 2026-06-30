/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // "Clean White" Design-System
        background: "#FFFFFF",
        surface: "#FAFAFA",
        "surface-alt": "#F4F4F5",
        border: "#E5E5E7",
        "border-strong": "#D4D4D8",
        ink: {
          DEFAULT: "#0A0A0A", // primary text
          soft: "#52525B", // secondary text
          muted: "#A1A1AA", // tertiary / placeholder
        },
        accent: {
          DEFAULT: "#171717", // near-black CTA, kept monochrome
          foreground: "#FFFFFF",
        },
        success: "#16A34A",
        danger: "#DC2626",
      },
      fontFamily: {
        sans: ["System"],
        display: ["System"],
      },
      borderRadius: {
        sm: "8px",
        md: "12px",
        lg: "20px",
        xl: "28px",
        full: "999px",
      },
      spacing: {
        "4.5": "18px",
        "18": "72px",
      },
    },
  },
  plugins: [],
};
