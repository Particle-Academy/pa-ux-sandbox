<?php

namespace App\Http\Controllers\Showcase;

use App\Http\Controllers\Controller;
use App\Models\AgentKey;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

/**
 * Mint / revoke agent access keys — the credential a user hands to an AI agent
 * so it can register + verify showcase projects on their behalf (via the
 * showcase MCP tools). The plaintext is flashed ONCE; only its hash persists.
 */
class AgentKeyController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate(['name' => 'required|string|max:120']);

        $minted = AgentKey::mint($request->user(), $validated['name']);

        return redirect()
            ->route('showcase.showcase.mine')
            ->with('agent_key_plaintext', $minted['plaintext'])
            ->with('submitted', "Agent key “{$minted['key']->name}” created — copy it now, it won't be shown again.");
    }

    public function destroy(Request $request, AgentKey $agentKey): RedirectResponse
    {
        abort_unless($agentKey->user_id === $request->user()->id, 403);

        $agentKey->forceFill(['revoked_at' => now()])->save();

        return redirect()
            ->route('showcase.showcase.mine')
            ->with('submitted', "Revoked agent key “{$agentKey->name}”.");
    }
}
