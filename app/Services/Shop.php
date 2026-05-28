<?php

namespace App\Services;

use App\Exceptions\InsufficientFundsException;
use App\Models\ShopItem;
use App\Models\ShopPurchase;
use App\Models\ShowcaseSubmission;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;
use RuntimeException;

/**
 * Coin shop purchase pipeline:
 *
 *   - debits the wallet for the item's current price (one DB transaction)
 *   - records a ShopPurchase row (paid_amount frozen at purchase time so
 *     later price changes don't rewrite history)
 *   - applies the purchase effect:
 *       cosmetic -> merges metadata.slot+value onto user.cosmetic_slots
 *       service  -> dispatches per metadata.service (e.g. featured-showcase
 *                   flips showcase_submission.featured_until)
 *
 * The whole sequence runs in a DB transaction so an effect failure
 * rolls back the wallet debit too.
 */
class Shop
{
    public function purchase(User $user, ShopItem $item, ?Model $ref = null): ShopPurchase
    {
        if (! $item->active) {
            throw new RuntimeException("Shop item {$item->slug} is not active.");
        }

        return DB::transaction(function () use ($user, $item, $ref) {
            $wallet = $user->getWallet();

            // Debit first — InsufficientFundsException bubbles up and the
            // DB transaction unwinds cleanly.
            $wallet->debit(
                amount: (int) $item->price,
                reason: "Shop purchase: {$item->slug}",
                ref: $item,
            );

            $expiresAt = $this->resolveExpiry($item);

            $purchase = ShopPurchase::create([
                'user_id' => $user->id,
                'shop_item_id' => $item->id,
                'paid_amount' => (int) $item->price,
                'expires_at' => $expiresAt,
                'ref_type' => $ref?->getMorphClass(),
                'ref_id' => $ref?->getKey(),
                'metadata' => $item->metadata,
            ]);

            $this->applyEffect($user, $item, $purchase, $ref);

            return $purchase;
        });
    }

    protected function resolveExpiry(ShopItem $item): ?CarbonImmutable
    {
        if (! $item->isService()) {
            return null;
        }
        $days = (int) ($item->metadata['duration_days'] ?? 0);
        if ($days <= 0) {
            return null;
        }

        return CarbonImmutable::now()->addDays($days);
    }

    protected function applyEffect(User $user, ShopItem $item, ShopPurchase $purchase, ?Model $ref): void
    {
        if ($item->isCosmetic()) {
            $this->applyCosmetic($user, $item);

            return;
        }

        $service = $item->metadata['service'] ?? null;
        match ($service) {
            'featured-showcase' => $this->applyFeaturedShowcase($ref, $purchase),
            null => throw new InvalidArgumentException("Shop item {$item->slug} kind=service is missing metadata.service."),
            default => throw new InvalidArgumentException("Unknown shop service '{$service}' on item {$item->slug}."),
        };
    }

    protected function applyCosmetic(User $user, ShopItem $item): void
    {
        $slot = $item->metadata['slot'] ?? null;
        $value = $item->metadata['value'] ?? null;
        if (! is_string($slot) || ! is_string($value)) {
            throw new InvalidArgumentException("Cosmetic item {$item->slug} requires metadata.slot + metadata.value strings.");
        }

        $slots = $user->cosmetic_slots ?? [];
        $slots[$slot] = $value;
        $user->cosmetic_slots = $slots;
        $user->save();
    }

    protected function applyFeaturedShowcase(?Model $ref, ShopPurchase $purchase): void
    {
        if (! $ref instanceof ShowcaseSubmission) {
            throw new InvalidArgumentException('featured-showcase service requires a ShowcaseSubmission ref.');
        }

        $days = (int) ($purchase->metadata['duration_days'] ?? 0);
        if ($days <= 0) {
            throw new InvalidArgumentException('featured-showcase service requires duration_days metadata.');
        }

        // Stack: extend an active window rather than replacing it.
        $base = $ref->featured_until && $ref->featured_until->isFuture()
            ? CarbonImmutable::instance($ref->featured_until)
            : CarbonImmutable::now();
        $ref->featured_until = $base->addDays($days);
        $ref->save();
    }
}
