import type { Config } from 'tailwindcss'

export default {
    darkMode: 'class',
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: '#FF5C00',
                    hover: '#E65100',
                    light: '#FFF3E0',
                },
                secondary: {
                    DEFAULT: '#22A699',
                    hover: '#1B8E82',
                    light: '#E0F2F1',
                },
            },
            borderRadius: {
                '3xl': '0px',
                '2xl': '0px',
                'xl': '0px',
                'lg': '0px',
                'md': '0px',
            },
            animation: {
                'float': 'float 3s ease-in-out infinite',
                'in': 'animate-in 0.5s ease-out',
                'fade': 'fade-in 0.5s ease-out',
            },
            keyframes: {
                float: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-5px)' },
                },
                'fade-in': {
                    from: { opacity: '0' },
                    to: { opacity: '1' },
                },
                'animate-in': {
                    from: {
                        opacity: '0',
                        transform: 'translateY(10px)'
                    },
                    to: {
                        opacity: '1',
                        transform: 'translateY(0)'
                    },
                },
            },
        },
    },
    plugins: [],
} satisfies Config
