<?php

namespace App\Http\Controllers;

use App\Support\XpAwarder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

/**
 * Thin proxy to Anthropic's Messages API for the shared-whiteboard demo.
 *
 * The browser drives the agent loop because the whiteboard state lives in
 * the browser; this controller just forwards `messages`/`tools`/`system`
 * to Anthropic and returns the assistant turn. The frontend executes any
 * `tool_use` blocks against its in-page MicroMcpServer (which mutates the
 * board), then sends `tool_result` blocks back on the next turn.
 *
 * Keeping the proxy server-side avoids exposing ANTHROPIC_API_KEY to the
 * browser. No persistence — each request is stateless.
 */
class WhiteboardAgentController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $apiKey = (string) config('services.anthropic.key', env('ANTHROPIC_API_KEY'));
        if ($apiKey === '') {
            return response()->json(['error' => 'ANTHROPIC_API_KEY is not configured.'], 500);
        }

        $payload = $request->validate([
            'model' => ['nullable', 'string'],
            'messages' => ['required', 'array'],
            'tools' => ['nullable', 'array'],
            'system' => ['nullable', 'string'],
            'max_tokens' => ['nullable', 'integer', 'min:1', 'max:8192'],
        ]);

        // This endpoint is intentionally public (the whiteboard demo drives the
        // agent from the browser), so it forwards an untrusted caller's request
        // to Anthropic on the operator's key. Pin the model to a small
        // demo-appropriate allow-list so a caller can't select an arbitrary /
        // most-expensive model; anything else falls back to the default. Volume
        // is bounded by the route throttle and the max_tokens cap above.
        $default = 'claude-sonnet-4-5';
        $allowedModels = [$default, 'claude-sonnet-5', 'claude-haiku-4-5'];
        $model = $payload['model'] ?? $default;
        if (! in_array($model, $allowedModels, true)) {
            $model = $default;
        }

        $body = [
            'model' => $model,
            'max_tokens' => $payload['max_tokens'] ?? 4096,
            'messages' => $payload['messages'],
        ];

        if (! empty($payload['tools'])) {
            $body['tools'] = $payload['tools'];
        }
        if (! empty($payload['system'])) {
            $body['system'] = $payload['system'];
        }

        $response = Http::withHeaders([
            'x-api-key' => $apiKey,
            'anthropic-version' => '2023-06-01',
            'content-type' => 'application/json',
        ])->timeout(60)->post('https://api.anthropic.com/v1/messages', $body);

        if (! $response->successful()) {
            return response()->json([
                'error' => 'anthropic_error',
                'status' => $response->status(),
                'body' => $response->json() ?? $response->body(),
            ], 502);
        }

        $json = $response->json();

        // Credit bridge-xp when the agent actually drove the whiteboard
        // bridge: each tool_use block the model returned is one tool the
        // browser will execute against the in-page MicroMcpServer. Throttled
        // per (user, tool) inside XpAwarder; guests/opted-out no-op.
        if ($user = $request->user()) {
            foreach ($json['content'] ?? [] as $block) {
                if (($block['type'] ?? null) === 'tool_use' && is_string($block['name'] ?? null)) {
                    XpAwarder::award(
                        user: $user,
                        metric: 'bridge-xp',
                        amount: 5,
                        reason: "whiteboard agent invoked {$block['name']}",
                        throttleKey: "tool:{$block['name']}",
                        throttleSeconds: 3600,
                    );
                }
            }
        }

        return response()->json($json);
    }
}
