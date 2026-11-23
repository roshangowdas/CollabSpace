/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        brand: {
          DEFAULT: 'hsl(var(--brand))',
          foreground: 'hsl(var(--brand-foreground))',
        },
        success: {
          DEFAULT: 'hsl(var(--success))',
          foreground: 'hsl(var(--success-foreground))',
        },
        warning: {
          DEFAULT: 'hsl(var(--warning))',
          foreground: 'hsl(var(--warning-foreground))',
        },
        info: {
          DEFAULT: 'hsl(var(--info))',
          foreground: 'hsl(var(--info-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
        },
        // Hoy Design System dedicated tokens
        hoy: {
          dark: '#191918',       // color-1: Dark background
          primary: '#585855',    // color-2: Text Primary
          secondary: '#73736F',  // color-3: Text Secondary
          muted: '#8E8E93',      // color-4: Background Dark / Muted border
          cream: '#ECECEA',      // color-5: Text Light / warm surface
          white: '#FFFFFF',      // color-6: Pure white border / contrast
        },
      },
      borderRadius: {
        none: '0px',
        sm: '1px',
        DEFAULT: '5px',
        md: '5px',
        lg: '6px',
        xl: '6px',
        '2xl': '6px',
        '3xl': '6px',
        full: '99px',
      },
      fontFamily: {
        sans: ['system-ui', 'ui-rounded', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        serif: ['"Times New Roman"', 'Times', 'serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      fontSize: {
        xs: ['11px', { lineHeight: '14px' }],
        sm: ['13px', { lineHeight: '18px' }],
        base: ['15px', { lineHeight: '22px' }],
        lg: ['16px', { lineHeight: '24px' }],
        xl: ['21px', { lineHeight: '28px' }],
        '2xl': ['23px', { lineHeight: '30px' }],
        '3xl': ['25px', { lineHeight: '32px' }],
        '4xl': ['29px', { lineHeight: '36px' }],
      },
      boxShadow: {
        sm: '0px 0.734px 2.202px 0px rgba(0, 0, 0, 0.22)',
        md: '0px 0.762px 2.286px 0px rgba(0, 0, 0, 0.22)',
        lg: '0px 0.788px 2.364px 0px rgba(0, 0, 0, 0.22)',
        xl: '0px 0.834px 2.502px 0px rgba(0, 0, 0, 0.22)',
        '21': '0px 13px 24px -6px rgba(0, 0, 0, 0.17), 0px 5px 10px -4px rgba(0, 0, 0, 0.16)',
        subtle: '0px 0.734px 2.202px 0px rgba(0, 0, 0, 0.12)',
        elevated: '0px 1.25px 3.75px 0px rgba(0, 0, 0, 0.18)',
        modal: '0px 13px 24px -6px rgba(0, 0, 0, 0.20), 0px 5px 10px -4px rgba(0, 0, 0, 0.16)',
      },
    },
  },
  plugins: [],
}
