<?php

namespace App\Http\Controllers;

use App\Ai\Agents\HolySheetAgent;
use Generator;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Laravel\Ai\Streaming\Events\Error as StreamError;
use Laravel\Ai\Streaming\Events\ReasoningDelta;
use Laravel\Ai\Streaming\Events\ReasoningStart;
use Laravel\Ai\Streaming\Events\StreamEnd;
use Laravel\Ai\Streaming\Events\StreamStart;
use Laravel\Ai\Streaming\Events\TextDelta;
use Laravel\Ai\Streaming\Events\ToolCall;
use Laravel\Ai\Streaming\Events\ToolResult;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Streams Holy Sheet agent events to the browser as Server-Sent Events.
 *
 * The Livewire `$this->stream()` path was unreliable on Herd's HTTP/2 (mid-
 * stream `headers already sent` crashes turned into ERR_HTTP2_PROTOCOL_ERROR
 * in the browser). This dedicated route uses Laravel's native streamed
 * generator response, which the framework handles correctly: output buffers
 * are flushed between yields and `X-Accel-Buffering: no` is set automatically.
 *
 * Frontend consumes via fetch() + ReadableStream, parses each `data: …\n\n`
 * frame, and appends rendered HTML to the live feed.
 */
class AiSheetStreamController extends Controller
{
    public function __invoke(Request $request): StreamedResponse
    {
        $prompt = trim((string) $request->input('prompt'));

        return response()->stream(
            function () use ($prompt): Generator {
                @set_time_limit(0);
                @ini_set('max_execution_time', '0');

                if ($prompt === '') {
                    yield $this->frame(['type' => 'error', 'message' => 'Empty prompt']);

                    return;
                }

                $start = microtime(true);
                $events = 0;

                try {
                    yield $this->frame(['type' => 'open']);

                    $response = (new HolySheetAgent)->stream($prompt);
                    foreach ($response as $event) {
                        $events++;
                        $payload = $this->encodeEvent($event);
                        if ($payload !== null) {
                            yield $this->frame($payload);
                        }
                    }

                    $artifact = $this->latestArtifact();
                    yield $this->frame([
                        'type' => 'complete',
                        'summary' => $response->text ?? '',
                        'artifact' => $artifact,
                        'ms' => (int) ((microtime(true) - $start) * 1000),
                        'events' => $events,
                    ]);
                } catch (\Throwable $e) {
                    Log::error('ai-sheets stream failed', [
                        'prompt' => $prompt,
                        'error' => $e->getMessage(),
                        'trace' => $e->getTraceAsString(),
                    ]);
                    yield $this->frame([
                        'type' => 'error',
                        'message' => $e->getMessage(),
                    ]);
                }
            },
            200,
            [
                'Content-Type' => 'text/event-stream',
                'Cache-Control' => 'no-cache',
                'X-Accel-Buffering' => 'no',
                'Connection' => 'keep-alive',
            ],
        );
    }

    private function frame(array $payload): string
    {
        return 'data: '.json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE)."\n\n";
    }

    /**
     * @return array<string,mixed>|null
     */
    private function encodeEvent(object $event): ?array
    {
        return match (true) {
            $event instanceof StreamStart => ['type' => 'stream_start'],
            $event instanceof StreamEnd => ['type' => 'stream_end'],
            $event instanceof ReasoningStart => ['type' => 'reasoning_start'],
            $event instanceof ReasoningDelta => ['type' => 'reasoning_delta', 'delta' => $event->delta],
            $event instanceof TextDelta => ['type' => 'text_delta', 'delta' => $event->delta],
            $event instanceof ToolCall => [
                'type' => 'tool_call',
                'name' => $event->toolCall->name,
                'arguments' => $event->toolCall->arguments,
            ],
            $event instanceof ToolResult => [
                'type' => 'tool_result',
                'name' => $event->toolResult->name ?? null,
                'result' => is_string($event->toolResult->result)
                    ? $event->toolResult->result
                    : json_encode($event->toolResult->result, JSON_UNESCAPED_SLASHES),
                'successful' => $event->successful,
                'error' => $event->error,
            ],
            $event instanceof StreamError => [
                'type' => 'error',
                'message' => $event->message,
            ],
            default => null,
        };
    }

    /**
     * @return array{url:string, filename:string, bytes:int}|null
     */
    private function latestArtifact(): ?array
    {
        $dir = Storage::disk('public')->path('ai-sheets');
        if (! is_dir($dir)) {
            return null;
        }
        $files = glob($dir.'/*.xlsx') ?: [];
        if ($files === []) {
            return null;
        }
        usort($files, fn ($a, $b) => filemtime($b) <=> filemtime($a));
        $latest = $files[0];
        $name = basename($latest);

        return [
            'url' => Storage::disk('public')->url('ai-sheets/'.$name),
            'filename' => $name,
            'bytes' => (int) filesize($latest),
        ];
    }
}
