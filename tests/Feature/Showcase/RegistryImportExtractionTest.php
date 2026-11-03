<?php

use App\Support\Registry\RegistryItem;
use App\Support\Registry\RegistrySource;
use Illuminate\Support\Facades\File;
use Tests\TestCase;

uses(TestCase::class);

/*
 * What `registry:build` lists as an item's npm dependencies.
 *
 * `fancy-cli add` installs whatever `dependencies` says, so an entry that is not
 * a package is a broken install. The extractor used to match the word "from"
 * followed by a quote ANYWHERE in the source, which reached across template
 * literals, JSX attributes and string arrays and put source fragments in the
 * artifact: 5 entries in 4 items when this was written.
 *
 * Each shape below is the real source that produced one of them.
 */

/**
 * The extractor's verdict on one source file.
 *
 * @return array{npm: list<string>, registry: list<string>}
 */
function importsIn(string $source): array
{
    return (new RegistrySource)->parseImports([
        ['path' => 'components/fancy/fixture/Fixture.tsx', 'content' => $source],
    ]);
}

dataset('sources that are not imports', [
    'a template literal (flow-editor, flow-viewer)' => [<<<'TS'
        const message =
          `Edge "${edge.id}" reads from "${edge.source}", which is a TERMINAL node`;
        TS],
    'a JSX attribute ending in the word (job-posting-form)' => [<<<'TS'
        <Input
          type="number"
          label="Pay from"
          value={values.pay_min == null ? '' : String(values.pay_min)}
        />
        TS],
    'a string key across several lines (shared-whiteboard)' => [<<<'TS'
        function resolveCenter(
          ref: ConnectorItem["from"],
          notes: StickyNoteItem[],
          shapes: ShapeItem[],
        ): { x: number; y: number } | null {
          if (typeof ref === "string") {
            return null;
          }
        }
        TS],
    'a string array (shared-whiteboard bridge)' => [<<<'TS'
        reg("connector", ["from", "to"], (args) => args);
        TS],
    'a whole import statement inside a template literal' => [<<<'TS'
        const sample = `
        import fake from "from-a-template";
        export * from "also-from-a-template";
        import("dynamic-in-template-text");
        `;
        TS],
    'import-shaped text inside a string' => [<<<'TS'
        const a = "await import('in-a-string')";
        const b = 'import x from "in-a-string"';
        TS],
    'comments' => [<<<'TS'
        // import a from 'in-a-line-comment';
        /* import b from 'in-a-block-comment'; */
        /**
         * @example
         * import { Canvas } from "in-a-doc-comment";
         * await import("in-a-doc-comment");
         */
        TS],
    'identifiers that merely contain or are the keywords' => [<<<'TS'
        const from = 'not-a-specifier';
        const pick = { from: 'not-a-specifier' };
        const list = Array.from('not-a-specifier');
        const reimport = loader.import('not-a-specifier');
        const transform = 'not-a-specifier';
        export const to = 'not-a-specifier';
        export { to as from };
        TS],
    'an interface with a member called from' => [<<<'TS'
        export interface Edge { from: "not-a-specifier"; to: string }
        TS],
    'a statement-shaped sentence mid-line in JSX text' => [<<<'TS'
        const page = <p>You may import x from "not-a-specifier" here.</p>;
        TS],
]);

it('takes nothing from source that is not an import', function (string $source) {
    expect(importsIn($source))->toBe(['npm' => [], 'registry' => []]);
})->with('sources that are not imports');

dataset('real import forms', [
    'default' => ["import x from 'pkg-y';", ['pkg-y']],
    'named, double quotes' => ['import {a} from "pkg-y";', ['pkg-y']],
    'no spaces' => ['import{a}from"pkg-y";', ['pkg-y']],
    'default and named' => ["import d, { a as b } from 'pkg-y';", ['pkg-y']],
    'namespace' => ["import * as ns from 'pkg-y';", ['pkg-y']],
    'type only' => ["import type { T } from 'pkg-y';", ['pkg-y']],
    'side effect, single quotes' => ["import 'pkg-y';", ['pkg-y']],
    'side effect, double quotes' => ['import "pkg-y";', ['pkg-y']],
    're-export named' => ["export { a } from 'pkg-y';", ['pkg-y']],
    're-export star' => ["export * from 'pkg-y';", ['pkg-y']],
    're-export namespace' => ["export * as ns from 'pkg-y';", ['pkg-y']],
    're-export type' => ["export type { T } from 'pkg-y';", ['pkg-y']],
    'dynamic' => ["const m = await import('pkg-y');", ['pkg-y']],
    'dynamic, spaced' => ['const m = await import ( "pkg-y" );', ['pkg-y']],
    'type-level import()' => ["type T = import('pkg-y').Thing;", ['pkg-y']],
    'dynamic in a template expression' => ['const s = `a ${await import("pkg-y")} b`;', ['pkg-y']],
    'scoped' => ["import x from '@scope/pkg-y';", ['@scope/pkg-y']],
    'subpath' => ["import x from 'pkg-y/deep/path';", ['pkg-y']],
    'scoped subpath' => ["import '@scope/pkg-y/dist/style.css';", ['@scope/pkg-y']],
    'dotted and underscored name' => ["import x from 'lodash.debounce_x';", ['lodash.debounce_x']],
    'after a directive on the same line' => ["'use client'; import x from 'pkg-y';", ['pkg-y']],
    'after a comment' => ["/* note */ import x from 'pkg-y';", ['pkg-y']],
    'with an import attribute' => ["import d from 'pkg-y' with { type: 'json' };", ['pkg-y']],
    'indented' => ["    import x from 'pkg-y';", ['pkg-y']],
    'a clause across lines' => ["import {\n  a, // first\n  b,\n} from 'pkg-y';", ['pkg-y']],
    're-export across lines' => ["export {\n  a,\n  b,\n} from 'pkg-y';", ['pkg-y']],
    'several, de-duplicated in order' => ["import a from 'b-pkg';\nimport c from 'a-pkg';\nimport d from 'b-pkg';", ['b-pkg', 'a-pkg']],
]);

