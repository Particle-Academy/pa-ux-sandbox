<?php

use App\Http\Middleware\HandleInertiaRequests;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // External MCP clients hit these routes with bearer tokens, not
        // session cookies — exempt them from CSRF.
        $middleware->validateCsrfTokens(except: [
            'whiteboard-share/*',
            'mcp', // public install-MCP for IDE agents
        ]);

        // Inertia shared props + root view for the Showcase SPA.
        $middleware->web(append: [
            HandleInertiaRequests::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
