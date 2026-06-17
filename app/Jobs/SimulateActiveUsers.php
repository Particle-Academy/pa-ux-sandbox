<?php

namespace App\Jobs;

use App\Events\ActiveUserActivity;
use App\Models\ActiveUser;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

/**
 * Drives the "active users" demo with a staggered stream of fake presence.
 *
 * The first invocation (step 0) seeds N deterministic fakes, then each step
 * touches one fake's latest activity, broadcasts it, and re-dispatches itself
 * for the next step with a 2s delay — producing a live trickle of updates
 * rather than one batch. ~30% of steps light an XP or achievement glow.
 */
class SimulateActiveUsers implements ShouldQueue
{
    use Queueable;

    /** @var list<string> */
    private const NAMES = [
        'Ada Lovelace', 'Grace Hopper', 'Alan Turing', 'Katherine Johnson',
        'Linus Torvalds', 'Margaret Hamilton', 'Dennis Ritchie', 'Radia Perlman',
        'Tim Berners-Lee', 'Barbara Liskov', 'Ken Thompson', 'Hedy Lamarr',
    ];

    /** @var list<string> */
    private const ACTIVITIES = [
        'page::browsing the showcase',
        'package::viewing the react-fancy package',
        'component::exploring fancy-whiteboard/Board',
        'package::viewing the fancy-flow package',
        'page::reading the docs',
        'component::exploring fancy-sheets/Workbook',
    ];

    public function __construct(
        public int $step = 0,
        public int $total = 10,
    ) {}

    public function handle(): void
    {
        $total = max(1, $this->total);

        if ($this->step === 0) {
            $this->seedFakes($total);
        }

        if ($this->step >= $total) {
            return;
        }

        $this->touchFake($this->step % $total, $this->step);

        self::dispatch($this->step + 1, $total)->delay(now()->addSeconds(2));
    }

    /**
     * Upsert the full roster of deterministic fakes up front.
     */
    private function seedFakes(int $total): void
    {
        $now = now();

        for ($i = 1; $i <= $total; $i++) {
            $name = self::NAMES[($i - 1) % count(self::NAMES)];

            ActiveUser::updateOrCreate(
                ['fake_key' => "fake-{$i}"],
                [
                    'user_id' => null,
                    'name' => $name,
                    'avatar_url' => "https://api.dicebear.com/7.x/avataaars/svg?seed=fake-{$i}",
                    'activity_type' => 'page',
                    'activity_label' => 'just arrived',
                    'activity_at' => $now,
                    'is_xp' => false,
                    'is_achievement' => false,
                    'last_active_at' => $now,
                    'is_fake' => true,
                ],
            );
        }
    }

    /**
     * Touch one fake's latest activity + broadcast it.
     */
    private function touchFake(int $index, int $step): void
    {
        $fakeKey = 'fake-'.($index + 1);

        [$type, $label] = explode('::', self::ACTIVITIES[$step % count(self::ACTIVITIES)], 2);

        // ~30% of steps light a glow — alternate XP vs achievement.
        $glow = ($step % 3) === 0;
        $isXp = $glow && ($step % 2) === 0;
        $isAchievement = $glow && ($step % 2) === 1;

        if ($isXp) {
            $label = 'earned 12 XP — '.$label;
        } elseif ($isAchievement) {
            $label = 'unlocked an achievement';
        }

        $now = now();

        $activeUser = ActiveUser::updateOrCreate(
            ['fake_key' => $fakeKey],
            [
                'activity_type' => $isXp ? 'xp' : ($isAchievement ? 'achievement' : $type),
                'activity_label' => $label,
                'activity_at' => $now,
                'is_xp' => $isXp,
                'is_achievement' => $isAchievement,
                'last_active_at' => $now,
                'is_fake' => true,
            ],
        );

        ActiveUserActivity::dispatch($activeUser);
    }
}
