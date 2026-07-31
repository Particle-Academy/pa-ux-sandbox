<?php

declare(strict_types=1);

namespace FancyFlow\Nodes\LlmInput;

/**
 * The seam between this node and whatever asks the model.
 *
 * fancy-flow's own `LlmClient` contract is deliberately narrow — choose a route,
 * nothing else — and a package cannot extend core's capability set, so this node
 * owns its own in the same shape: one method, bound by the host, with no
 * provider SDK anywhere in the node's source.
 *
 * Bind it once, in a service provider:
 *
 * ```php
 * $this->app->bind(LlmFormHost::class, fn () => new class implements LlmFormHost {
 *     public function generate(array $request): array
 *     {
 *         return ['fields' => Prism::structured()
 *             ->withSchema(GeneratedForm::schema())
 *             ->withPrompt($request['purpose'])
 *             ->generate()->structured['fields']];
 *     }
 * });
 * ```
 *
 * The PHP twin of `../js/types.ts`.
 */
interface LlmFormHost
{
    /**
     * Ask for a form.
     *
     * @param  array{purpose:string, context?:mixed, requiredKeys?:list<string>, maxFields?:int|null, provider?:string|null, model?:string|null, credential?:string|null}  $request
     * @return array{fields:list<array<string,mixed>>, title?:string}
     */
    public function generate(array $request): array;
}
