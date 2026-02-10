export enum Permissions {
    // Store Management
    STORE_VIEW = 'store.view',
    STORE_UPDATE = 'store.update',

    // User Management
    USERS_VIEW = 'users.view',
    USERS_CREATE = 'users.create',
    USERS_UPDATE = 'users.update',
    USERS_DELETE = 'users.delete',

    // Employee Management
    EMPLOYEES_VIEW = 'employees.view',
    EMPLOYEES_CREATE = 'employees.create',
    EMPLOYEES_UPDATE = 'employees.update',
    EMPLOYEES_DELETE = 'employees.delete',

    // Product Management
    // PRODUCTS_VIEW = 'products.view', // Now default for all employees
    PRODUCTS_CREATE = 'products.create',
    PRODUCTS_UPDATE = 'products.update',
    PRODUCTS_DELETE = 'products.delete',

    // Category Management
    // CATEGORIES_VIEW = 'categories.view', // Now default for all employees
    CATEGORIES_CREATE = 'categories.create',
    CATEGORIES_UPDATE = 'categories.update',
    CATEGORIES_DELETE = 'categories.delete',

    // Order Management
    ORDERS_VIEW = 'orders.view',
    ORDERS_UPDATE = 'orders.update',
    ORDERS_CANCEL = 'orders.cancel',

    // Analytics
    ANALYTICS_VIEW = 'analytics.view',
    ANALYTICS_EXPORT = 'analytics.export',

    // Settings
    SETTINGS_VIEW = 'settings.view',
    SETTINGS_UPDATE = 'settings.update',
    ROLES_MANAGE = 'roles.manage',

    // Promo Codes
    PROMO_CODES_VIEW = 'promo_codes.view',
    PROMO_CODES_CREATE = 'promo_codes.create',
    PROMO_CODES_UPDATE = 'promo_codes.update',
    PROMO_CODES_DELETE = 'promo_codes.delete',

    // Variants
    VARIANTS_VIEW = 'variants.view',
    VARIANTS_CREATE = 'variants.create',
    VARIANTS_UPDATE = 'variants.update',
    VARIANTS_DELETE = 'variants.delete',

    // Addon Management
    ADDONS_VIEW = 'addons.view',
    ADDONS_CREATE = 'addons.create',
    ADDONS_UPDATE = 'addons.update',
    ADDONS_DELETE = 'addons.delete',

    // Delivery Drivers
    DELIVERY_DRIVERS_VIEW = 'delivery_drivers.view',
    DELIVERY_DRIVERS_CREATE = 'delivery_drivers.create',
    DELIVERY_DRIVERS_UPDATE = 'delivery_drivers.update',
    DELIVERY_DRIVERS_DELETE = 'delivery_drivers.delete',
}
