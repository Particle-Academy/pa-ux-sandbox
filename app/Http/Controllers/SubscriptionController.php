<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use LaravelCatalog\Facades\Catalog;
use LaravelCatalog\Models\Price;

/**
 * SubscriptionController
 * Created to handle subscription management for testing the Laravel Catalog package with Stripe integration.
 * Uses the Catalog facade to demonstrate proper usage without direct service dependencies.
 */
class SubscriptionController extends Controller
{

    /**
     * Display the user's active subscriptions.
     */
    public function index(): \Illuminate\Contracts\View\View
    {
        $user = Auth::user();
        $subscriptions = $user->subscriptions()->active()->get();

        return view('subscriptions.index', [
            'subscriptions' => $subscriptions,
        ]);
    }

    /**
     * Create a checkout session for a subscription.
     */
    public function create(Request $request, Price $price): \Illuminate\Http\RedirectResponse
    {
        $user = Auth::user();

        if (! $price->isRecurring()) {
            return redirect()->back()->with('error', 'Selected price is not a recurring subscription.');
        }

        if (! $price->stripePriceId()) {
            return redirect()->back()->with('error', 'Price has not been synced to Stripe yet.');
        }

        $checkout = Catalog::subscriptionCheckout(
            owner: $user,
            price: $price,
            successUrl: route('subscriptions.success'),
            cancelUrl: route('subscriptions.cancel'),
        );

        return redirect($checkout->asStripeCheckoutSession()->url);
    }

    /**
     * Handle successful subscription checkout.
     */
    public function success(): \Illuminate\Contracts\View\View
    {
        return view('subscriptions.success');
    }

    /**
     * Handle cancelled subscription checkout.
     */
    public function cancel(): \Illuminate\Http\RedirectResponse
    {
        return redirect()->route('products.index')
            ->with('message', 'Subscription checkout was cancelled.');
    }
}
