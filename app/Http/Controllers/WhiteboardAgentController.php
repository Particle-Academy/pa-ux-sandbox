<?php

namespace App\Http\Controllers;

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

        $body = [
            'model' => $payload['model'] ?? 'claude-sonnet-4-5',
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

        return response()->json($response->json());
    }
}
