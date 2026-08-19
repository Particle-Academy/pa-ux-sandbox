<?php


// GENERATED from particle-academy/fancy-connector-core — php/src/CurlTransport.php
// Do not edit here. Fix it in the package and re-run `php artisan flow:build`;
// a test fails the build when this copy and the package disagree.
declare(strict_types=1);

namespace FancyFlow\Nodes\Connector;

/**
 * A last-resort transport over ext-curl.
 *
 * Present so a connector can make a real call in a plain PHP script with nothing
 * else installed — no Guzzle, no framework, no dependency this package would
 * otherwise have to carry into every consumer's tree. A Laravel host should bind
 * its own adapter over `Http::send()` instead: it gets the app's timeouts, proxy
 * settings, logging and test fakes, none of which this knows about.
 *
 * ## The one thing it does that a naive wrapper would not
 *
 * It classifies its own failure from the cURL errno, through
 * {@see TransportException::fromCurlErrno()}. A transport that threw a bare
 * exception would hand the retry ladder no way to tell a refused connection —
 * which provably never arrived — from a timeout, which may already have charged
 * someone. The previous runtime did exactly that, and the retry ladder guessed
 * "transient, safe to repeat" for both.
 */
final class CurlTransport implements Transport
{
    public function __construct(private readonly int $timeoutSeconds = 30) {}

    public function send(PreparedRequest $request): TransportResponse
    {
        if (! function_exists('curl_init')) {
            throw new ConnectorConfigException(
                'ext-curl is not available, so this connector cannot make a request. '
                .'Bind a '.Transport::class.' implementation instead of relying on the fallback.'
            );
        }

        $headers = [];

        foreach ($request->headers as $name => $value) {
            $headers[] = $name.': '.$value;
        }

        $responseHeaders = [];
        $handle = curl_init();
        curl_setopt_array($handle, [
            CURLOPT_URL => $request->url,
            CURLOPT_CUSTOMREQUEST => $request->method,
            CURLOPT_HTTPHEADER => $headers,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => $this->timeoutSeconds,
            // Never follow redirects on an authenticated API call: a 30x to
            // another host would replay the Authorization header there.
            CURLOPT_FOLLOWLOCATION => false,
            CURLOPT_HEADERFUNCTION => static function ($_, string $line) use (&$responseHeaders): int {
                $parts = explode(':', $line, 2);

                if (count($parts) === 2) {
                    $responseHeaders[strtolower(trim($parts[0]))] = trim($parts[1]);
                }

                return strlen($line);
            },
        ]);

        if ($request->body !== null) {
            curl_setopt($handle, CURLOPT_POSTFIELDS, $request->body);
        }

        $body = curl_exec($handle);
        $status = (int) curl_getinfo($handle, CURLINFO_RESPONSE_CODE);
        $errno = curl_errno($handle);
        $error = curl_error($handle);
        curl_close($handle);

        if ($body === false) {
            // The errno decides unreachable vs ambiguous. A timeout (28) is
            // ambiguous even though it feels identical to a refused connection
            // from here — see TransportException::fromCurlErrno().
            throw TransportException::fromCurlErrno($errno, $error);
        }

        return new TransportResponse($status, $responseHeaders, (string) $body);
    }
}
