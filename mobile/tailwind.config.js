/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background:  "#0B0F19",
        surface:     "#111827",
        "surface-2": "#1F2937",
        primary:     "#4F46E5",
        "primary-hover": "#4338CA",
        accent:      "#10B981",
        purple:      "#8B5CF6",
        amber:       "#F59E0B",
        danger:      "#EF4444",
        muted:       "#6B7280",
        "text-base": "#F9FAFB",
        "text-muted": "#9CA3AF",
      },
      fontFamily: {
        sans: ["Inter", "System"],
      },
    },
  },
  plugins: [],
};
