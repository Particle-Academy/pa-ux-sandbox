<?php

namespace App\Http\Controllers;

use App\Models\EasterEggEnding;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use LaravelFunLab\Facades\LFL;
use LaravelFunLab\Models\Achievement;

/**
 * Awards the hidden Easter-egg achievements behind the FlowRunnerUx "deep
 * system" story. Reaching the single winning ending unlocks **The Adventurer**;
 * discovering every ending unlocks **Ultimate Adventurer**. Both are hidden
 * (secret) achievements — they never appear in the catalog until earned.
 */
class EasterEggController extends Controller
{
    private const EGG = 'deep-system';

    /** Every ending of the deep-system story; "win" is the one true path. */
    private const ENDINGS = ['win', 'deleted', 'corrupted', 'looped', 'fork-bomb'];

    public function ending(Request $request): JsonResponse
    {
        $user = $request->user();
        abort_unless($user, 401);

        $ending = $request->validate([
            'ending' => ['required', 'string', Rule::in(self::ENDINGS)],
        ])['ending'];

        EasterEggEnding::firstOrCreate([
            'user_id' => $user->id,
            'egg' => self::EGG,
            'ending' => $ending,
        ]);

        $newlySlugs = [];

        // The Adventurer — found the single winning path.
        if ($ending === 'win' && ! $user->hasAchievement('the-adventurer')) {
            LFL::grant('the-adventurer')->to($user)->because('deep-system: the one true path')->save();
            $newlySlugs[] = 'the-adventurer';
        }

        // Ultimate Adventurer — discovered EVERY ending.
        $reached = EasterEggEnding::query()
            ->where('user_id', $user->id)
            ->where('egg', self::EGG)
            ->pluck('ending')
            ->all();

        $foundAll = count(array_intersect(self::ENDINGS, $reached)) === count(self::ENDINGS);
        if ($foundAll && ! $user->hasAchievement('ultimate-adventurer')) {
            LFL::grant('ultimate-adventurer')->to($user)->because('deep-system: every ending')->save();
            $newlySlugs[] = 'ultimate-adventurer';
        }

        $newly = collect($newlySlugs)
            ->map(fn (string $slug) => Achievement::findBySlug($slug))
            ->filter()
            ->map(fn (Achievement $a) => [
                'slug' => $a->slug,
                'name' => $a->name,
                'description' => $a->description,
                'icon' => $a->icon,
            ])
            ->values();

        return response()->json([
            'newlyEarned' => $newly,
            'endingsReached' => count(array_intersect(self::ENDINGS, $reached)),
            'endingsTotal' => count(self::ENDINGS),
        ]);
    }
}
