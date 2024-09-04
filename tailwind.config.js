/** @type {import('tailwindcss').Config} */
const defaultTheme = require('tailwindcss/defaultTheme')
module.exports = {
  mode: 'jit',
  content: [
    `components/**/*.{vue,js}`,
    `layouts/**/*.vue`,
    `pages/**/*.vue`,
    `composables/**/*.{js,ts}`,
    `plugins/**/*.{js,ts}`,
    `error.{js,ts,vue}`
  ],
  prefix: 'tw-',
  theme: {
    screens: {
      'xxs': '340px',
      'xs': '385px',
      ...defaultTheme.screens,
    },
    extend: {
      colors: {
        // 'primary': '#00237B',
        // 'secondary': '#FFDADA',
      },
      maxWidth: {
        '8xl': '88rem',
        '9xl': '96rem',
        '10xl': '104rem',
      }
    },
  },
  plugins: []
}
