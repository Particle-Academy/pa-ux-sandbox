<?php

declare(strict_types=1);

namespace FancyFlow\Nodes\UiEffect;

/**
 * Records effects instead of delivering them. For tests and dry runs.
 *
 * Deliberately NOT the default binding. A null host that ships as the fallback
 * turns "nobody wired a surface" into a silent success, which is precisely what
 * {@see UiEffectExecutor} refuses to do. You have to ask for this one.
 */
final class NullUiEffectHost implements UiEffectHost
{
    /** @var list<UiEffect> */
    private array $applied = [];

    public function apply(UiEffect $effect): void
    {
        $this->applied[] = $effect;
    }

    /** @return list<UiEffect> */
    public function applied(): array
    {
        return $this->applied;
    }
}
