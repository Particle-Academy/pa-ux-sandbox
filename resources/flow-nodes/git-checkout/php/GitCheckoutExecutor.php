<?php

declare(strict_types=1);

namespace FancyFlow\Nodes\GitCheckout;

use FancyFlow\Attributes\FlowNode;
use FancyFlow\Contracts\NodeExecutor;
use FancyFlow\Runtime\ExecutionContext;
use FancyFlow\Runtime\Port;
use FancyFlow\Runtime\RunEvent;

/**
 * Switch the working copy to a branch or revision.
 *
 * Honours `propose`: fancy-git returns an OperationProposal instead of
 * performing the checkout, and the node routes it to `proposed` for a human to
 * approve. A workflow that moves someone else working copy under them is
 * exactly the case that wants a pause.
 */
#[FlowNode(
    name: '@particle-academy/git_checkout',
    category: 'io',
    label: 'Checkout',
    description: 'Switch a working copy to a branch or revision — or propose it for approval.',
    icon: '⤳',
    inputs: [['id' => 'in']],
    outputs: [['id' => 'done', 'label' => 'done'], ['id' => 'proposed', 'label' => 'proposed']],
    aliases: ['git_checkout'],
)]
final class GitCheckoutExecutor implements NodeExecutor
{
    public function __construct(private readonly ?RepoHost $host = null) {}

    public function execute(ExecutionContext $ctx): mixed
    {
        $config = $ctx->config();
        $host = $this->host ?? throw new \RuntimeException(
            'git: no repository host bound. Bind '.RepoHost::class.' with a particle-academy/fancy-git GitRepository factory.'
        );

        $target = trim((string) ($config['target'] ?? ''));
        if ($target === '') {
            throw new \RuntimeException('git_checkout: needs a `target` branch or revision. Refusing to guess.');
        }

        $propose = ($config['propose'] ?? false) === true;
        $result = $host->workingCopy($config)->checkout($target, $propose);

        // A proposal is the RESULT, not a failure: the node did its job and the
        // decision belongs to whoever reviews it.
        if ($propose) {
            $ctx->emit(RunEvent::log('info', "proposed checkout of {$target} (not performed)", $ctx->node->id));

            return Port::only('proposed', ['target' => $target, 'proposal' => $result]);
        }

        $ctx->emit(RunEvent::log('info', "checked out {$target}", $ctx->node->id));

        return Port::only('done', ['target' => $target]);
    }
}
