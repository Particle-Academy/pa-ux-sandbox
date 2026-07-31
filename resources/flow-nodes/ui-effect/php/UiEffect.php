<?php

declare(strict_types=1);

namespace FancyFlow\Nodes\UiEffect;

/**
 * What a `ui_effect` node asks a host to do.
 *
 * The PHP twin of the TypeScript `UiEffect` type in `../js/types.ts`. Same
 * fields, same meanings, same JSON — the two runtimes have to agree here or the
 * shared golden fixtures stop comparing like with like.
 */
final class UiEffect
{
    public function __construct(
        /**
         * What to affect: a **stable handle** the host published, or `page` for
         * the document root.
         *
         * Handles, not selectors. The Fancy component contract is explicit that
         * agents never guess DOM, and a workflow is an agent.
         */
        public readonly string $target,
        /** One of the {@see UiEffectOp} constants. */
        public readonly string $op,
        /** The class list, CSS value, or custom-property value. */
        public readonly string $value,
        /**
         * The second identifier some ops need: the custom property for
         * `set-var`, the CSS property for `set-style`, or the class being
         * replaced by `replace-class`. Always a string, never absent.
         */
        public readonly string $name = '',
        /**
         * Revert after this many milliseconds. `0` means permanent.
         *
         * What makes a pulse fall out of the same six ops rather than needing
         * its own: add a class, revert it in 1200ms.
         */
        public readonly int $durationMs = 0,
    ) {}

    /** @param array<string,mixed> $config */
    public static function fromConfig(array $config): self
    {
        return new self(
            target: trim((string) ($config['target'] ?? 'page')) ?: 'page',
            op: (string) ($config['op'] ?? UiEffectOp::ADD_CLASS),
            value: (string) ($config['value'] ?? ''),
            name: (string) ($config['name'] ?? ''),
            durationMs: (int) ($config['durationMs'] ?? 0),
        );
    }

    /**
     * The wire shape. Key names match the TypeScript type exactly — a browser
     * receiving this over a relay applies it with the same code path an
     * in-browser run uses.
     *
     * @return array<string,mixed>
     */
    public function toArray(): array
    {
        return [
            'target' => $this->target,
            'op' => $this->op,
            'value' => $this->value,
            'name' => $this->name,
            'durationMs' => $this->durationMs,
        ];
    }
}
