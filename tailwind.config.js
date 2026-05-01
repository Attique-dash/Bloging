/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        inter: ["Inter", "sans-serif"],
        gelasio: ["Gelasio", "serif"],
      },
      colors: {
        white:       "#ffffff",
        black:       "#242424",
        grey:        "#F3F3F3",
        "light-grey": "#E8E8E8",
        "dark-grey": "#6B6B6B",
        red:         "#FF4E4E",
        twitter:     "#1DA1F2",
        purple:      "#8B46FF",
        // aliases used in existing code
        gre:  "#F3F3F3",
        lg:   "#E8E8E8",
        // Dark mode
        "d-bg":     "#0f0f13",
        "d-card":   "#1a1a24",
        "d-border": "#2a2a38",
        "d-grey":   "#9a9ab0",
      },
    },
  },
  plugins: [],
};