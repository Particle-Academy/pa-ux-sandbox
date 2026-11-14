<?php

/*
 * A raw HTTP/1.1 server for SafeUrlFetcherSizeCapTest, so the size cap is tested
 * against REAL curl, which is the only place it is enforced. Writing the bytes by
 * hand is the point: it controls Content-Length and chunked framing exactly.
 *
 *   /small          200, Content-Length, a 1 000-byte body
 *   /declared-huge  200, Content-Length 50 000 000, then a body that never ends
 *   /chunked-huge   200, chunked, no Content-Length, chunks that never end
 *
 * The two huge routes never finish on purpose: a fetcher that does not abort them
 * runs into its timeout instead of passing.
 *
 * Usage: php server.php <port>. Prints "ready" once it is listening.
 */

$port = (int) ($argv[1] ?? 0);
$server = stream_socket_server("tcp://127.0.0.1:{$port}", $errno, $error);
if ($server === false) {
    fwrite(STDERR, "listen failed: {$error}");
    exit(1);
}

$crlf = chr(13).chr(10);
echo 'ready'.PHP_EOL;

while (true) {
    $client = @stream_socket_accept($server, 60);
    if ($client === false) {
        continue;
    }

    $requestLine = (string) fgets($client);
    while (($line = fgets($client)) !== false && trim($line) !== '') {
        // Drain the request headers.
    }

    $path = explode(' ', $requestLine)[1] ?? '/';
    $chunk = str_repeat('x', 16_384);

    if ($path === '/small') {
        $body = str_repeat('s', 1_000);
        @fwrite($client, 'HTTP/1.1 200 OK'.$crlf.'Content-Type: text/html'.$crlf.'Content-Length: '.strlen($body).$crlf.'Connection: close'.$crlf.$crlf.$body);
    } elseif ($path === '/declared-huge') {
        @fwrite($client, 'HTTP/1.1 200 OK'.$crlf.'Content-Type: text/html'.$crlf.'Content-Length: 50000000'.$crlf.'Connection: close'.$crlf.$crlf);
        while (@fwrite($client, $chunk) !== false && ! feof($client)) {
            usleep(2_000);
        }
    } elseif ($path === '/chunked-huge') {
        @fwrite($client, 'HTTP/1.1 200 OK'.$crlf.'Content-Type: text/html'.$crlf.'Transfer-Encoding: chunked'.$crlf.'Connection: close'.$crlf.$crlf);
        while (@fwrite($client, dechex(strlen($chunk)).$crlf.$chunk.$crlf) !== false && ! feof($client)) {
            usleep(2_000);
        }
    } else {
        @fwrite($client, 'HTTP/1.1 404 Not Found'.$crlf.'Content-Length: 0'.$crlf.'Connection: close'.$crlf.$crlf);
    }

    @fclose($client);
}
