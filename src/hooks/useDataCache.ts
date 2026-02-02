import { useState, useEffect, useCallback } from 'react';
import { useCache } from '../contexts/CacheContext';

interface UseDataCacheOptions<T> {
    key: string;
    fetchFn: () => Promise<T>;
    params?: Record<string, any>;
    enabled?: boolean;
}

interface UseDataCacheResult<T> {
    data: T | null;
    loading: boolean;
    error: Error | null;
    refetch: () => Promise<void>;
}

/**
 * Custom hook for data caching with automatic cache management
 * 
 * @example
 * const { data, loading, error, refetch } = useDataCache({
 *   key: 'products',
 *   fetchFn: () => productsApi.getSellerProducts(params),
 *   params: { page, limit, sortBy }
 * });
 */
export function useDataCache<T = any>({
    key,
    fetchFn,
    params,
    enabled = true
}: UseDataCacheOptions<T>): UseDataCacheResult<T> {
    const { getCache, setCache } = useCache();
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchData = useCallback(async () => {
        if (!enabled) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            // Check cache first
            const cachedData = getCache<T>(key, params);
            if (cachedData) {
                setData(cachedData);
                setLoading(false);
                return;
            }

            // Fetch from API if not cached
            const result = await fetchFn();
            setData(result);

            // Cache the data
            setCache(key, result, params);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('An error occurred'));
            setData(null);
        } finally {
            setLoading(false);
        }
    }, [key, fetchFn, params, enabled, getCache, setCache]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return {
        data,
        loading,
        error,
        refetch: fetchData
    };
}
