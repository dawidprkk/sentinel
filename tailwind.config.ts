import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          black: "#000000",
          white: "#FDFDFD",
        },
        gray: {
          bg: "rgba(22, 23, 26, 0.92)",
          fg: "rgba(253, 254, 255, 0.65)",
        },
        semantic: {
          "red-bg": "rgba(255, 23, 63, 0.18)",
          "red-fg": "#FF9592",
          "amber-bg": "rgba(250, 130, 0, 0.13)",
          "amber-fg": "#FFCA16",
          "green-bg": "rgba(34, 255, 153, 0.12)",
          "green-fg": "rgba(70, 254, 165, 0.83)",
          "blue-bg": "rgba(0, 119, 255, 0.23)",
          "blue-fg": "#70B8FF",
        },
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        mono: ["CommitMono", "monospace"],
      },
    },
  },
  plugins: [],
} satisfies Config;
