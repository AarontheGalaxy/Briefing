import type { Config } from "tailwindcss";
import { fontFamily } from "tailwindcss/defaultTheme";

const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}", "./index.html"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Geist", ...fontFamily.sans],
        mono: ["Geist Mono", ...fontFamily.mono],
      },
    },
  },
  plugins: [],
};

export default config;
