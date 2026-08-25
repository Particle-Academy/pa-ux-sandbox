<?php

use App\Support\Registry\ConnectorFacet;
use App\Support\Registry\ConnectorSource;
use App\Support\Registry\FirstPartyNodeSource;
use Tests\TestCase;

uses(TestCase::class);

/*
 * The published vendor connectors, and the one thing that must never happen.
 *
 * Fifteen connectors ship as packages on four registries. Every other node this
 * registry serves is VENDORED — `add node` copies source into the project, and
 * "the files ARE the node". Those two delivery models cannot share the install
 * verb, and the failure when they do is silent: a package-delivered entry in
 * the vendoring index resolves, downloads, writes nothing, and reports success.
 *
 * So the assertions below are mostly about IDENTITY and DELIVERY rather than
 * about parsing. Parsing a JSON file is not the risk; asserting that a Stripe
 * refund is one capability with two install routes, and that its kind is the
 * one the published artifact actually declares, is.
 *
 * The fixture is a real slice of weaver's generated index — stripe (four
 * operations, including a trigger), gmail (package-only), and resend + telegram
 * (both ALSO vendored here). Four connectors, seven operations.
 */

function connectorSource(): ConnectorSource
{
    return new ConnectorSource(base_path('tests/Fixtures/connectors.json'));
}

it('reads one entry per operation, not one per connector', function () {
    $entries = connectorSource()->indexEntries();

    // Stripe publishes ONE package set and FOUR kinds. A catalogue keyed on the
    // connector could not answer "can it refund", which is the only question
    // anybody actually asks of it.
    expect($entries)->toHaveCount(7);

    $stripe = array_values(array_filter($entries, fn ($e) => $e['service'] === 'stripe'));
    expect($stripe)->toHaveCount(4);
});

it('uses the kind the published artifact declares, never a composed one', function () {
    $kinds = array_column(connectorSource()->indexEntries(), 'kind');

    // These four are the reason the index carries `kind` at all. Composing it
    // from service + operation was measured at 4 correct out of 18: a kind is
    // built from the node's own `kind` field, so `payment_intent_create` has
    // kind `payment_intent` and `webhook` has kind `webhook_trigger` — the verb
    // vanishing in one and a suffix appearing in the other, inside one provider.
    expect($kinds)
        ->toContain('@particle-academy/stripe_payment_intent')
        ->toContain('@particle-academy/stripe_webhook_trigger')
        ->toContain('@particle-academy/stripe_customer')
        ->toContain('@particle-academy/telegram_updates_trigger');

    // The spellings a derivation would have produced. If any of these ever
    // appears, something started composing ids again.
    expect($kinds)
        ->not->toContain('@particle-academy/stripe_payment_intent_create')
        ->not->toContain('@particle-academy/stripe_webhook')
        ->not->toContain('@particle-academy/stripe_customer_create')
        ->not->toContain('@particle-academy/telegram_get_updates');
});

it('marks every entry as package-delivered and carries install targets', function () {
    foreach (connectorSource()->indexEntries() as $entry) {
        expect($entry['delivery'])->toBe('package');

        // No vendoring url, ever. The CLI's `NodeIndexItem` requires one and the
        // manifest behind it requires `files`; an entry carrying a url it cannot
        // honour is the "installs nothing and says nothing" failure.
        expect($entry)->not->toHaveKey('url');

        // The version travels because it is the part that can be WRONG. A bare
        // name resolves to whatever `latest` is and therefore reads as current
        // even when the index is months stale.
        expect($entry['packages']['ui']['version'])->not->toBe('');
        expect($entry['packages']['ui']['registry'])->toBe('npm');
    }
});

it('reports both delivery paths for a kind that is also vendored', function () {
    $source = connectorSource();

    // The four vendored connector nodes predate the published catalogue and
    // declare the SAME kinds. That makes each one capability reachable two ways
    // — vendor the source, or install the package — not two entries that happen
    // to collide.
    $vendored = [
        '@particle-academy/stripe_payment_intent',
        '@particle-academy/stripe_webhook_trigger',
        '@particle-academy/resend_email_send',
        '@particle-academy/telegram_updates_trigger',
    ];

    expect($source->deliveryFor('@particle-academy/stripe_payment_intent', $vendored))->toBe('both');
    expect($source->deliveryFor('@particle-academy/resend_email_send', $vendored))->toBe('both');

    // Published, never vendored here.
    expect($source->deliveryFor('@particle-academy/gmail_message', $vendored))->toBe('package');
    expect($source->deliveryFor('@particle-academy/stripe_customer', $vendored))->toBe('package');

    // A core builtin is neither.
    expect($source->deliveryFor('@particle-academy/ui_effect', $vendored))->toBe('vendor');
});

