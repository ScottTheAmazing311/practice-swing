import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: '#0F1A12',
          card: '#1A2B1E',
          input: '#243328',
        },
        accent: {
          DEFAULT: '#4ADE80',
          warm: '#FACC15',
        },
        danger: '#F87171',
        text: {
          DEFAULT: '#F1F5F0',
          muted: '#8CA394',
        },
        border: '#2E4435',
      },
      fontFamily: {
        display: ['"Chillax"', 'sans-serif'],
        body: ['"Cabinet Grotesk"', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
export default config;
