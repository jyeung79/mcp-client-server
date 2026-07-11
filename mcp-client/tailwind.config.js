/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#007AFF",
        background: "#ffffff",
        backgroundElement: "#F0F0F3",
        backgroundSelected: "#E0E1E6",
        textPrimary: "#000000",
        textSecondary: "#60646C",
        destructive: "#D92D20",
      },
      borderRadius: {
        xl2: "24px",
      },
      maxWidth: {
        content: "800px",
      },
    },
  },
  plugins: [],
};
