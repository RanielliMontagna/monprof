import type { Config } from "tailwindcss";

export default {
  content: ["./apps/ui/index.html", "./apps/ui/src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        catppuccin: {
          base: "#1e1e2e",
          mantle: "#181825",
          crust: "#11111b",
          surface0: "#313244",
          surface1: "#45475a",
          surface2: "#585b70",
          text: "#cdd6f4",
          subtext: "#bac2de",
          overlay: "#6c7086",
          blue: "#89b4fa",
          lavender: "#b4befe",
          sapphire: "#74c7ec",
          sky: "#89dceb",
          teal: "#94e2d5",
          green: "#a6e3a1",
          yellow: "#f9e2af",
          peach: "#fab387",
          maroon: "#eba0ac",
          red: "#f38ba8",
          mauve: "#cba6f7",
          pink: "#f5c2e7",
          flamingo: "#f2cdcd",
          rosewater: "#f5e0dc",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
