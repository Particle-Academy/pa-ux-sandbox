# Stripe Integration Setup

This document explains how to configure Stripe for testing the Laravel Catalog package.

## Prerequisites

1. A Stripe account (sign up at https://stripe.com)
2. Access to your Stripe Dashboard (https://dashboard.stripe.com)

## Configuration Steps

### 1. Get Your Stripe API Keys

1. Log in to your Stripe Dashboard
2. Navigate to **Developers** → **API keys**
3. Copy your **Publishable key** (starts with `pk_test_` for test mode)
4. Copy your **Secret key** (starts with `sk_test_` for test mode)
   - Click "Reveal test key" if needed

### 2. Configure Environment Variables

Add the following to your `.env` file:

```env
STRIPE_KEY=pk_test_your_publishable_key_here
STRIPE_SECRET=sk_test_your_secret_key_here
```

**Important:** 
- Never commit your `.env` file to version control
- Use test keys (`pk_test_` and `sk_test_`) for development
- Use live keys (`pk_live_` and `sk_live_`) only in production

### 3. Laravel Cashier Configuration

Laravel Cashier automatically reads Stripe keys from the `services.stripe` configuration, which maps to:
- `STRIPE_KEY` environment variable → Publishable key
- `STRIPE_SECRET` environment variable → Secret key

The configuration is already set up in `config/services.php`.

### 4. Testing Mode

When using test mode keys:
- All transactions are simulated
- No real charges are made
- Use test card numbers from Stripe's testing documentation:
  - Success: `4242 4242 4242 4242`
  - Decline: `4000 0000 0000 0002`
  - Use any future expiry date and any 3-digit CVC

### 5. Webhook Configuration (Optional for Testing)

For full functionality including subscription updates, configure webhooks:

1. Go to **Developers** → **Webhooks** in Stripe Dashboard
2. Click **Add endpoint**
3. Set endpoint URL to: `https://your-domain.com/stripe/webhook`
4. Select events to listen for:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

### 6. Verify Configuration

After setting up your keys, verify the configuration:

1. Ensure `.env` file has `STRIPE_KEY` and `STRIPE_SECRET`
2. Clear config cache: `php artisan config:clear`
3. Test by creating a product and syncing to Stripe (via admin interface)

## Package-Specific Configuration

The Laravel Catalog package uses Stripe for:
- Product and Price synchronization
- Subscription checkout sessions
- Payment processing

Configuration options are available in `config/catalog.php`:
- `auto_sync_stripe`: Automatically sync products/prices to Stripe (default: false)
- `queue_connection`: Queue connection for async Stripe sync operations

## Troubleshooting

### "No API key provided" Error
- Verify `STRIPE_KEY` and `STRIPE_SECRET` are set in `.env`
- Run `php artisan config:clear` to refresh configuration

### "Invalid API Key" Error
- Check that you're using the correct key type (test vs live)
- Ensure keys are copied completely without extra spaces

### Webhook Signature Verification Failed
- Verify webhook signing secret is set in `.env` as `STRIPE_WEBHOOK_SECRET`
- Ensure webhook endpoint URL matches your application URL

## Additional Resources

- [Stripe Testing Documentation](https://stripe.com/docs/testing)
- [Laravel Cashier Documentation](https://laravel.com/docs/cashier)
- [Stripe Dashboard](https://dashboard.stripe.com)

