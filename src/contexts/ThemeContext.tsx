import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
    isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [theme, setTheme] = useState<Theme>(() => {
        try {
            const saved = localStorage.getItem('theme');
            const savedTimestamp = localStorage.getItem('theme_timestamp');

            if (saved && savedTimestamp) {
                const now = new Date().getTime();
                const setupTime = parseInt(savedTimestamp, 10);
                const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;

                if (now - setupTime < thirtyDaysInMs) {
                    return (saved as Theme);
                }
            }
        } catch (error) {
            console.error('Error reading theme from localStorage:', error);
        }

        // Default to dark mode if no saved theme
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
            // Even if system is light, we default to dark per user request, unless we want to respect system strictly.
            // Request: "make the darkmode the default" -> Implies override system light mode or just default state.
            // To be safe and compliant with "default", I will return 'dark' here always if no saved preference.
            return 'dark';
        }
        return 'dark';
    });

    const isDark = theme === 'dark';

    useEffect(() => {
        try {
            localStorage.setItem('theme', theme);
            localStorage.setItem('theme_timestamp', new Date().getTime().toString());

            if (theme === 'dark') {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        } catch (error) {
            console.error('Error saving theme to localStorage:', error);
        }
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, isDark }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within ThemeProvider');
    }
    return context;
};
