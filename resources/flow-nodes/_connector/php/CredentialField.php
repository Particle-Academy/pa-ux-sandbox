<?php


// GENERATED from particle-academy/fancy-connectors — php/src/CredentialField.php
// Do not edit here. Fix it in the package and re-run `php artisan flow:build`;
// a test fails the build when this copy and the package disagree.
declare(strict_types=1);

namespace FancyFlow\Nodes\Connector;

/**
 * One credential a provider needs.
 *
 * **`secret` is chosen per field, never inferred from the type.** A Discord
 * webhook URL is a URL and is entirely a secret — it carries its token in the
 * path — and the reference implementation very nearly stored it as configuration
 * because it looked like a URL.
 */
final readonly class CredentialField
{
    /**
     * @param  string  $key  stable key. The host maps it to wherever it keeps values.
     * @param  string  $help  what it is, where it comes from, and what it does NOT prove
     * @param  string|null  $placeholder  a hint for an empty field. NEVER a real value.
     */
    public function __construct(
        public string $key,
        public string $label,
        public string $help,
        public CredentialScope $scope,
        public bool $secret,
        public bool $required = true,
        public ?string $placeholder = null,
    ) {}
}
