<?php

namespace App\Http\Controllers\Showcase;

use App\Exceptions\InsufficientFundsException;
use App\Http\Controllers\Controller;
use App\Models\ShopItem;
use App\Models\ShowcaseSubmission;
use App\Services\Shop;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ShopController extends Controller
{
    public function index(Request $request): Response
    {
        $items = ShopItem::query()
            ->where('active', true)
            ->orderBy('order')
            ->get()
            ->map(fn (ShopItem $i) => [
                'slug' => $i->slug,
                'name' => $i->name,
                'description' => $i->description,
                'kind' => $i->kind,
                'price' => $i->price,
                'metadata' => $i->metadata,
            ])->all();

        $user = $request->user();
        $userSubmissions = $user
            ? ShowcaseSubmission::where('user_id', $user->id)
                ->where('status', 'verified')
                ->get(['id', 'title', 'url', 'kind', 'featured_until'])
                ->map(fn (ShowcaseSubmission $s) => [
                    'id' => $s->id,
                    'title' => $s->title,
                    'url' => $s->url,
                    'kind' => $s->kind,
                    'featured_until' => $s->featured_until?->toIso8601String(),
                ])->all()
            : [];

        return Inertia::render('Shop/Index', [
            'items' => $items,
            'balance' => $user ? $user->coinBalance() : null,
            'submissions' => $userSubmissions,
            'cosmeticSlots' => $user?->cosmetic_slots ?? (object) [],
        ]);
    }

    public function purchase(Request $request, ShopItem $item, Shop $shop): RedirectResponse
    {
        $data = $request->validate([
            'submission_id' => 'sometimes|nullable|integer|exists:showcase_submissions,id',
        ]);

        $ref = null;
        if ($item->isService() && ($item->metadata['service'] ?? null) === 'featured-showcase') {
            $submission = ShowcaseSubmission::find($data['submission_id'] ?? null);
            // Service requires a submission owned by the buyer and verified.
            abort_if(
                $submission === null
                    || $submission->user_id !== $request->user()->id
                    || $submission->status !== 'verified',
                422,
                'Choose one of your verified showcase submissions.',
            );
            $ref = $submission;
        }

        try {
            $shop->purchase($request->user(), $item, $ref);
        } catch (InsufficientFundsException $e) {
            return back()->with('error', 'Not enough coins for this purchase.');
        }

        return back()->with('success', "Purchased: {$item->name}");
    }
}
