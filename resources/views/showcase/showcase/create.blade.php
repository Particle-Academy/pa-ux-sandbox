@extends('layouts.showcase', ['title' => 'Submit · Designer Showcase'])

@section('content')
    <h1 class="text-3xl font-semibold tracking-tight">Submit a site or repo</h1>
    <p class="mt-2 max-w-2xl text-sm" style="color: var(--fg-2);">
        We'll fetch your URL and check for Fancy UI usage before listing it on the showcase.
    </p>

    <form method="POST" action="{{ route('showcase.showcase.store') }}" class="mt-6 max-w-xl space-y-4 fancy-card p-6">
        @csrf

        <div>
            <label class="block text-xs font-semibold uppercase tracking-wider" style="color: var(--fg-3);">Kind</label>
            <div class="mt-1 inline-flex overflow-hidden rounded-md border" style="border-color: var(--border-1);">
                <label class="cursor-pointer px-3 py-1.5 text-xs">
                    <input type="radio" name="kind" value="website" checked class="mr-1 accent-violet-600"> Website
                </label>
                <label class="cursor-pointer border-l px-3 py-1.5 text-xs" style="border-color: var(--border-1);">
                    <input type="radio" name="kind" value="repo" class="mr-1 accent-violet-600"> Repo
                </label>
            </div>
        </div>

        <div>
            <label class="block text-xs font-semibold uppercase tracking-wider" style="color: var(--fg-3);">URL</label>
            <input type="url" name="url" required maxlength="255"
                   placeholder="https://your-site.com or https://github.com/you/your-app"
                   class="mt-1 w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none focus:border-[color:var(--violet-500)]"
                   style="border-color: var(--border-1); color: var(--fg-1);">
            @error('url')<div class="mt-1 text-xs" style="color: var(--red-600);">{{ $message }}</div>@enderror
        </div>

        <div>
            <label class="block text-xs font-semibold uppercase tracking-wider" style="color: var(--fg-3);">Title <span class="font-normal" style="color: var(--fg-4);">(optional)</span></label>
            <input type="text" name="title" maxlength="120"
                   class="mt-1 w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none focus:border-[color:var(--violet-500)]"
                   style="border-color: var(--border-1); color: var(--fg-1);">
        </div>

        <div>
            <label class="block text-xs font-semibold uppercase tracking-wider" style="color: var(--fg-3);">Description <span class="font-normal" style="color: var(--fg-4);">(optional)</span></label>
            <textarea name="description" rows="3" maxlength="600"
                      class="mt-1 w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none focus:border-[color:var(--violet-500)]"
                      style="border-color: var(--border-1); color: var(--fg-1);"></textarea>
        </div>

        <div class="flex items-center justify-end gap-2">
            <a href="{{ route('showcase.showcase.index') }}" class="rounded-md px-3 py-2 text-sm" style="color: var(--fg-3);">Cancel</a>
            <button type="submit" class="rounded-md px-3 py-2 text-sm font-medium text-white" style="background: var(--violet-600);">
                Submit for review
            </button>
        </div>
    </form>
@endsection
