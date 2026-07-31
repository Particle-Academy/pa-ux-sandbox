<?php

declare(strict_types=1);

namespace FancyFlow\Nodes\LlmScreen;

/**
 * The seam between this node and the screen surface.
 *
 * Two jobs on one host, deliberately: generating the schema and knowing which
 * components exist are the same knowledge. Split across two bindings they
 * drift, and the drift shows up as a rendered placeholder — a run that reports
 * success having produced an error message on someone's screen.
 *
 * fancy-screens is a JavaScript package, so on a PHP host the component list
 * comes from wherever the app records what it registered — a config array, a
 * built manifest, an endpoint. The node does not care where; it only refuses to
 * emit a name that is not on the list.
 *
 * ```php
 * $this->app->bind(LlmScreenHost::class, fn () => new class implements LlmScreenHost {
 *     public function components(): array { return config('screens.components'); }
 *     public function generate(array $request): array { … }
 *     public function present(array $screen): void { ScreenPushed::dispatch($screen); }
 * });
 * ```
 *
 * The PHP twin of `../js/types.ts`.
 */
interface LlmScreenHost
{
    /**
     * Component names registered on this app's fancy-screens registry.
     *
     * @return list<string>
     */
    public function components(): array;

    /**
     * @param  array{purpose:string, components:list<string>, context?:mixed, provider?:string|null, model?:string|null, credential?:string|null}  $request
     * @return array{schema:array<string,mixed>, title?:string}
     */
    public function generate(array $request): array;

    /**
     * Put the generated screen in front of someone.
     *
     * A no-op implementation is fine: a workflow may only want the schema as
     * data — to store it, diff it, or hand it to a later step.
     *
     * @param  array{screenId:string, title:?string, schema:array<string,mixed>}  $screen
     */
    public function present(array $screen): void;
}