it('takes the package from every real import form', function (string $source, array $expected) {
    expect(importsIn($source)['npm'])->toBe($expected);
})->with('real import forms');

/*
 * The other way this goes wrong, and the more expensive one: source that throws
 * a scanner out of step, so that a REAL import after it is silently lost. Every
 * shape here is legal TSX and each is followed by an import that must survive.
 */
dataset('source a scanner could lose its place in', [
    'an apostrophe in JSX text' => ["const a = <p>Don't panic</p>;"],
    'two apostrophes in JSX text' => ["const a = <p>Don't {x ? 'y' : 'z'} won't</p>;"],
    'a URL in JSX text' => ['const a = <p>https://example.test/a</p>;'],
    'a URL in a string' => ['const a = "https://example.test/*";'],
    'a glob in a string' => ['const a = "src/**/*.ts";'],
    'a multi-line JSX attribute' => ["const a = <p title=\"one\n  two\">x</p>;"],
    'a regex holding a quote' => ['const a = /[\'"]/.test(s);'],
    'a regex holding a backtick' => ['const a = /`/.test(s);'],
    'a regex holding a comment opener' => ['const a = /\/\*/.test(s);'],
    'a regex holding a slash in a class' => ['const a = /[/`]/.test(s);'],
    'a division, not a regex' => ['const a = (b) / 2 + c / d;'],
    'a nested template' => ['const a = `x ${b ? `y ${c}` : "z"} w`;'],
    'braces in a template expression' => ['const a = `x ${JSON.stringify({ b: { c: 1 } })} y`;'],
    'an escaped backtick' => ['const a = `x \` y`;'],
    'an escaped dollar brace' => ['const a = `x \${ y`;'],
    'an escaped quote' => ["const a = 'don\\'t';"],
    'a self-closing tag after a spread' => ['const a = <A {...p} />;'],
]);

it('keeps the imports that follow source that could derail a scanner', function (string $hazard) {
    $source = "import first from 'before-pkg';\n{$hazard}\nexport * from 'after-pkg';\nconst m = import('dynamic-pkg');";

    expect(importsIn($source)['npm'])->toBe(['before-pkg', 'after-pkg', 'dynamic-pkg']);
})->with('source a scanner could lose its place in');

it('reads CRLF source the same as LF', function () {
    expect(importsIn("import a from 'a-pkg';\r\nimport 'b-pkg';\r\n")['npm'])->toBe(['a-pkg', 'b-pkg']);
});

it('buckets the specifiers that are not npm packages exactly as before', function () {
    $imports = importsIn(<<<'TS'
        import a from './sibling';
        import b from '@/alias';
        import c from '~/alias';
        import d from '../Tooltip';
        import e from '../utils/cn';
        import f from 'react';
        import g from 'react-dom/client';
        import h from 'tailwindcss/plugin';
        import fs from 'node:fs';
        import i from '.';
        import j from '..';
        TS);

    expect($imports)->toBe(['npm' => [], 'registry' => ['tooltip']]);
});

it('refuses, naming the file, when a file ends inside a template literal', function () {
    // Carrying on would treat the rest of the file as not-code and silently
    // lose every import in it, which is the same class of bug as listing a
    // fragment and much harder to notice.
    (new RegistrySource)->parseImports([
        ['path' => 'components/fancy/fixture/Broken.tsx', 'content' => "const a = `never closed;\nimport x from 'pkg-y';"],
    ]);
})->throws(RuntimeException::class, 'components/fancy/fixture/Broken.tsx');

