/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        oceanTop: "#38bdf8",
        oceanMid: "#0f4c81",
        oceanDeep: "#020617",
      },
      backgroundImage: {
        "ocean-gradient":
          "radial-gradient(circle at 10% 0%, rgba(56,189,248,0.4) 0, transparent 45%), radial-gradient(circle at 90% 0%, rgba(56,189,248,0.25) 0, transparent 40%), linear-gradient(to bottom, #38bdf8 0%, #0f4c81 35%, #020617 100%)",
      },
    },
  },
  plugins: [],
};
