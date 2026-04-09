export enum AdminPermissions {
  // Store Management
  STORES_VIEW = 'admin.stores.view',
  STORES_UPDATE_STATUS = 'admin.stores.update_status',
  STORES_DELETE = 'admin.stores.delete',

  // Store Verification
  STORE_VERIFICATION_VIEW = 'admin.store_verification.view',
  STORE_VERIFICATION_MANAGE = 'admin.store_verification.manage',

  // Driver Verification
  DRIVER_VERIFICATION_VIEW = 'admin.driver_verification.view',
  DRIVER_VERIFICATION_MANAGE = 'admin.driver_verification.manage',

  // Reviews
  REPORTED_REVIEWS_VIEW = 'admin.reported_reviews.view',
  REPORTED_REVIEWS_MANAGE = 'admin.reported_reviews.manage',

  // User Management
  USERS_VIEW = 'admin.users.view',
  USERS_MANAGE = 'admin.users.manage',

  // Geography
  CITIES_VIEW = 'admin.cities.view',
  CITIES_MANAGE = 'admin.cities.manage',
  TOWNS_VIEW = 'admin.towns.view',
  TOWNS_MANAGE = 'admin.towns.manage',

  // Business Types & Categories
  BUSINESS_TYPES_VIEW = 'admin.business_types.view',
  BUSINESS_TYPES_MANAGE = 'admin.business_types.manage',
  BUSINESS_CATEGORIES_VIEW = 'admin.business_categories.view',
  BUSINESS_CATEGORIES_MANAGE = 'admin.business_categories.manage',

  // Subscriptions / Plans
  PLANS_VIEW = 'admin.plans.view',
  PLANS_MANAGE = 'admin.plans.manage',
  SUBSCRIPTIONS_VIEW = 'admin.subscriptions.view',
  SUBSCRIPTIONS_MANAGE = 'admin.subscriptions.manage',

  // App Settings
  APP_UPDATES_MANAGE = 'admin.app_updates.manage',

  // Global Content Management
  GLOBAL_PRODUCTS_VIEW = 'admin.products.view',
  GLOBAL_CATEGORIES_VIEW = 'admin.categories.view',
  GLOBAL_ADDONS_VIEW = 'admin.addons.view',

  STORES_PRODUCTS_UPDATE = 'admin.stores.products.update',
  STORES_CATEGORIES_UPDATE = 'admin.stores.categories.update',
  STORES_ADDONS_UPDATE = 'admin.stores.addons.update',

  // Admin Team
  ADMIN_EMPLOYEES_VIEW = 'admin.employees.view',
  ADMIN_EMPLOYEES_MANAGE = 'admin.employees.manage',
  ADMIN_ROLES_MANAGE = 'admin.roles.manage',

  // Dashboard & Analytics
  ANALYTICS_VIEW = 'admin.analytics.view',
}

export interface AdminPermissionGroup {
  category: string;
  permissions: {
    key: string;
    name: string;
    description?: string;
  }[];
}

