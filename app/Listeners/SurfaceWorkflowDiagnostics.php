<?php

namespace App\Listeners;

use FancyFlow\Laravel\Events\WorkflowLog;
use Illuminate\Support\Facades\Log;

/**
 * Write fancy-flow's run diagnostics to the log. Auto-discovered via the
 * typehint (like RecordXpActivity).
 *
 * ## Why this exists
 *
 * The engine emits `warn` lines for the two shapes of silent failure it was
 * taught to detect: an edge naming a port its completed source can never
 * publish, and a route taken on a path that did not resolve. Both reach
 * {@see WorkflowLog}. Until this listener, **nothing in this application
 * subscribed to it** — so a showcase workflow that ran, reported success and
 * delivered nothing down one path said exactly as much as one that worked.
 *
 * That matters more here than in an ordinary app. The showcase is the kit's
 * end-to-end test, not merely a demo that installs it, so a diagnostic no
 * consumer-shaped app subscribes to is a diagnostic with no coverage: we would
 * not notice it regressing, and we could not claim it reaches consumers on the
 * strength of unit tests that call the emitter directly.
 *
 * It is `WorkflowLog`'s own docblock happening one layer out. That class exists
 * because the engine emitted `log` events all along and the Laravel bridge sent
 * them to `default => null`. The event now exists; nobody had written the
 * subscriber, because adding an event does not create one and no forcing
 * function makes anyone write it. `WorkflowDiagnosticsReachTheHostTest` is that
 * forcing function — it asserts through this listener rather than through the
 * emitter, since the gap between the two IS the defect.
 *
 * Reported as pa-ux-sandbox#1.
 */
class SurfaceWorkflowDiagnostics
{
    public function handle(WorkflowLog $event): void
    {
        // `info` is the run narrating itself and would bury the two lines worth
        // reading. Dropped rather than demoted to debug: a level nothing is
        // configured to write is indistinguishable from this branch, and the
        // pretence that it is recorded is what this listener exists to end.
        if ($event->level !== 'warn' && $event->level !== 'error') {
            return;
        }

        Log::log($event->level === 'error' ? 'error' : 'warning', "fancy-flow: {$event->message}", [
            'run' => $event->runId,
            'node' => $event->nodeId,
            // The structured half, so a reader acts on it instead of parsing the
            // sentence: the undelivered-edge warning carries
            // {edge, source, sourceHandle}, the routing one
            // {node, configKey, path, tookPort}.
            'detail' => $event->detail,
        ]);
    }
}
