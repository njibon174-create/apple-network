/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
    "./lib/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Apple Network brand palette — warm promo accents (BD e-commerce), clean base
        brand: {
          DEFAULT: "#FF6A00", // primary orange
          600: "#E85D00",
          700: "#C24E00",
          light: "#FFF3E9",
        },
        accent: {
          yellow: "#FFB800",
          teal: "#0EA5A5", // trust icons
        },
        ink: {
          DEFAULT: "#1A1A1A",
          soft: "#4B4B4B",
          muted: "#7A7A7A",
        },
      },
      fontFamily: {
        // Hind Siliguri renders Bangla cleanly; fall back to system sans
        sans: ["'Hind Siliguri'", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)",
        cardHover: "0 8px 24px rgba(0,0,0,0.12)",
      },
      borderRadius: {
        xl2: "1rem",
      },
    },
  },
  plugins: [],
};