export const ADMIN_PERMISSION_GROUPS: AdminPermissionGroup[] = [
  {
    category: 'Store Management',
    permissions: [
      {
        key: AdminPermissions.STORES_VIEW,
        name: 'View Stores',
        description: '• List all stores and view their details',
      },
      {
        key: AdminPermissions.STORES_UPDATE_STATUS,
        name: 'Update Store Status',
        description: '• Activate, suspend, or deactivate stores',
      },
      {
        key: AdminPermissions.STORES_DELETE,
        name: 'Delete Stores',
        description: '• Permanently remove stores',
      },
    ],
  },
  {
    category: 'Verification Requests',
    permissions: [
      {
        key: AdminPermissions.STORE_VERIFICATION_VIEW,
        name: 'View Store Verifications',
        description: '• View pending store verification requests',
      },
      {
        key: AdminPermissions.STORE_VERIFICATION_MANAGE,
        name: 'Manage Store Verifications',
        description: '• Approve or reject store verifications',
      },
      {
        key: AdminPermissions.DRIVER_VERIFICATION_VIEW,
        name: 'View Driver Verifications',
        description: '• View pending freelancer driver requests',
      },
      {
        key: AdminPermissions.DRIVER_VERIFICATION_MANAGE,
        name: 'Manage Driver Verifications',
        description: '• Approve or reject driver verifications',
      },
    ],
  },
  {
    category: 'Content Moderation',
    permissions: [
      {
        key: AdminPermissions.REPORTED_REVIEWS_VIEW,
        name: 'View Reported Reviews',
        description: '• See list of reviews reported by store owners',
      },
      {
        key: AdminPermissions.REPORTED_REVIEWS_MANAGE,
        name: 'Manage Reported Reviews',
        description: '• Delete or dismiss reported reviews',
      },
    ],
  },
  {
    category: 'All Content Management',
    permissions: [
      {
        key: AdminPermissions.GLOBAL_PRODUCTS_VIEW,
        name: 'View All Products',
        description: '• Search and view all products in the system',
      },
      {
        key: AdminPermissions.STORES_PRODUCTS_UPDATE,
        name: 'Update Store Products',
        description: '• Edit product details for any store',
      },
      {
        key: AdminPermissions.GLOBAL_CATEGORIES_VIEW,
        name: 'View All Categories',
        description: '• Search and browse all store categories',
      },
      {
        key: AdminPermissions.STORES_CATEGORIES_UPDATE,
        name: 'Update Store Categories',
        description: '• Edit categories for any store',
      },
      {
        key: AdminPermissions.GLOBAL_ADDONS_VIEW,
        name: 'View All Add-ons',
        description: '• Search and browse all store add-ons',
      },
      {
        key: AdminPermissions.STORES_ADDONS_UPDATE,
        name: 'Update Store Add-ons',
        description: '• Edit add-ons for any store',
      },
    ],
  },
  {
    category: 'Geography',
    permissions: [
      {
        key: AdminPermissions.CITIES_VIEW,
        name: 'View Cities',
        description: '• List system cities',
      },
      {
        key: AdminPermissions.CITIES_MANAGE,
        name: 'Manage Cities',
        description: '• Create, edit, and delete cities',
      },
      {
        key: AdminPermissions.TOWNS_VIEW,
        name: 'View Towns',
        description: '• List towns and places',
      },
      {
        key: AdminPermissions.TOWNS_MANAGE,
        name: 'Manage Towns',
        description: '• Create, edit, and delete towns and places',
      },
    ],
  },
  {
    category: 'System Data',
    permissions: [
      {
        key: AdminPermissions.BUSINESS_TYPES_VIEW,
        name: 'View Business Types',
        description: '• List business types',
      },
      {
        key: AdminPermissions.BUSINESS_TYPES_MANAGE,
        name: 'Manage Business Types',
        description: '• Create, edit, and delete business types',
      },
      {
        key: AdminPermissions.BUSINESS_CATEGORIES_VIEW,
        name: 'View Business Categories',
        description: '• List business categories',
      },
      {
        key: AdminPermissions.BUSINESS_CATEGORIES_MANAGE,
        name: 'Manage Business Categories',
        description: '• Create, edit, and delete business categories',
      },
    ],
  },
  {
    category: 'User Management',
    permissions: [
      {
        key: AdminPermissions.USERS_VIEW,
        name: 'View Users',
        description: '• List all system users',
      },
      {
        key: AdminPermissions.USERS_MANAGE,
        name: 'Manage Users',
        description: '• Edit users, change status',
      },
    ],
  },
  {
    category: 'Admin Team',
    permissions: [
      {
        key: AdminPermissions.ADMIN_EMPLOYEES_VIEW,
        name: 'View Admin Employees',
        description: '• View list of system administration staff',
      },
      {
        key: AdminPermissions.ADMIN_EMPLOYEES_MANAGE,
        name: 'Manage Admin Employees',
        description: '• Add, edit, or remove admin staff',
      },
      {
        key: AdminPermissions.ADMIN_ROLES_MANAGE,
        name: 'Manage Admin Roles',
        description: '• Create and configure permission sets for admin staff',
      },
    ],
  },
  {
    category: 'System Configuration',
    permissions: [
      {
        key: AdminPermissions.APP_UPDATES_MANAGE,
        name: 'Manage App Updates',
        description: '• Configure app version requirements',
      },
      {
        key: AdminPermissions.ANALYTICS_VIEW,
        name: 'Analytics & Billing',
        description: '• Access system metrics, revenue analytics, and billing transactions',
      },
    ],
  },
];

export function getAllAdminPermissions(): string[] {
  return Object.values(AdminPermissions);
}
