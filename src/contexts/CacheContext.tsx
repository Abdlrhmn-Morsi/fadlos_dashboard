import React, { createContext, useContext, useState, useCallback, ReactNode, useRef, useMemo } from 'react';

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
    updateCacheItem: <T = any>(key: string, itemId: string, updater: (item: T) => T, idField?: string) => void;
}

const CacheContext = createContext<CacheContextType | undefined>(undefined);

interface CacheProviderProps {
    children: ReactNode;
}

export const CacheProvider: React.FC<CacheProviderProps> = ({ children }) => {
    const cacheRef = useRef<Map<string, CacheEntry>>(new Map());
    // We still use a small state just to trigger re-renders if needed, 
    // but the functions will depend on the Ref.
    const [, setTick] = useState(0);
    const forceUpdate = useCallback(() => setTick(tick => tick + 1), []);

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
        const entry = cacheRef.current.get(cacheKey);

        if (!entry) {
            return null;
        }

        return entry.data as T;
    }, [generateCacheKey]);

    // Set cache data
    const setCache = useCallback(<T = any>(key: string, data: T, params?: Record<string, any>): void => {
        const cacheKey = generateCacheKey(key, params);
        cacheRef.current.set(cacheKey, {
            data,
            timestamp: Date.now(),
            params
        });
        // We don't always need to force update for cache writes, 
        // but some components might expect it. 
        // For stability, we skip forceUpdate here unless specifically needed.
    }, [generateCacheKey]);

    // Invalidate cache by key(s)
    const invalidateCache = useCallback((key: string | string[]): void => {
        const keys = Array.isArray(key) ? key : [key];

        // Remove all cache entries that match the key pattern
        keys.forEach(k => {
            Array.from(cacheRef.current.keys()).forEach((cacheKey: string) => {
                if (cacheKey === k || cacheKey.startsWith(`${k}:`)) {
                    cacheRef.current.delete(cacheKey);
                }
            });
        });
        forceUpdate();
    }, [forceUpdate]);

    // Clear all cache
    const clearAllCache = useCallback((): void => {
        cacheRef.current.clear();
        forceUpdate();
    }, [forceUpdate]);

    // Check if cache exists
    const hasCache = useCallback((key: string, params?: Record<string, any>): boolean => {
        const cacheKey = generateCacheKey(key, params);
        return cacheRef.current.has(cacheKey);
    }, [generateCacheKey]);

    // Update a specific item in cached arrays
    const updateCacheItem = useCallback(<T = any>(
        key: string,
        itemId: string,
        updater: (item: T) => T,
        idField: string = 'id'
    ): void => {
        let updatedGlobal = false;
        Array.from(cacheRef.current.keys()).forEach((cacheKey: string) => {
            if (cacheKey === key || cacheKey.startsWith(`${key}:`)) {
                const entry = cacheRef.current.get(cacheKey);
                if (!entry) return;

                let updated = false;
                let newData = { ...entry.data };

                if (newData.data && Array.isArray(newData.data)) {
                    const itemIndex = newData.data.findIndex((item: any) => item[idField] === itemId);
                    if (itemIndex !== -1) {
                        newData.data = [...newData.data];
                        newData.data[itemIndex] = updater(newData.data[itemIndex]);
                        updated = true;
                    }
                }
                else if (Array.isArray(newData)) {
                    const itemIndex = newData.findIndex((item: any) => item[idField] === itemId);
                    if (itemIndex !== -1) {
                        newData = [...newData];
                        newData[itemIndex] = updater(newData[itemIndex]);
                        updated = true;
                    }
                }

                if (updated) {
                    cacheRef.current.set(cacheKey, {
                        ...entry,
                        data: newData,
                        timestamp: Date.now()
                    });
                    updatedGlobal = true;
                }
            }
        });
        if (updatedGlobal) forceUpdate();
    }, [forceUpdate]);

    const value = useMemo(() => ({
        getCache,
        setCache,
        invalidateCache,
        clearAllCache,
        hasCache,
        updateCacheItem
    }), [getCache, setCache, invalidateCache, clearAllCache, hasCache, updateCacheItem]);

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
