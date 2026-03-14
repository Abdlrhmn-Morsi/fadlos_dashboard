import React, { createContext, useContext, useState, useCallback, ReactNode, useRef, useMemo, useEffect } from 'react';

interface CacheEntry<T = any> {
    data: T;
    timestamp: number;
    params?: Record<string, any>;
    persist?: boolean;
}

interface CacheContextType {
    getCache: <T = any>(key: string, params?: Record<string, any>) => T | null;
    setCache: <T = any>(key: string, data: T, params?: Record<string, any>, persist?: boolean) => void;
    invalidateCache: (key: string | string[]) => void;
    clearAllCache: () => void;
    hasCache: (key: string, params?: Record<string, any>) => boolean;
    updateCacheItem: <T = any>(key: string, itemId: string, updater: (item: T) => T, idField?: string, persist?: boolean) => void;
}

const CacheContext = createContext<CacheContextType | undefined>(undefined);

const PERSIST_KEY = 'fadlos-admin-cache';
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

interface CacheProviderProps {
    children: ReactNode;
}

export const CacheProvider: React.FC<CacheProviderProps> = ({ children }) => {
    const cacheRef = useRef<Map<string, CacheEntry>>(new Map());
    const [, setTick] = useState(0);
    const forceUpdate = useCallback(() => setTick(tick => tick + 1), []);

    // Load persisted cache on mount
    useEffect(() => {
        try {
            const savedCache = localStorage.getItem(PERSIST_KEY);
            if (savedCache) {
                const parsed = JSON.parse(savedCache);
                const now = Date.now();
                
                Object.entries(parsed).forEach(([key, entry]: [string, any]) => {
                    // Only load if not expired
                    if (now - entry.timestamp < CACHE_EXPIRY) {
                        cacheRef.current.set(key, entry);
                    }
                });
                forceUpdate();
            }
        } catch (e) {
            console.error('Failed to load cache from localStorage', e);
        }
    }, [forceUpdate]);

    // Save persisted items to localStorage
    const saveToLocalStorage = useCallback(() => {
        try {
            const persistable: Record<string, CacheEntry> = {};
            cacheRef.current.forEach((value, key) => {
                if (value.persist) {
                    persistable[key] = value;
                }
            });
            localStorage.setItem(PERSIST_KEY, JSON.stringify(persistable));
        } catch (e) {
            console.error('Failed to save cache to localStorage', e);
        }
    }, []);

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
    const setCache = useCallback(<T = any>(key: string, data: T, params?: Record<string, any>, persist: boolean = false): void => {
        const cacheKey = generateCacheKey(key, params);
        cacheRef.current.set(cacheKey, {
            data,
            timestamp: Date.now(),
            params,
            persist
        });
        
        if (persist) saveToLocalStorage();
    }, [generateCacheKey, saveToLocalStorage]);

    // Invalidate cache by key(s)
    const invalidateCache = useCallback((key: string | string[]): void => {
        const keys = Array.isArray(key) ? key : [key];
        let changed = false;

        keys.forEach(k => {
            Array.from(cacheRef.current.keys()).forEach((cacheKey: string) => {
                if (cacheKey === k || cacheKey.startsWith(`${k}:`)) {
                    cacheRef.current.delete(cacheKey);
                    changed = true;
                }
            });
        });
        
        if (changed) {
            saveToLocalStorage();
            forceUpdate();
        }
    }, [forceUpdate, saveToLocalStorage]);

    // Clear all cache
    const clearAllCache = useCallback((): void => {
        cacheRef.current.clear();
        localStorage.removeItem(PERSIST_KEY);
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
        idField: string = 'id',
        persist?: boolean
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
                        timestamp: Date.now(),
                        persist: persist !== undefined ? persist : entry.persist
                    });
                    updatedGlobal = true;
                }
            }
        });
        if (updatedGlobal) {
            saveToLocalStorage();
            forceUpdate();
        }
    }, [forceUpdate, saveToLocalStorage]);

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
