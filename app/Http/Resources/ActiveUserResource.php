<?php

namespace App\Http\Resources;

use App\Models\ActiveUser;
use App\Support\PlayerIdentity;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * The single payload shape for a live presence row — identical on the REST
 * seed (`GET /active-users`) and on every `active-user.updated` broadcast, so
 * the frontend reads one schema regardless of transport.
 *
 * @mixin ActiveUser
 */
class ActiveUserResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'name' => $this->name,
            'avatar_url' => $this->avatar_url,
            'identity' => PlayerIdentity::fromParts($this->name, $this->avatar_url, $this->cosmetic_slots),
            'activity_type' => $this->activity_type,
            'activity_label' => $this->activity_label,
            // Who performed it. The row stays keyed on the user — an agent acts
            // on their behalf — so without this the UI shows the human doing
            // things they did not do, and gamification cannot tell the two apart.
            'actor_kind' => $this->actor_kind ?? 'human',
            'actor_name' => $this->actor_name,
            'activity_at' => $this->activity_at?->toIso8601String(),
            'is_xp' => (bool) $this->is_xp,
            'is_achievement' => (bool) $this->is_achievement,
            'last_active_at' => $this->last_active_at?->toIso8601String(),
            'is_fake' => (bool) $this->is_fake,
        ];
    }
}
