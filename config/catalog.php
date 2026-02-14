<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Enable UI
    |--------------------------------------------------------------------------
    |
    | When enabled, the package will load Livewire components, views, and routes
    | for the admin interface. Set to false to use only the facade/API.
    | UI will also be enabled automatically if views are published.
    |
    */

    'enable_ui' => env('CATALOG_ENABLE_UI', false),

    /*
    |--------------------------------------------------------------------------
    | Auto Sync to Stripe
    |--------------------------------------------------------------------------
    |
    | When enabled, products and prices will automatically sync to Stripe
    | when created or updated. Set to false to manually control syncing.
    |
    */

    'auto_sync_stripe' => env('CATALOG_AUTO_SYNC_STRIPE', false),

    /*
    |--------------------------------------------------------------------------
    | Queue Connection
    |--------------------------------------------------------------------------
    |
    | The queue connection to use for syncing products to Stripe.
    |
    */

    'queue_connection' => env('CATALOG_QUEUE_CONNECTION', 'default'),

    /*
    |--------------------------------------------------------------------------
    | Admin Route Prefix
    |--------------------------------------------------------------------------
    |
    | The prefix for admin routes. Defaults to 'ctrl'.
    |
    */

    'admin_route_prefix' => env('CATALOG_ADMIN_PREFIX', 'ctrl'),

    /*
    |--------------------------------------------------------------------------
    | Admin Route Middleware
    |--------------------------------------------------------------------------
    |
    | Middleware to apply to admin routes.
    |
    */

    'admin_middleware' => ['web', 'auth', 'superadmin'],

    /*
    |--------------------------------------------------------------------------
    | Admin Route Names
    |--------------------------------------------------------------------------
    |
    | Route names for admin pages. These can be customized if your application
    | uses different route names.
    |
    */

    'admin_route_names' => [
        'products_index' => 'ctrl.products.index', // Use published UI route when views are published
    ],

    /*
    |--------------------------------------------------------------------------
    | Broadcasting Channel
    |--------------------------------------------------------------------------
    |
    | The broadcasting channel name for product sync events.
    |
    */

    'broadcast_channel' => 'admin.products',
];

