import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#121212',
        surface: '#1c1c1c',
        accent: '#E8A33D',
        muted: '#9a9a9a',
      },
      fontFamily: {
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        body: ['var(--font-body)', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        widish: '0.08em',
      },
    },
  },
  plugins: [],
};

export default config;
