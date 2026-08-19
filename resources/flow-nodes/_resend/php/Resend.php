<?php

declare(strict_types=1);

namespace FancyFlow\Nodes\Resend;

use FancyFlow\Nodes\Connector\Mode;
use FancyFlow\Nodes\Connector\PreparedRequest;
use FancyFlow\Nodes\Connector\SandboxKind;
use FancyFlow\Nodes\Connector\ServiceDescriptor;

/**
 * Resend — the exemplar for a provider with NO sandbox.
 *
 * ## Why this shape matters enough to be an exemplar
 *
 * Roughly a third of the providers worth connecting have no test estate at all:
 * Resend, Mailchimp, Loops, Discord, Attio, Close, Help Scout, Front, Linear.
 * For every one of them "just try it" means writing to production, and Front's
 * production data is live customer email.
 *
 * A catalogue that only worked properly for providers with sandboxes would be a
 * catalogue you cannot evaluate for a third of what it covers. So `fake` is not
 * the fallback here — it is the primary development mode, and the node does not
 * offer "sandbox" at all, because offering a choice the provider cannot honour
 * is an invitation to pick it and read an error.
 *
 * Resend does publish simulator RECIPIENTS (`delivered@resend.dev`, …). Those
 * are not a sandbox: the send is real, billed, and counted against the quota.
 * Modelling them as one would put a live send behind a control labelled "test".
 */
final class Resend
{
    public const API = 'https://api.resend.com';

    /** Live sends that land in a simulator — NOT a test estate. */
    public const SIMULATOR_RECIPIENTS = [
        'delivered@resend.dev',
        'bounced@resend.dev',
        'complained@resend.dev',
        'suppressed@resend.dev',
    ];

    public static function descriptor(): ServiceDescriptor
    {
        return new ServiceDescriptor(
            service: 'resend',
            title: 'Resend',
            // The whole point of this exemplar. `None` makes the shared resolver
            // fall through to `fake` on a local project rather than to a test
            // estate that does not exist.
            sandbox: SandboxKind::None,
            baseUrls: [Mode::Live->value => self::API],
            requires: ['apiKey'],
            authorize: static function (array $credentials, PreparedRequest $request, Mode $mode): void {
                $request->withHeader('Authorization', 'Bearer '.($credentials['apiKey'] ?? ''));
                // Not optional and not cosmetic: Resend answers 403 to a request
                // with no User-Agent, which reads exactly like a bad key and
                // sends people off to rotate a credential that was fine.
                $request->withHeader('User-Agent', 'fancy-flow-connector');
            },
            faker: ResendFaker::respond(...),
        );
    }
}
