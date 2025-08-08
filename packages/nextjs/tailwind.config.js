/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./utils/**/*.{js,ts,jsx,tsx}",
  ],
  plugins: [require("daisyui")],
  darkTheme: "dark",
  darkMode: ["selector", "[data-theme='dark']"],
  // DaisyUI theme colors
  daisyui: {
    themes: [
      {
        light: {
          primary: "#93BBFB",
          "primary-content": "#212638",
          secondary: "#DAE8FF",
          "secondary-content": "#212638", 
          accent: "#93BBFB",
          "accent-content": "#212638",
          neutral: "#212638",
          "neutral-content": "#ffffff",
          "base-100": "#ffffff",
          "base-200": "#f4f8ff",
          "base-300": "#DAE8FF",
          "base-content": "#212638",
          info: "#93BBFB",
          success: "#34EEB6",
          warning: "#FFCF72",
          error: "#FF8863",

          "--rounded-btn": "9999rem",

          ".tooltip": {
            "--tooltip-tail": "6px",
          },
          ".link": {
            textUnderlineOffset: "2px",
          },
          ".link:hover": {
            opacity: "80%",
          },
        },
      },
      {
        dark: {
          primary: "#212638",
          "primary-content": "#F9FBFF",
          secondary: "#323f61",
          "secondary-content": "#F9FBFF",
          accent: "#4969A6",
          "accent-content": "#F9FBFF",
          neutral: "#F9FBFF",
          "neutral-content": "#385183",
          "base-100": "#385183",
          "base-200": "#2A3655",
          "base-300": "#212638",
          "base-content": "#F9FBFF",
          info: "#385183",
          success: "#34EEB6",
          warning: "#FFCF72",
          error: "#FF8863",

          "--rounded-btn": "9999rem",

          ".tooltip": {
            "--tooltip-tail": "6px",
            "--tooltip-color": "oklch(var(--p))",
          },
          ".link": {
            textUnderlineOffset: "2px",
          },
          ".link:hover": {
            opacity: "80%",
          },
        },
      },
    ],
  },
  theme: {
    extend: {
      fontFamily: {
        "space-grotesk": ["Space Grotesk", "sans-serif"],
      },
      boxShadow: {
        center: "0 0 12px -2px rgb(0 0 0 / 0.05)",
      },
      animation: {
        "pulse-fast": "pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      colors: {
        // Custom Scaffold-ETH colors
        "scaffold-eth-primary": "#93BBFB",
        "scaffold-eth-secondary": "#DAE8FF", 
        "scaffold-eth-accent": "#4969A6",
        "scaffold-eth-neutral": "#212638",
        // Chimera-DevMatch branding colors
        "chimera-primary": "#8B5CF6", // Purple
        "chimera-secondary": "#06B6D4", // Cyan
        "chimera-accent": "#F59E0B", // Amber
        "chimera-success": "#10B981", // Emerald
        "chimera-error": "#EF4444", // Red
        "chimera-warning": "#F59E0B", // Amber
        // TEE & Security themed colors
        "tee-primary": "#1E293B", // Dark blue-gray
        "tee-secondary": "#475569", // Blue-gray
        "sapphire-primary": "#3B82F6", // Blue
        "sapphire-secondary": "#1D4ED8", // Dark blue
      },
      backgroundImage: {
        'gradient-chimera': 'linear-gradient(135deg, #8B5CF6 0%, #06B6D4 50%, #F59E0B 100%)',
        'gradient-sapphire': 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
        'gradient-tee': 'linear-gradient(135deg, #1E293B 0%, #475569 100%)',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
    },
  },
};