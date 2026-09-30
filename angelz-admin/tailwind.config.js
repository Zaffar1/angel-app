/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      container: {
        center: true,
        padding: '1rem', // Default padding
        screens: {
          sm: '100%', // Full width until small breakpoint
          md: '100%', // Full width until medium breakpoint
          lg: '1024px', // Max width for large screens
          xl: '1280px', // Max width for extra-large screens
        },
      },
      colors:{
        admin_primary: '#0026d198',
        admin_text_grey: '#464646',
        admin_light_grey: '#EDEDED',
        admin_dark: '#222222', 
        admin_light: '#F7F7F7',
        admin_dark_field: '#1C1B1F', 
        admin_red: '#FF0000', 
        admin_Bg: '#f6f9ff',
      },
      fontFamily:{
        'nunito': ["Nunito", 'sans-serif'],
        'roboto': ["Roboto", 'sans-serif'],
      },
      backgroundImage: {
        'hero': "url('/src/assets/Images/banner.png')",
        'appbanner': "url('/src/assets/Images/app-banner.png')",
      },
      screens: {
        'sc-1920': {'min': '1900px'},
        'vxs': {'max': '480px'},
      },
    },
  },
  plugins: [],
}