it('refuses, naming the file, when a file ends inside a block comment', function () {
    (new RegistrySource)->parseImports([
        ['path' => 'components/fancy/fixture/Broken.tsx', 'content' => "/* never closed\nimport x from 'pkg-y';"],
    ]);
})->throws(RuntimeException::class, 'components/fancy/fixture/Broken.tsx');

/*
 * The boundary. Whatever the extractor believes, nothing that is not a package
 * name reaches the artifact, and it fails rather than being dropped: a filter
 * here would silently lose a real dependency whose import was merely unusual.
 */
it('reports an invalid name instead of dropping it', function () {
    expect(importsIn("import x from 'Not A Package';")['npm'])->toBe(['Not A Package']);
});

dataset('invalid names', [
    '${edge.source}',
    ', ',
    "\n  value={x}",
    "trailing-newline\n",
    'Upper-Case',
    '.leading-dot',
    '_leading-underscore',
    '@scope',
    '@scope/',
    '@/alias',
    'has space',
    'node_modules',
    'favicon.ico',
]);

it('fails on a dependency that is not a package name, naming the item and the string', function (string $name) {
    $item = new RegistryItem(
        name: 'the-item',
        title: 'The Item',
        description: 'x',
        package: 'react-fancy',
        files: [],
        dependencies: ['lucide-react', $name],
    );

    expect(fn () => RegistrySource::assertDependenciesAreValid([$item]))
        ->toThrow(RuntimeException::class, 'the-item')
        ->and(fn () => RegistrySource::assertDependenciesAreValid([$item]))
        ->toThrow(RuntimeException::class, trim(json_encode($name, JSON_UNESCAPED_SLASHES), '"'));
})->with('invalid names');

it('rejects a name longer than npm allows', function () {
    expect(RegistrySource::isValidPackageName(str_repeat('a', 214)))->toBeTrue()
        ->and(RegistrySource::isValidPackageName(str_repeat('a', 215)))->toBeFalse();
});

it('accepts every shape of real package name', function (string $name) {
    expect(RegistrySource::isValidPackageName($name))->toBeTrue();
})->with(['react', 'lodash.debounce', 'string-width', 'a_b', '@xyflow/react', '@particle-academy/react-fancy', 'echarts-gl', '@a/b~c']);

/*
 * Run through `scanLive`, not the guard alone: a guard nothing calls looks exactly
 * like a guard that found nothing. The hand-authored catalog-fms block is the one
 * item read from this app's own tree, so a temporary base path can feed it a
 * fixture without any sibling repo.
 */
it('makes a registry build fail when an item imports something that is not a package', function () {
    $original = base_path();
    $root = storage_path('framework/testing/registry-extraction-'.uniqid());
    File::ensureDirectoryExists($root.'/resources/js/components/fancy/catalog-fms');
    File::put($root.'/resources/js/components/fancy/catalog-fms/Bad.tsx', "import x from 'Not A Package';\n");

    app()->setBasePath($root);

    try {
        expect(fn () => (new RegistrySource)->scanLive())
            ->toThrow(RuntimeException::class, 'catalog-fms');
    } finally {
        app()->setBasePath($original);
        File::deleteDirectory($root);
    }
});

/*
 * Over the file `fancy-cli add` and the MCP actually serve. Ungrouped on purpose:
 * production reads this artifact and never the scanner, and it is committed, so
 * this needs no sibling repo and runs on every push.
 */
it('commits only valid package names as dependencies', function () {
    $artifact = json_decode((string) file_get_contents(resource_path('registry/registry.json')), true);
    $items = $artifact['items'] ?? [];

    // The vacuity guard: an artifact with nothing in it has no invalid names.
    $withDeps = array_filter($items, fn (array $item): bool => ($item['dependencies'] ?? []) !== []);
    expect(count($items))->toBeGreaterThan(300)
        ->and(count($withDeps))->toBeGreaterThan(100);

    $invalid = [];
    foreach ($items as $item) {
        foreach ($item['dependencies'] ?? [] as $dependency) {
            if (! RegistrySource::isValidPackageName((string) $dependency)) {
                $invalid[] = $item['name'].' => '.json_encode($dependency);
            }
        }
    }

    expect($invalid)->toBe([]);
});

it('keeps the real dependencies of the items that used to carry fragments', function (string $item, array $expected) {
    $artifact = json_decode((string) file_get_contents(resource_path('registry/registry.json')), true);
    $row = collect($artifact['items'])->firstWhere('name', $item);

    expect($row)->not->toBeNull()
        ->and($row['dependencies'])->toContain(...$expected);
})->with([
    ['flow-editor', ['@xyflow/react']],
    ['flow-viewer', ['@xyflow/react']],
    ['job-posting-form', ['@particle-academy/react-fancy']],
    ['shared-whiteboard', ['@particle-academy/fancy-whiteboard']],
]);
