<?php

declare(strict_types=1);

namespace FancyFlow\Nodes\Connector;

/**
 * A last-resort transport over ext-curl.
 *
 * Present so a vendored connector can make a real call in a plain PHP script
 * with nothing else installed. A Laravel host should bind its own adapter over
 * `Http::send()` instead — it gets the app's timeouts, proxy settings, logging
 * and test fakes, none of which this knows about.
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
        $error = curl_error($handle);
        curl_close($handle);

        if ($body === false) {
            throw new ConnectorTransientException('transport failed: '.$error);
        }

        return new TransportResponse($status, $responseHeaders, (string) $body);
    }
}
