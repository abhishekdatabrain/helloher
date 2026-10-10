import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        "custom-bg": "url('/assets/bg/bg.jpg')",
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      animation: { wave: "wave 1.5s linear infinite" },
      colors: {
        whiteBg: "var(--white-bg)",
        iconBlack: "var(--black-icon)",
        infobg: "var(--light-white-bg)",
        info: "var(--light-white-color)", // Use the custom CSS variable for info color
        primary: "var(--primary-color)", // Use the custom CSS variable for primary color
        secondary: "var(--secondary-color)", // Use the custom CSS variable for secondary color
        foreground: "var(--foreground)", // Use the custom CSS variable for foreground color
        background: "var(--background)", // Use the custom CSS variable for background color
      },
      fontFamily: {
        sans: ['var(--font-lato)', 'sans-serif'],
      },
      keyframes: {
        wave: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