it('maps a role to the graph category the palette groups by', function () {
    $byKind = collect(connectorSource()->indexEntries())->keyBy('kind');

    // Connector-ness and category are different axes — a Stripe webhook is a
    // trigger AND a connector, a Stripe charge is io AND a connector. Folding
    // them together makes "show me the triggers" and "hide the connectors"
    // impossible to ask at once.
    expect($byKind['@particle-academy/stripe_webhook_trigger']['category'])->toBe('trigger');
    expect($byKind['@particle-academy/stripe_webhook_trigger']['role'])->toBe('trigger');
    expect($byKind['@particle-academy/stripe_payment_intent']['category'])->toBe('io');
    expect($byKind['@particle-academy/stripe_payment_intent']['role'])->toBe('action');
});

it('translates registry names into engine runtimes and omits the React surface', function () {
    $entry = collect(connectorSource()->indexEntries())->firstWhere('kind', '@particle-academy/gmail_message');

    // The index names packages by REGISTRY (js/php/py); the node index names
    // runtimes by ENGINE (ts/php/py). They differ on exactly one key.
    expect($entry['runtimes'])->toBe(['ts', 'php', 'py']);

    // `ui` is the React surface, needed on EVERY backend. Folding it in would
    // give a PHP host a JS executor it will never run.
    expect($entry['runtimes'])->not->toContain('ui');
});

it('only reports domains the catalogue can actually group by', function () {
    foreach (connectorSource()->indexEntries() as $entry) {
        expect(array_key_exists($entry['domain'], ConnectorFacet::DOMAINS))->toBeTrue(
            "domain '{$entry['domain']}' on {$entry['kind']} is not one the catalogue groups by",
        );
    }
});

it('drops an operation that declares no kind rather than inventing one', function () {
    // The registry is keyed on kind everywhere. A synthesised id would be a new
    // identity resolving to nothing, sitting beside the real entry for the same
    // capability with neither looking wrong. Dropping it shows up in the count.
    $path = base_path('tests/Fixtures/connectors-no-kind.json');

    $index = json_decode(file_get_contents(base_path('tests/Fixtures/connectors.json')), true);
    unset($index['connectors'][0]['operations'][0]['kind']);
    file_put_contents($path, json_encode($index));

    try {
        $entries = (new ConnectorSource($path))->indexEntries();
        expect($entries)->toHaveCount(6);
        expect(array_column($entries, 'kind'))->not->toContain('');
    } finally {
        @unlink($path);
    }
});

/*
 * The rest run against the SHIPPED index, not the fixture.
 *
 * A fixture proves the parsing; only the real file proves the catalogue. This
 * is the artifact prod serves, and the failure it guards against is the one
 * this repo keeps producing — `flow:build`'s artifact went stale and served an
 * empty marketplace, `kit:dogfood` exists because the sandbox drifted twenty
 * five packages behind, and both looked fine from every surface.
 */

it('ships an index whose kinds are unique and namespaced', function () {
    $entries = (new ConnectorSource)->indexEntries();

    expect($entries)->not->toBeEmpty('the connector index is missing or empty — prod would serve no connectors');

    $kinds = array_column($entries, 'kind');

    // Duplicated kinds silently lose entries to `unique('kind')` downstream,
    // and the loser is decided by concat order rather than by anything anyone
    // chose.
    expect($kinds)->toHaveCount(count(array_unique($kinds)));

    foreach ($kinds as $kind) {
        expect($kind)->toStartWith('@particle-academy/');
    }
});

it('counts a doubly-delivered kind ONCE in the service directory', function () {
    $firstParty = app(FirstPartyNodeSource::class);
    $connectors = new ConnectorSource;

    $vendoredKinds = array_column($firstParty->indexEntries(), 'kind');
    $union = collect($firstParty->indexEntries())
        ->concat($connectors->indexEntries())
        ->unique('kind')
        ->values();

    $both = array_values(array_filter(
        array_column($connectors->indexEntries(), 'kind'),
        fn (string $kind) => in_array($kind, $vendoredKinds, true),
    ));

    // If this is empty the test is asserting nothing — the overlap IS the
    // condition being guarded, so its absence is a failure rather than a pass.
    expect($both)->not->toBeEmpty('no kind is both vendored and published, so the double-count guard is vacuous');

    foreach ($both as $kind) {
        expect($connectors->deliveryFor($kind, $vendoredKinds))->toBe('both');
        expect($union->where('kind', $kind))->toHaveCount(1);
    }

    // Stripe ships two vendored nodes and four published kinds. Counted twice
    // it would read as six, on the catalogue's front door, with nothing
    // downstream to contradict it.
    $stripe = collect(ConnectorFacet::services($union))->firstWhere('service', 'stripe');
    expect($stripe['nodes'])->toBe(4);
});

