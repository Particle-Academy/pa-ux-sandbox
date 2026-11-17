<?php

use App\Http\Middleware\EnsureUserNotSuspended;
use App\Http\Middleware\ForceCanonicalScheme;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\TrackActiveUser;
use App\Http\Middleware\TrustCloudflare;
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
        // Behind Cloudflare's proxy. The trusted proxies are Cloudflare's
        // published ranges plus loopback (config/trustedproxy.php), never `*`:
        // trusting everyone let any caller choose the IP every rate limiter
        // keyed on. Only the client address and scheme are taken from them.
        // Cloudflare passes a client's own X-Forwarded-Host / -Port through
        // untouched, so trusting those would let a visitor pick the host.
        // TrustCloudflare runs first so `ip()` is the visitor's
        // CF-Connecting-IP from a Cloudflare edge, and every CF-* header from
        // anyone else is dropped.
        $middleware->prepend(TrustCloudflare::class);
        $middleware->trustProxies(headers: Request::HEADER_X_FORWARDED_FOR
            | Request::HEADER_X_FORWARDED_PROTO);

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
        // Scheme first: URL generation for everything after it depends on the
        // decision, and it must be made per REQUEST rather than once at boot.
        $middleware->web(prepend: [
            ForceCanonicalScheme::class,
        ]);

        $middleware->web(append: [
            HandleInertiaRequests::class,
            EnsureUserNotSuspended::class,
            TrackActiveUser::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
