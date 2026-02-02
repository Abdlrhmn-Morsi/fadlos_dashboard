# Data Caching Implementation Guide

## Overview

This application implements a global data caching system to improve performance and user experience. The caching system:

- **Loads data once** and reuses it when navigating between pages
- **Automatically invalidates cache** when data is created, updated, or deleted
- **Refreshes on browser refresh** to get the latest data
- **Reduces API calls** and improves page load times

## Architecture

### Components

1. **CacheContext** (`src/contexts/CacheContext.tsx`)
   - Global context for managing cached data
   - Provides methods to get, set, invalidate, and check cache

2. **useCache Hook** (`src/contexts/CacheContext.tsx`)
   - React hook to access cache functionality
   - Used in components that need caching

3. **useDataCache Hook** (`src/hooks/useDataCache.ts`)
   - Higher-level hook for simplified data fetching with caching
   - Handles loading states and errors automatically

## Usage

### Method 1: Using `useCache` Hook (Manual Control)

This method gives you full control over when to fetch, cache, and invalidate data.

```typescript
import { useCache } from '../../contexts/CacheContext';

const MyComponent = () => {
  const { getCache, setCache, invalidateCache } = useCache();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Check cache first
      const cachedData = getCache('my-data-key');
      if (cachedData) {
        setData(cachedData);
        setLoading(false);
        return;
      }

      // Fetch from API if not cached
      const response = await api.getData();
      setData(response.data);
      
      // Cache the data
      setCache('my-data-key', response.data);
    } catch (error) {
      console.error('Failed to fetch data', error);
    } finally {
      setLoading(false);
    }
  };

  // Invalidate cache after create/update/delete
  const handleDelete = async (id) => {
    await api.delete(id);
    invalidateCache('my-data-key'); // Clear cache
    fetchData(); // Fetch fresh data
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (/* Your JSX */);
};
```

### Method 2: Using `useDataCache` Hook (Simplified)

This method is simpler and handles loading/error states automatically.

```typescript
import { useDataCache } from '../../hooks/useDataCache';

const MyComponent = () => {
  const { data, loading, error, refetch } = useDataCache({
    key: 'my-data-key',
    fetchFn: () => api.getData(),
    params: { page: 1, limit: 10 } // Optional params
  });

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {data?.map(item => (
        <div key={item.id}>{item.name}</div>
      ))}
      <button onClick={refetch}>Refresh</button>
    </div>
  );
};
```

## Cache Keys

Use consistent cache keys across your application:

- `products` - Product list data
- `categories` - Category list data
- `orders` - Order list data
- `users` - User list data
- etc.

### Parameterized Cache Keys

When your data depends on parameters (like pagination, filters), the cache automatically creates unique keys:

```typescript
// These will create different cache entries
getCache('products', { page: 1, limit: 10 });
getCache('products', { page: 2, limit: 10 });
getCache('products', { page: 1, limit: 20 });
```

## Cache Invalidation

### When to Invalidate

Invalidate cache whenever data changes:

```typescript
// After creating a new item
const handleCreate = async (data) => {
  await api.create(data);
  invalidateCache('products'); // Invalidates all product caches
  navigate('/products');
};

// After updating an item
const handleUpdate = async (id, data) => {
  await api.update(id, data);
  invalidateCache('products');
  navigate('/products');
};

// After deleting an item
const handleDelete = async (id) => {
  await api.delete(id);
  invalidateCache('products');
  fetchProducts(); // Fetch fresh data
};
```

### Invalidating Multiple Caches

```typescript
// Invalidate multiple cache keys at once
invalidateCache(['products', 'categories']);
```

### Pattern Matching

Invalidating a key removes all related cache entries:

```typescript
// This invalidates:
// - 'products'
// - 'products:{"page":1,"limit":10}'
// - 'products:{"page":2,"limit":10}'
// - etc.
invalidateCache('products');
```

## Best Practices

### 1. Cache on Initial Load

```typescript
useEffect(() => {
  fetchData();
}, []);
```

### 2. Invalidate After Mutations

Always invalidate cache after create, update, or delete operations:

```typescript
const handleSave = async () => {
  await api.save(data);
  invalidateCache('my-data'); // Important!
  navigate('/list');
};
```

### 3. Use Consistent Keys

Define cache keys as constants to avoid typos:

```typescript
// constants/cacheKeys.ts
export const CACHE_KEYS = {
  PRODUCTS: 'products',
  CATEGORIES: 'categories',
  ORDERS: 'orders',
};

// In component
invalidateCache(CACHE_KEYS.PRODUCTS);
```

### 4. Handle Loading States

Always show loading indicators while fetching:

```typescript
if (loading) {
  return <LoadingSpinner />;
}
```

### 5. Clear Cache on Logout

```typescript
const handleLogout = () => {
  clearAllCache(); // Clear all cached data
  // ... logout logic
};
```

## Examples

### Example 1: Product List with Caching

See `src/features/products/ProductList.tsx` for a complete example.

### Example 2: Category List with Caching

See `src/features/categories/CategoryList.tsx` for a complete example.

### Example 3: Form with Cache Invalidation

See `src/features/products/ProductForm.tsx` for a complete example.

## API Reference

### CacheContext Methods

#### `getCache<T>(key: string, params?: Record<string, any>): T | null`

Retrieves cached data for the given key and params.

#### `setCache<T>(key: string, data: T, params?: Record<string, any>): void`

Stores data in the cache with the given key and params.

#### `invalidateCache(key: string | string[]): void`

Removes cache entries matching the key(s).

#### `clearAllCache(): void`

Clears all cached data.

#### `hasCache(key: string, params?: Record<string, any>): boolean`

Checks if cache exists for the given key and params.

## Troubleshooting

### Cache Not Working

1. Ensure `CacheProvider` is wrapped around your app in `App.tsx`
2. Check that you're using the same cache key for get/set operations
3. Verify that cache is being invalidated after mutations

### Stale Data

If you see stale data:
1. Make sure you're invalidating cache after mutations
2. Check that the cache key matches exactly
3. Try clearing all cache: `clearAllCache()`

### Performance Issues

If caching causes performance issues:
1. Reduce the amount of data being cached
2. Implement cache expiration (future enhancement)
3. Use pagination to limit data size

## Future Enhancements

Potential improvements to the caching system:

1. **Cache Expiration**: Automatically expire cache after a certain time
2. **Cache Size Limits**: Limit the total size of cached data
3. **Persistent Cache**: Store cache in localStorage for persistence across sessions
4. **Cache Metrics**: Track cache hit/miss rates for optimization
5. **Selective Invalidation**: Invalidate specific cache entries instead of all matching keys
