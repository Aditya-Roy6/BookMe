import { heroui } from "@heroui/react";

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#121212',
        surface: '#181818',
        'surface-interactive': '#1f1f1f',
        'surface-elevated': '#252525',
        'surface-border': '#4d4d4d',
        'border-light': '#7c7c7c',
        primary: {
          DEFAULT: '#1ed760',
          hover: '#1fdf64',
          foreground: '#000000',
        },
        secondary: {
          DEFAULT: '#b3b3b3',
          foreground: '#ffffff',
        },
        warning: {
          DEFAULT: '#ffa42b',
          foreground: '#000000',
        },
        danger: {
          DEFAULT: '#f3727f',
          foreground: '#ffffff',
        },
        info: {
          DEFAULT: '#539df5',
          foreground: '#ffffff',
        },
        success: {
          DEFAULT: '#1ed760',
          foreground: '#000000',
        },
        muted: '#7c7c7c',
      },
      fontFamily: {
        display: ['CircularSp', 'SpotifyMixUITitle', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
        sans: ['SpotifyMixUI', 'CircularSp', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Menlo', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'spotify-heavy': 'rgba(0, 0, 0, 0.5) 0px 8px 24px',
        'spotify-card': 'rgba(0, 0, 0, 0.3) 0px 8px 8px',
      },
      borderRadius: {
        'pill': '500px',
        'full-pill': '9999px',
      },
    },
  },
  plugins: [
    heroui({
      defaultTheme: "dark",
      themes: {
        dark: {
          colors: {
            background: "#121212",
            foreground: "#ffffff",
            primary: {
              DEFAULT: "#1ed760",
              foreground: "#000000",
            },
            secondary: {
              DEFAULT: "#b3b3b3",
              foreground: "#ffffff",
            },
            warning: {
              DEFAULT: "#ffa42b",
              foreground: "#000000",
            },
            danger: {
              DEFAULT: "#f3727f",
              foreground: "#ffffff",
            },
            success: {
              DEFAULT: "#1ed760",
              foreground: "#000000",
            },
          },
        },
      },
    }),
  ],
};
