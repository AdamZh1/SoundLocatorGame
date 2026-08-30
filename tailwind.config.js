/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      keyframes: {
        'score-rise': {
          '0%': { transform: 'translateY(0)', opacity: '1' },
          '100%': { transform: 'translateY(-150px)', opacity: '0' },
        },
      },
      animation: {
        'score-rise': 'score-rise 1.5s ease-out forwards',
      },
    },
  },
  plugins: [],
}