it('never claims a version the index did not state', function () {
    // The version is the part that can be wrong, and a blank one would install
    // `latest` while reading as pinned.
    foreach ((new ConnectorSource)->indexEntries() as $entry) {
        foreach ($entry['packages'] as $registry => $package) {
            expect($package['version'])->not->toBe(
                '', "{$entry['kind']} has no version for its {$registry} package",
            );
            expect($package['name'])->not->toBe('');
        }
    }
});

it('serves the connectors on their own endpoint, with install commands', function () {
    $response = $this->getJson('/r/connectors/index.json');

    $response->assertOk();
    $body = $response->json();

    expect($body['count'])->toBeGreaterThan(0);
    expect($body['delivery'])->toBe('package');

    $stripe = collect($body['items'])->firstWhere('kind', '@particle-academy/stripe_refund');
    expect($stripe)->not->toBeNull();

    // The install command is the point of this endpoint. A catalogue that
    // listed a connector without saying how to install it would send the reader
    // to `add node`, which is the wrong verb and fails silently.
    expect($stripe['install']['npm'])->toContain('npm install');
    expect($stripe['install']['npm'])->toContain('@particle-academy/stripe-ui@');
    expect($stripe['install']['packagist'])->toContain('composer require');
    expect($stripe['install']['pypi'])->toContain('pip install');

    // The `-ui` package leads, because its runtime sibling peer-depends on it
    // and npm treats a missing peer as an error rather than a warning.
    expect($stripe['install']['npm'])->toMatch('/npm install @particle-academy\/stripe-ui@/');
});

it('says which connectors are ALSO available as vendored source', function () {
    $items = collect($this->getJson('/r/connectors/index.json')->json('items'));

    // Reachable both ways — the consumer picks based on whether they want the
    // source in their project or a dependency, and they can only pick if we say.
    expect($items->firstWhere('kind', '@particle-academy/stripe_payment_intent')['delivery'])->toBe('both');

    // Published only.
    expect($items->firstWhere('kind', '@particle-academy/stripe_refund')['delivery'])->toBe('package');
});

it('keeps package-delivered connectors OUT of the vendoring index', function () {
    // The whole reason connectors have their own endpoint. `NodeIndexItem`
    // requires a `url` and the manifest behind it requires `files`; an entry
    // here that cannot supply them resolves, writes nothing, and reports
    // success — "installs nothing and says nothing".
    $items = collect($this->getJson('/r/nodes/index.json')->json('items'));

    // Published-only kinds must not appear. The four that are ALSO vendored
    // legitimately do — they have real source behind them.
    foreach (['@particle-academy/stripe_refund', '@particle-academy/stripe_customer', '@particle-academy/gmail_message'] as $kind) {
        expect($items->firstWhere('kind', $kind))->toBeNull(
            "{$kind} is package-delivered and has no vendorable source, so `add node` would install nothing",
        );
    }

    // And every entry that IS there can actually be fetched.
    foreach ($items as $item) {
        expect($item)->toHaveKey('url');
    }
});

it('narrows by service and by domain', function () {
    $stripe = $this->getJson('/r/connectors/index.json?service=stripe')->json();
    expect($stripe['count'])->toBe(4);
    expect(collect($stripe['items'])->pluck('service')->unique()->all())->toBe(['stripe']);

    $payments = $this->getJson('/r/connectors/index.json?domain=payments')->json();
    expect(collect($payments['items'])->pluck('domain')->unique()->all())->toBe(['payments']);
});

it('degrades to no connectors when the index has not been published yet', function () {
    // Absence is legitimate: the catalogue is generated outside this app, so a
    // checkout predating it simply has no file. "No connectors" is true, and is
    // a different failure from an unreachable registry — which is why the
    // version check lives in its own command.
    $source = new ConnectorSource(base_path('tests/Fixtures/does-not-exist.json'));

    expect($source->connectors())->toBe([]);
    expect($source->indexEntries())->toBe([]);
});
