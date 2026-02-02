import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface CacheEntry<T = any> {
    data: T;
    timestamp: number;
    params?: Record<string, any>;
}

interface CacheContextType {
    getCache: <T = any>(key: string, params?: Record<string, any>) => T | null;
    setCache: <T = any>(key: string, data: T, params?: Record<string, any>) => void;
    invalidateCache: (key: string | string[]) => void;
    clearAllCache: () => void;
    hasCache: (key: string, params?: Record<string, any>) => boolean;
}

const CacheContext = createContext<CacheContextType | undefined>(undefined);

interface CacheProviderProps {
    children: ReactNode;
}

export const CacheProvider: React.FC<CacheProviderProps> = ({ children }) => {
    const [cache, setCacheState] = useState<Map<string, CacheEntry>>(new Map());

    // Generate a unique cache key based on the key and params
    const generateCacheKey = useCallback((key: string, params?: Record<string, any>): string => {
        if (!params || Object.keys(params).length === 0) {
            return key;
        }
        const sortedParams = Object.keys(params)
            .sort()
            .reduce((acc, k) => {
                acc[k] = params[k];
                return acc;
            }, {} as Record<string, any>);
        return `${key}:${JSON.stringify(sortedParams)}`;
    }, []);

    // Get cached data
    const getCache = useCallback(<T = any>(key: string, params?: Record<string, any>): T | null => {
        const cacheKey = generateCacheKey(key, params);
        const entry = cache.get(cacheKey);

        if (!entry) {
            return null;
        }

        return entry.data as T;
    }, [cache, generateCacheKey]);

    // Set cache data
    const setCache = useCallback(<T = any>(key: string, data: T, params?: Record<string, any>): void => {
        const cacheKey = generateCacheKey(key, params);
        setCacheState(prevCache => {
            const newCache = new Map(prevCache);
            newCache.set(cacheKey, {
                data,
                timestamp: Date.now(),
                params
            });
            return newCache;
        });
    }, [generateCacheKey]);

    // Invalidate cache by key(s)
    const invalidateCache = useCallback((key: string | string[]): void => {
        const keys = Array.isArray(key) ? key : [key];

        setCacheState(prevCache => {
            const newCache = new Map(prevCache);

            // Remove all cache entries that match the key pattern
            keys.forEach(k => {
                // Remove exact matches and pattern matches (e.g., "products" removes "products:*")
                Array.from(newCache.keys()).forEach(cacheKey => {
                    if (cacheKey === k || cacheKey.startsWith(`${k}:`)) {
                        newCache.delete(cacheKey);
                    }
                });
            });

            return newCache;
        });
    }, []);

    // Clear all cache
    const clearAllCache = useCallback((): void => {
        setCacheState(new Map());
    }, []);

    // Check if cache exists
    const hasCache = useCallback((key: string, params?: Record<string, any>): boolean => {
        const cacheKey = generateCacheKey(key, params);
        return cache.has(cacheKey);
    }, [cache, generateCacheKey]);

    const value: CacheContextType = {
        getCache,
        setCache,
        invalidateCache,
        clearAllCache,
        hasCache
    };

    return (
        <CacheContext.Provider value={value}>
            {children}
        </CacheContext.Provider>
    );
};

export const useCache = (): CacheContextType => {
    const context = useContext(CacheContext);
    if (!context) {
        throw new Error('useCache must be used within a CacheProvider');
    }
    return context;
};
