<?php

namespace App\Http\Controllers;

use App\Services\Entitlements;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use LaravelCatalog\Facades\Catalog;
use LaravelCatalog\Models\Price;
use LaravelCatalog\Models\Product;

/**
 * The public "Go Pro" surface.
 *
 * Renders the plans through the showcase's own `catalog-fms` block — the same
 * vendorable components anyone can `npx fancy-cli add`. Pro state comes from
 * {@see Entitlements}, which is the single authority: a subscription, an earned
 * `sandbox-pro` prize, and an admin override all mean Pro, and the page has to
 * say WHICH — or someone who earned it gets told to buy what they already have.
 *
 * Deliberately public. The pricing is the pitch; bouncing a curious visitor to a
 * login form to read it is how you lose them. Only checkout needs auth.
 */
class SubscriptionController extends Controller
{
    /** What Pro unlocks, in the order it's worth reading. */
    private const PRO_FEATURES = [
        [
            'key' => 'analytics-suite',
            'name' => 'Pro Analytics Suite',
            'description' => 'GA-parity behavioural analytics off the Fancy Pixel — acquisition, audience, behavior, attention — plus the human-vs-agent split GA structurally cannot see.',
            'icon' => 'activity',
        ],
        [
            'key' => 'pro-source-export',
            'name' => 'Full source export',
            'description' => "Download a component's complete source bundle instead of vendoring it a file at a time.",
            'icon' => 'download',
        ],
        [
            'key' => 'pro-bridge-tools',
            'name' => 'Advanced agent bridge tools',
            'description' => 'The wider MCP tool surface on the Human+ bridges — the operations that mutate, not just the ones that read.',
            'icon' => 'bot',
        ],
        [
            'key' => 'pro-themes',
            'name' => 'Pro showcase themes',
            'description' => 'The extra themes for your showcase profile and your submissions.',
            'icon' => 'palette',
        ],
    ];

    public function index(Entitlements $entitlements): Response
    {
        $user = Auth::user();

        return Inertia::render('Pro/Index', [
            'plans' => $this->plans(),
            'features' => self::PRO_FEATURES,
            'pro' => [
                'isPro' => $entitlements->isPro($user),
                // 'subscription' | 'manual' | 'prize' | null. "You already have
                // this" reads very differently from "you're billed for this".
                'source' => $entitlements->proSource($user),
            ],
            'subscriptions' => $user === null ? [] : $user->subscriptions()->active()->get()
                ->map(fn ($s) => [
                    'id' => $s->id,
                    'name' => $s->name,
                    'status' => $s->stripe_status,
                    'endsAt' => $s->ends_at?->toFormattedDateString(),
                ])->values()->all(),
        ]);
    }

    /**
     * The plans on offer, normalized into the `catalog-fms` block's `Plan` shape.
     *
     * Keyed off the same `storefront.plan.show` metadata flag the admin plan
     * editor writes, so what an admin marks for the storefront is exactly what
     * appears here — no second list to keep in sync.
     *
     * @return list<array<string,mixed>>
     */
    private function plans(): array
    {
        return Product::query()
            ->where('active', true)
            ->whereJsonContains('metadata->storefront->plan->show', true)
            ->whereHas('prices', fn ($q) => $q->where('type', Price::TYPE_RECURRING))
            ->with(['prices' => fn ($q) => $q->where('type', Price::TYPE_RECURRING)])
            ->orderBy('order')
            ->orderBy('name')
            ->get()
            ->map(function (Product $plan): array {
                $storefront = $plan->metadata['storefront']['plan'] ?? [];

                return [
                    'id' => (string) $plan->id,
                    'name' => $plan->name,
                    'description' => $plan->description,
                    'recommended' => (bool) ($storefront['recommended'] ?? false),
                    'badge' => ($storefront['recommended'] ?? false) ? 'Most popular' : null,
                    'highlights' => array_values((array) ($storefront['highlights'] ?? [])),
                    'prices' => $plan->prices->map(fn (Price $price): array => [
                        'id' => (string) $price->id,
                        'amount' => (int) $price->unit_amount,
                        'currency' => $price->currency,
                        'interval' => $price->recurring_interval,
                        'intervalCount' => (int) ($price->recurring_interval_count ?: 1),
                    ])->values()->all(),
                ];
            })
            ->values()
            ->all();
    }

    /**
     * Start Stripe checkout for a price. Auth-gated in routes/web.php — this is
     * the one step that genuinely needs a signed-in owner.
     */
    public function create(Request $request, Price $price): RedirectResponse
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

    /** Back from a completed checkout. */
    public function success(): RedirectResponse
    {
        return redirect()->route('subscriptions.index')
            ->with('success', "You're Pro — everything below is unlocked.");
    }

    /** Back from an abandoned checkout. No drama, just the page again. */
    public function cancel(): RedirectResponse
    {
        return redirect()->route('subscriptions.index')
            ->with('success', 'Checkout cancelled — nothing was charged.');
    }
}
