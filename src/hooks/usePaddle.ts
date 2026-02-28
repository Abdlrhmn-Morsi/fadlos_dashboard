/// <reference types="vite/client" />
import { useEffect, useRef, useCallback } from 'react';

declare global {
    interface Window {
        Paddle: any;
    }
}

// Always use the main CDN - sandbox is set via Paddle.Environment.set()
const PADDLE_SCRIPT_URL = 'https://cdn.paddle.com/paddle/v2/paddle.js';

function loadPaddleScript(): Promise<void> {
    return new Promise((resolve, reject) => {
        if (window.Paddle) {
            resolve();
            return;
        }

        const existing = document.querySelector(`script[src="${PADDLE_SCRIPT_URL}"]`);
        if (existing) {
            existing.addEventListener('load', () => resolve());
            existing.addEventListener('error', () => reject(new Error('Paddle script failed to load')));
            return;
        }

        const script = document.createElement('script');
        script.src = PADDLE_SCRIPT_URL;
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Paddle script failed to load'));
        document.head.appendChild(script);
    });
}

export const usePaddle = () => {
    const paddleRef = useRef<any>(null);

    useEffect(() => {
        const token = import.meta.env.VITE_PADDLE_CLIENT_TOKEN;
        if (!token || token === 'test_token') {
            console.warn('Paddle: No valid client token set.');
            return;
        }

        loadPaddleScript()
            .then(() => {
                if (window.Paddle && !paddleRef.current) {
                    // Set sandbox mode for test tokens before initializing
                    if (token.startsWith('test_')) {
                        window.Paddle.Environment.set('sandbox');
                    }
                    window.Paddle.Initialize({ token });
                    paddleRef.current = window.Paddle;
                    console.log('Paddle initialized successfully');
                }
            })
            .catch((err) => {
                console.error('Failed to load Paddle script:', err);
            });
    }, []);

    const openCheckout = useCallback((transactionId: string) => {
        if (!paddleRef.current) {
            console.error('Paddle not initialized');
            return;
        }

        paddleRef.current.Checkout.open({
            settings: {
                displayMode: 'overlay',
                theme: 'light',
                locale: 'en',
            },
            transactionId,
        });
    }, []);

    return { paddle: paddleRef.current, openCheckout };
};
