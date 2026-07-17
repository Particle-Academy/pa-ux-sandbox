<?php

namespace App\Mcp\Tools\Concerns;

use App\Models\AgentKey;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;

/**
 * Shared agent-key resolution for the showcase MCP tools. The key is minted by
 * a signed-in user on their showcase page and handed to their agent — every
 * tool call is therefore attributed to a real account and revocable.
 */
trait ResolvesAgentKey
{
    private function resolveAgentKey(Request $request): AgentKey|Response
    {
        $key = AgentKey::resolve((string) $request->get('agent_key', ''));

        if ($key === null || $key->user === null) {
            return Response::error(
                'Invalid or revoked agent key. Ask the user to mint one at '
                .url('/showcase/mine').' (Agent access) and pass it as `agent_key`.',
            );
        }

        return $key;
    }
}
