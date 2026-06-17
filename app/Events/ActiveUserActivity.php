<?php

namespace App\Events;

use App\Http\Resources\ActiveUserResource;
use App\Models\ActiveUser;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Broadcast whenever a presence row is upserted (real user activity, an XP /
 * achievement glow, or a simulated step). The payload is the exact
 * ActiveUserResource shape, so REST seed + Echo carry one schema.
 *
 * `ShouldBroadcastNow` (not queued) so it fires without a running queue worker —
 * the showcase isn't guaranteed to have one, and the frontend also polls the
 * REST endpoint, so this is best-effort instant push on top.
 */
class ActiveUserActivity implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public ActiveUser $activeUser) {}

    public function broadcastOn(): Channel
    {
        return new Channel('active-users');
    }

    public function broadcastAs(): string
    {
        return 'active-user.updated';
    }

    /**
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return (new ActiveUserResource($this->activeUser))->resolve();
    }
}
