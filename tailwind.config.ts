import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      screens: {
        xs: "475px",
      },
      fontFamily: {
        heading: ["Cinzel", "serif"],
        body: ["Inter", "sans-serif"],
        serif: ["Crimson Text", "serif"],
        magical: ["Cinzel Decorative", "Cinzel", "serif"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))" },
        secondary: { DEFAULT: "hsl(var(--secondary))", foreground: "hsl(var(--secondary-foreground))" },
        destructive: { DEFAULT: "hsl(var(--destructive))", foreground: "hsl(var(--destructive-foreground))" },
        muted: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
        accent: { DEFAULT: "hsl(var(--accent))", foreground: "hsl(var(--accent-foreground))" },
        popover: { DEFAULT: "hsl(var(--popover))", foreground: "hsl(var(--popover-foreground))" },
        card: { DEFAULT: "hsl(var(--card))", foreground: "hsl(var(--card-foreground))" },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        gryffindor: { DEFAULT: "hsl(var(--gryffindor))", gold: "hsl(var(--gryffindor-gold))" },
        slytherin: { DEFAULT: "hsl(var(--slytherin))", silver: "hsl(var(--slytherin-silver))" },
        ravenclaw: { DEFAULT: "hsl(var(--ravenclaw))", bronze: "hsl(var(--ravenclaw-bronze))" },
        hufflepuff: { DEFAULT: "hsl(var(--hufflepuff))", black: "hsl(var(--hufflepuff-black))" },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      spacing: {
        // Sistema de espaçamento Hogwarts — escala 4px (mobile-first, consistente)
        "space-3xs": "var(--space-3xs)", // 2px
        "space-2xs": "var(--space-2xs)", // 4px
        "space-xs":  "var(--space-xs)",  // 8px
        "space-sm":  "var(--space-sm)",  // 12px
        "space-md":  "var(--space-md)",  // 16px
        "space-lg":  "var(--space-lg)",  // 24px
        "space-xl":  "var(--space-xl)",  // 32px
        "space-2xl": "var(--space-2xl)", // 48px
        "space-3xl": "var(--space-3xl)", // 64px
        // Alvos de toque (WCAG / Apple HIG)
        "touch":     "var(--touch-min)",     // 44px
        "touch-lg":  "var(--touch-lg)",      // 48px
        // Alturas de botão padronizadas
        "btn-sm":    "var(--btn-h-sm)",      // 36px
        "btn-md":    "var(--btn-h-md)",      // 44px (default)
        "btn-lg":    "var(--btn-h-lg)",      // 56px
      },
      minHeight: {
        touch:     "var(--touch-min)",
        "touch-lg": "var(--touch-lg)",
        "btn-sm":  "var(--btn-h-sm)",
        "btn-md":  "var(--btn-h-md)",
        "btn-lg":  "var(--btn-h-lg)",
      },
      minWidth: {
        touch:     "var(--touch-min)",
        "touch-lg": "var(--touch-lg)",
      },
      gap: {
        "space-2xs": "var(--space-2xs)",
        "space-xs":  "var(--space-xs)",
        "space-sm":  "var(--space-sm)",
        "space-md":  "var(--space-md)",
        "space-lg":  "var(--space-lg)",
        "space-xl":  "var(--space-xl)",
      },
      keyframes: {
        "accordion-down": { from: { height: "0" }, to: { height: "var(--radix-accordion-content-height)" } },
        "accordion-up": { from: { height: "var(--radix-accordion-content-height)" }, to: { height: "0" } },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/container-queries")],
} satisfies Config;
