<?php

declare(strict_types=1);

namespace FancyFlow\Nodes\UiEffect;

use FancyFlow\Attributes\FlowNode;
use FancyFlow\Contracts\NodeExecutor;
use FancyFlow\Runtime\ExecutionContext;
use FancyFlow\Runtime\RunEvent;

/**
 * The PHP backend for `@particle-academy/ui_effect`.
 *
 * Deliberately the same shape as the TypeScript executor in `../js/executor.ts`:
 * resolve config into a {@see UiEffect}, validate it HERE, hand it to a host.
 * Config validation lives in the executor on both runtimes so a misconfigured
 * node produces the identical error whichever one runs it — that is what the
 * shared golden fixtures are checking.
 *
 * ## Why a missing host is an error
 *
 * PHP cannot apply the effect itself; it can only deliver it. The tempting
 * implementation shrugs when no host is bound — and then a workflow that
 * "pulses the card" runs on a queue worker, delivers nothing, and reports
 * success. Nothing throws, nothing is logged, and the run list is green. On a
 * worker there is nobody watching to notice, which makes it worse here than in
 * a browser.
 */
#[FlowNode(
    name: '@particle-academy/ui_effect',
    category: 'io',
    label: 'UI Effect',
    description: 'Add, swap or remove a class, set a CSS variable, or flash a style on a live surface — theme a whole page or pulse one card from a workflow.',
    icon: '✨',
    inputs: [['id' => 'in']],
    outputs: [['id' => 'out']],
    aliases: ['ui_effect'],
)]
final class UiEffectExecutor implements NodeExecutor
{
    public function __construct(private readonly ?UiEffectHost $host = null) {}

    public function execute(ExecutionContext $ctx): mixed
    {
        $effect = UiEffect::fromConfig($ctx->config());

        if (! in_array($effect->op, UiEffectOp::all(), true)) {
            throw new \InvalidArgumentException(
                "ui_effect: unknown op \"{$effect->op}\". Expected one of ".implode(', ', UiEffectOp::all()).'.'
            );
        }

        if ($effect->value === '' && $effect->op !== UiEffectOp::REMOVE_CLASS) {
            throw new \InvalidArgumentException("ui_effect: \"{$effect->op}\" needs a value.");
        }

        if (UiEffectOp::needsName($effect->op) && trim($effect->name) === '') {
            throw new \InvalidArgumentException($this->nameHint($effect->op));
        }

        $host = $this->host ?? throw new \RuntimeException(
            'ui_effect: no UI host bound. PHP has no DOM, so it can only deliver the effect to a surface — '
            .'bind '.UiEffectHost::class.' in the container (BroadcastUiEffectHost ships with this package).'
        );

        $ctx->emit(RunEvent::log(
            'info',
            "{$effect->op} on \"{$effect->target}\"".($effect->durationMs > 0 ? " for {$effect->durationMs}ms" : ''),
            $ctx->node->id,
            $effect->toArray(),
        ));

        $host->apply($effect);

        // Pass the upstream payload through alongside the effect, so the node
        // drops into the middle of a chain without severing it.
        $incoming = $ctx->input();
        $carried = is_array($incoming) ? $incoming : [];

        return array_merge($carried, ['uiEffect' => $effect->toArray(), 'applied' => true]);
    }

    private function nameHint(string $op): string
    {
        return match ($op) {
            UiEffectOp::REPLACE_CLASS => 'ui_effect: "replace-class" needs `name` — the class being replaced.',
            UiEffectOp::SET_VAR => 'ui_effect: "set-var" needs `name` — the custom property, e.g. --fa-accent.',
            default => 'ui_effect: "set-style" needs `name` — the CSS property, e.g. box-shadow.',
        };
    }
}
