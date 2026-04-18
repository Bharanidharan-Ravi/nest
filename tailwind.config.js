/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "src/**/*.jsx", // <-- ONLY use this single line!
  ],
  safelist: [
    'bg-orange-500',
    'hover:bg-orange-600'
  ],
  theme: {
    extend: {
      colors: {
        ghBg: "#f6f8fa",
        ghBorder: "#d0d7de",
        ghText: "#24292f",
        ghMuted: "#57606a",
        ghBlue: "#0969da",
        ghHover: "#f3f4f6",
        ghInput: "#ffffff",

        brand: {
          yellow: "#ffb300",
          yhover: "#fff8e1",
          black: "#121212",
          white: "#ffffff",
          gray: {
            light: "#f8f9fa",
            border: "#e5e7eb",
            text: "#6b7280",
            dark: "#374151",
          },
        },
      },
    },
  },
  plugins: [],
};