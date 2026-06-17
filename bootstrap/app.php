<?php

use App\Http\Middleware\EnsureUserNotSuspended;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\TrackActiveUser;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        channels: __DIR__.'/../routes/channels.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Behind Forge's load balancer / TLS-terminating nginx, honor the
        // X-Forwarded-* headers so Laravel sees the real https scheme + host
        // (otherwise generated URLs are http:// → mixed-content blocks).
        $middleware->trustProxies(at: '*', headers: Request::HEADER_X_FORWARDED_FOR
            | Request::HEADER_X_FORWARDED_HOST
            | Request::HEADER_X_FORWARDED_PORT
            | Request::HEADER_X_FORWARDED_PROTO
            | Request::HEADER_X_FORWARDED_AWS_ELB);

        // External MCP clients hit these routes with bearer tokens, not
        // session cookies — exempt them from CSRF.
        $middleware->validateCsrfTokens(except: [
            'agent-relay/*',
            'whiteboard-share/*', // back-compat alias for the agent relay
            'mcp', // public install-MCP for IDE agents
            'webhooks/github', // server-to-server; verified via HMAC signature
        ]);

        // Inertia shared props + root view for the Showcase SPA. The suspension
        // gate runs after auth is resolved so a frozen account is bounced to login.
        $middleware->web(append: [
            HandleInertiaRequests::class,
            EnsureUserNotSuspended::class,
            TrackActiveUser::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
