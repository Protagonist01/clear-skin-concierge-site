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
        // New green system
        bottle:       "var(--bottle)",
        hunter:       "var(--hunter)",
        forest:       "var(--forest)",
        fern:         "var(--fern)",
        sage:         "var(--sage)",
        "sage-lite":  "var(--sage-lite)",
        pistachio:    "var(--pistachio)",
        chalk:        "var(--chalk)",
        parchment:    "var(--parchment)",
        ecru:         "var(--ecru)",
        ivory:        "var(--ivory)",
        lime:         "var(--lime)",
        "lime-mid":   "var(--lime-mid)",
        "lime-dark":  "var(--lime-dark)",
        ink:          "var(--ink)",
        muted:        "var(--muted)",
        faint:        "var(--faint)",
        line:         "var(--line)",
        // Legacy aliases
        frost:        "var(--chalk)",
        mist:         "var(--parchment)",
        border:       "var(--line)",
        espresso:     "var(--ink)",
        mint:         "var(--lime)",
        gold:         "var(--lime)",
        amber:        "var(--fern)",
        text:         "var(--body-text)",
        mutedMid:     "var(--muted)",
        white:        "var(--ecru)",
        sageLight:    "var(--pistachio)",
        borderHigh:   "var(--line-mid)",
      },
      fontFamily: {
        display: ["var(--font-display)", "Outfit", "sans-serif"],
        body:    ["var(--font-body)", "DM Sans", "sans-serif"],
        mono:    ["var(--font-mono)", "DM Mono", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
