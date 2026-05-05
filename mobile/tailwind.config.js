/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "hsl(158, 70%, 60%)",
          foreground: "hsl(230, 25%, 8%)",
          glow: "hsl(158, 80%, 70%)",
        },
        secondary: {
          DEFAULT: "hsl(258, 50%, 65%)",
          foreground: "hsl(230, 25%, 8%)",
          glow: "hsl(268, 70%, 75%)",
        },
        background: "hsl(230, 20%, 7%)",
        foreground: "hsl(160, 15%, 92%)",
        card: {
          DEFAULT: "hsl(228, 18%, 10%)",
          foreground: "hsl(160, 15%, 92%)",
        },
        border: "hsl(228, 15%, 35%)",
        muted: {
          DEFAULT: "hsl(228, 14%, 14%)",
          foreground: "hsl(220, 10%, 60%)",
        },
        accent: {
          DEFAULT: "hsl(268, 60%, 70%)",
          foreground: "hsl(230, 25%, 8%)",
        },
      },
    },
  },
  plugins: [],
};
