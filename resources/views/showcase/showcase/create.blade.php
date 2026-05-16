@extends('layouts.showcase', ['title' => 'Submit · Designer Showcase'])

@section('content')
    <flux:breadcrumbs>
        <flux:breadcrumbs.item href="{{ route('showcase.showcase.index') }}">Showcase</flux:breadcrumbs.item>
        <flux:breadcrumbs.item>Submit</flux:breadcrumbs.item>
    </flux:breadcrumbs>

    <flux:heading size="xl" level="1" class="mt-3">Submit a site or repo</flux:heading>
    <flux:text class="mt-2 max-w-2xl">
        We'll fetch your URL and check for Fancy UI usage before listing it on the showcase.
    </flux:text>

    <flux:card class="mt-6 max-w-xl">
        <flux:card.body>
            <form method="POST" action="{{ route('showcase.showcase.store') }}" class="space-y-4">
                @csrf
                <flux:field>
                    <flux:label>Kind</flux:label>
                    <flux:radio.group name="kind" value="website">
                        <flux:radio value="website" label="Website" />
                        <flux:radio value="repo" label="Repo" />
                    </flux:radio.group>
                </flux:field>

                <flux:field>
                    <flux:label>URL</flux:label>
                    <flux:input
                        name="url"
                        type="url"
                        required
                        maxlength="255"
                        placeholder="https://your-site.com or https://github.com/you/your-app"
                    />
                    <flux:error name="url" />
                </flux:field>

                <flux:field>
                    <flux:label>Title <flux:badge size="sm" color="zinc">optional</flux:badge></flux:label>
                    <flux:input name="title" maxlength="120" />
                </flux:field>

                <flux:field>
                    <flux:label>Description <flux:badge size="sm" color="zinc">optional</flux:badge></flux:label>
                    <flux:textarea name="description" rows="3" maxlength="600" />
                </flux:field>

                <div class="flex items-center justify-end gap-2 pt-2">
                    <flux:action href="{{ route('showcase.showcase.index') }}" variant="default">Cancel</flux:action>
                    <flux:action type="submit" color="violet">Submit for review</flux:action>
                </div>
            </form>
        </flux:card.body>
    </flux:card>
@endsection
