<?php

namespace App\Mcp\Servers;

use App\Mcp\Tools\GetComponent;
use App\Mcp\Tools\InstallInstructions;
use App\Mcp\Tools\ListComponents;
use App\Mcp\Tools\SearchComponents;
use Laravel\Mcp\Server;
use Laravel\Mcp\Server\Attributes\Instructions;
use Laravel\Mcp\Server\Attributes\Name;
use Laravel\Mcp\Server\Attributes\Version;

#[Name('Fancy UI registry')]
#[Version('0.1.0')]
#[Instructions(<<<'TXT'
The Fancy UI install-MCP. Lets you browse, search, and install components from
the Fancy UI registry (~100 React + PHP primitives across 11 packages).

Workflow:
1. Use `list_components` to see everything available, or `search_components`
   when the user names a UI concept ("calendar", "data grid", "modal").
2. Use `install_instructions` to get the exact install commands for the
   chosen component — both the `npm install` path (default) and the
   `npx fancy-ui add` vendor-source path.
3. If you need the actual source code (e.g. to inline into an answer or to
   write files directly), call `get_component` to fetch the full registry
   bundle.

This server is registry/install-time only. It does NOT operate a running
Fancy UI app. For that, register the runtime bridges from
@particle-academy/agent-integrations inside the host app.

Docs: https://ui.particle.academy/docs/mcp
Registry contract: https://ui.particle.academy/docs/registry
TXT)]
class FancyUiRegistry extends Server
{
    protected array $tools = [
        ListComponents::class,
        SearchComponents::class,
        GetComponent::class,
        InstallInstructions::class,
    ];

    protected array $resources = [
        //
    ];

    protected array $prompts = [
        //
    ];
}
