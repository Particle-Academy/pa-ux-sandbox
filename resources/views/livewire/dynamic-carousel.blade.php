{{--
    Dynamic Carousel Demo: Demonstrates dynamic slides and headless wizard mode.
    
    This component showcases:
    1. Dynamic slides using wire:model with data prop
    2. Prepending/appending and removing first/last slides
    3. Headless wizard mode with TRUE BRANCHING for agentic workflows
    4. Non-linear navigation - agent can jump to any step in any order
--}}
<div class="space-y-8">
    {{-- Section 1: Dynamic Slides with wire:model --}}
    <div>
        <flux:heading size="sm">Dynamic Slides (wire:model)</flux:heading>
        <flux:text class="mt-1 mb-4">
            Uses <code class="text-xs bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">:data="$slides"</code> prop. 
            Prepend, append, or remove slides without resetting position.
        </flux:text>
        
        {{-- Controls --}}
        <div class="flex flex-wrap gap-2 mb-4">
            <div class="flex gap-1">
                <flux:button wire:click="prependSlide" variant="primary" size="sm">
                    <flux:icon.chevron-double-left class="size-4 mr-1" />
                    Prepend
                </flux:button>
                <flux:button wire:click="appendSlide" variant="primary" size="sm">
                    Append
                    <flux:icon.chevron-double-right class="size-4 ml-1" />
                </flux:button>
            </div>
            <div class="flex gap-1">
                <flux:button wire:click="removeFirstSlide" variant="ghost" size="sm" :disabled="count($slides) <= 1">
                    <flux:icon.x-mark class="size-4 mr-1" />
                    Remove First
                </flux:button>
                <flux:button wire:click="removeLastSlide" variant="ghost" size="sm" :disabled="count($slides) <= 1">
                    Remove Last
                    <flux:icon.x-mark class="size-4 ml-1" />
                </flux:button>
            </div>
            <flux:badge>{{ count($slides) }} slides</flux:badge>
        </div>
        
        {{-- Data-driven carousel with custom rendering via slot --}}
        {{-- Note: For simple cases, just use :data="$slides" and the component renders everything --}}
        {{-- Here we use slots because we want custom gradient backgrounds based on color --}}
        <flux:carousel name="dynamic-carousel" :autoplay="false" :loop="true" class="max-w-xl">
            <flux:carousel.panels>
                @foreach($slides as $slide)
                    <flux:carousel.panel :name="$slide['name']" :label="$slide['label']" wire:key="slide-{{ $slide['name'] }}">
                        <div class="flex items-center justify-center h-48 rounded-xl text-white bg-gradient-to-br 
                            @switch($slide['color'])
                                @case('blue') from-blue-500 to-blue-600 @break
                                @case('purple') from-purple-500 to-purple-600 @break
                                @case('green') from-green-500 to-green-600 @break
                                @case('orange') from-orange-500 to-orange-600 @break
                                @case('pink') from-pink-500 to-pink-600 @break
                                @case('cyan') from-cyan-500 to-cyan-600 @break
                                @case('amber') from-amber-500 to-amber-600 @break
                                @case('rose') from-rose-500 to-rose-600 @break
                                @case('indigo') from-indigo-500 to-indigo-600 @break
                                @case('teal') from-teal-500 to-teal-600 @break
                                @default from-zinc-500 to-zinc-600
                            @endswitch
                        ">
                            <div class="text-center px-4">
                                <flux:heading size="lg" class="text-white!">{{ $slide['label'] }}</flux:heading>
                                <flux:text class="text-white/80 mt-2">{{ $slide['description'] }}</flux:text>
                                <flux:badge class="mt-3" variant="outline">{{ $slide['name'] }}</flux:badge>
                            </div>
                        </div>
                    </flux:carousel.panel>
                @endforeach
            </flux:carousel.panels>
            
            <flux:carousel.controls position="overlay" />
            
            <flux:carousel.tabs>
                @foreach($slides as $slide)
                    <flux:carousel.step :name="$slide['name']" wire:key="step-{{ $slide['name'] }}" />
                @endforeach
            </flux:carousel.tabs>
        </flux:carousel>
        
        {{-- Show the data structure --}}
        <details class="mt-4">
            <summary class="text-sm text-zinc-500 cursor-pointer hover:text-zinc-700 dark:hover:text-zinc-300">
                View slide data structure
            </summary>
            <pre class="mt-2 p-3 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-xs overflow-x-auto"><code>{{ json_encode($slides, JSON_PRETTY_PRINT) }}</code></pre>
        </details>
    </div>

    <flux:separator />

    {{-- Section 2: Headless Wizard with BRANCHING Logic --}}
    <div>
        <flux:heading size="sm">Headless Agent Workflow</flux:heading>
        <flux:text class="mt-1 mb-4">
            The agent can jump to <strong>any step in any order</strong>. Click the step buttons to simulate non-linear navigation,
            or use the workflow presets to see different paths through the same steps.
        </flux:text>
        
        <div class="grid grid-cols-1 xl:grid-cols-12 gap-6">
            {{-- Left Column: Controls --}}
            <div class="xl:col-span-4 space-y-4">
                {{-- Step Buttons - Agent can jump to ANY step --}}
                <flux:card class="p-4">
                    <flux:heading size="xs" class="mb-3">Jump to Any Step</flux:heading>
                    <div class="grid grid-cols-2 gap-2">
                        @foreach($allSteps as $stepId => $step)
                            <button 
                                wire:click="goToStep('{{ $stepId }}')"
                                class="flex items-center gap-2 p-2 rounded-lg text-left text-sm transition-all
                                    {{ in_array($stepId, $stepHistory) 
                                        ? 'bg-'.$step['color'].'-100 dark:bg-'.$step['color'].'-900/30 border-'.$step['color'].'-300 dark:border-'.$step['color'].'-700 border' 
                                        : 'bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700' }}"
                            >
                                @switch($step['icon'])
                                    @case('sparkles')
                                        <flux:icon.sparkles class="size-4 text-{{ $step['color'] }}-500" />
                                        @break
                                    @case('magnifying-glass')
                                        <flux:icon.magnifying-glass class="size-4 text-{{ $step['color'] }}-500" />
                                        @break
                                    @case('document-text')
                                        <flux:icon.document-text class="size-4 text-{{ $step['color'] }}-500" />
                                        @break
                                    @case('clipboard-document-list')
                                        <flux:icon.clipboard-document-list class="size-4 text-{{ $step['color'] }}-500" />
                                        @break
                                    @case('pencil-square')
                                        <flux:icon.pencil-square class="size-4 text-{{ $step['color'] }}-500" />
                                        @break
                                    @case('play')
                                        <flux:icon.play class="size-4 text-{{ $step['color'] }}-500" />
                                        @break
                                    @case('eye')
                                        <flux:icon.eye class="size-4 text-{{ $step['color'] }}-500" />
                                        @break
                                    @case('check-badge')
                                        <flux:icon.check-badge class="size-4 text-{{ $step['color'] }}-500" />
                                        @break
                                @endswitch
                                <span class="truncate">{{ $step['title'] }}</span>
                            </button>
                        @endforeach
                    </div>
                </flux:card>

                {{-- Workflow Presets --}}
                <flux:card class="p-4">
                    <flux:heading size="xs" class="mb-3">Workflow Presets</flux:heading>
                    <div class="space-y-2">
                        <button wire:click="runWorkflow('linear')" class="w-full text-left p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-sm">
                            <strong>Linear</strong>: analyze → search → read → plan → edit → test → complete
                        </button>
                        <button wire:click="runWorkflow('quick')" class="w-full text-left p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-sm">
                            <strong>Quick Fix</strong>: analyze → edit → complete
                        </button>
                        <button wire:click="runWorkflow('iterative')" class="w-full text-left p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-sm">
                            <strong>Iterative</strong>: analyze → search → read → edit → test → read → edit → test → complete
                        </button>
                        <button wire:click="runWorkflow('debug')" class="w-full text-left p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-sm">
                            <strong>Debug</strong>: analyze → read → test → edit → test → review → complete
                        </button>
                    </div>
                    
                    @if(session('pending_workflow'))
                        <div class="mt-3 flex gap-2">
                            <flux:button wire:click="continueWorkflow" variant="primary" size="sm" class="flex-1">
                                Continue Workflow
                            </flux:button>
                            <flux:button wire:click="resetAgentWorkflow" variant="ghost" size="sm">
                                Reset
                            </flux:button>
                        </div>
                    @endif
                </flux:card>

                {{-- Path Taken --}}
                <flux:card class="p-4">
                    <flux:heading size="xs" class="mb-3">Path Taken ({{ count($stepHistory) }} steps)</flux:heading>
                    <div class="flex flex-wrap gap-1">
                        @foreach($stepHistory as $index => $stepId)
                            @php $step = $allSteps[$stepId]; @endphp
                            <span class="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-{{ $step['color'] }}-100 dark:bg-{{ $step['color'] }}-900/30 text-{{ $step['color'] }}-700 dark:text-{{ $step['color'] }}-300">
                                {{ $index + 1 }}. {{ $step['title'] }}
                            </span>
                        @endforeach
                    </div>
                    @if(count($stepHistory) > 1)
                        <flux:button wire:click="resetAgentWorkflow" variant="ghost" size="xs" class="mt-3">
                            Reset Workflow
                        </flux:button>
                    @endif
                </flux:card>
            </div>

            {{-- Right Column: Headless Carousel --}}
            <div class="xl:col-span-8">
                <flux:carousel 
                    variant="wizard" 
                    :loop="false" 
                    :headless="true"
                    name="agent-wizard"
                >
                    {{-- Hidden steps (variant inherited from parent) --}}
                    <flux:carousel.tabs :headless="true">
                        @foreach($stepHistory as $index => $stepId)
                            @php $step = $allSteps[$stepId]; @endphp
                            <flux:carousel.tab name="step-{{ $index }}-{{ $stepId }}" :label="$step['title']" wire:key="wizard-step-{{ $index }}-{{ $stepId }}" />
                        @endforeach
                    </flux:carousel.tabs>
                    
                    <flux:carousel.panels>
                        @foreach($stepHistory as $index => $stepId)
                            @php $step = $allSteps[$stepId]; @endphp
                            <flux:carousel.panel name="step-{{ $index }}-{{ $stepId }}" :label="$step['title']" wire:key="wizard-panel-{{ $index }}-{{ $stepId }}">
                                <div class="p-6 min-h-[300px]">
                                    {{-- Step Header --}}
                                    <div class="flex items-center gap-3 mb-4">
                                        <div class="flex items-center justify-center size-10 rounded-full bg-{{ $step['color'] }}-100 dark:bg-{{ $step['color'] }}-900/30">
                                            @switch($step['icon'])
                                                @case('sparkles')
                                                    <flux:icon.sparkles class="size-5 text-{{ $step['color'] }}-500" />
                                                    @break
                                                @case('magnifying-glass')
                                                    <flux:icon.magnifying-glass class="size-5 text-{{ $step['color'] }}-500" />
                                                    @break
                                                @case('document-text')
                                                    <flux:icon.document-text class="size-5 text-{{ $step['color'] }}-500" />
                                                    @break
                                                @case('clipboard-document-list')
                                                    <flux:icon.clipboard-document-list class="size-5 text-{{ $step['color'] }}-500" />
                                                    @break
                                                @case('pencil-square')
                                                    <flux:icon.pencil-square class="size-5 text-{{ $step['color'] }}-500" />
                                                    @break
                                                @case('play')
                                                    <flux:icon.play class="size-5 text-{{ $step['color'] }}-500" />
                                                    @break
                                                @case('eye')
                                                    <flux:icon.eye class="size-5 text-{{ $step['color'] }}-500" />
                                                    @break
                                                @case('check-badge')
                                                    <flux:icon.check-badge class="size-5 text-{{ $step['color'] }}-500" />
                                                    @break
                                            @endswitch
                                        </div>
                                        <div>
                                            <flux:heading size="lg">{{ $step['title'] }}</flux:heading>
                                            <flux:text class="text-sm text-zinc-500">{{ $step['description'] }}</flux:text>
                                        </div>
                                    </div>

                                    {{-- Dynamic Content Based on Step Type --}}
                                    @switch($stepId)
                                        @case('analyze')
                                            <div class="space-y-3">
                                                <flux:text>Understanding your request and determining the best approach...</flux:text>
                                                <div class="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                                    <flux:text class="text-sm">
                                                        <strong>Request Analysis:</strong><br>
                                                        The agent will analyze the task requirements and decide which steps to take.
                                                        This could be a quick fix, a thorough investigation, or an iterative approach.
                                                    </flux:text>
                                                </div>
                                            </div>
                                            @break

                                        @case('search')
                                            <div class="space-y-3">
                                                <flux:text>Searching the codebase for relevant files...</flux:text>
                                                @if(!empty($contextData['files_found']))
                                                    <div class="space-y-2">
                                                        @foreach($contextData['files_found'] as $file)
                                                            <div class="flex items-center gap-2 p-2 bg-zinc-100 dark:bg-zinc-800 rounded">
                                                                <flux:icon.document class="size-4 text-zinc-500" />
                                                                <code class="text-sm">{{ $file }}</code>
                                                            </div>
                                                        @endforeach
                                                    </div>
                                                @endif
                                            </div>
                                            @break

                                        @case('read')
                                            <div class="space-y-3">
                                                <flux:text>Reading and analyzing file contents...</flux:text>
                                                @if(!empty($contextData['files_read']))
                                                    <div class="space-y-2">
                                                        @foreach($contextData['files_read'] as $read)
                                                            <div class="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                                                                <div class="flex justify-between items-center">
                                                                    <code class="text-sm font-medium">{{ $read['file'] }}</code>
                                                                    <span class="text-xs text-zinc-500">{{ $read['time'] }}</span>
                                                                </div>
                                                                <flux:text class="text-sm mt-1">Read {{ $read['lines'] }} lines</flux:text>
                                                            </div>
                                                        @endforeach
                                                    </div>
                                                @endif
                                            </div>
                                            @break

                                        @case('plan')
                                            <div class="space-y-3">
                                                <flux:text>Creating an execution plan based on analysis...</flux:text>
                                                <div class="p-4 bg-cyan-50 dark:bg-cyan-900/20 rounded-lg">
                                                    <ol class="list-decimal list-inside space-y-2 text-sm">
                                                        <li>Review existing implementation</li>
                                                        <li>Identify required changes</li>
                                                        <li>Implement modifications</li>
                                                        <li>Run tests to verify</li>
                                                        <li>Review and finalize</li>
                                                    </ol>
                                                </div>
                                            </div>
                                            @break

                                        @case('edit')
                                            <div class="space-y-3">
                                                <flux:text>Making changes to the codebase...</flux:text>
                                                @if(!empty($contextData['changes_made']))
                                                    <div class="space-y-2">
                                                        @foreach($contextData['changes_made'] as $change)
                                                            <div class="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                                                                <div class="flex justify-between items-center">
                                                                    <code class="text-sm font-medium">{{ $change['file'] }}</code>
                                                                    <span class="text-xs font-mono text-green-600 dark:text-green-400">{{ $change['lines'] }}</span>
                                                                </div>
                                                                <flux:text class="text-sm mt-1">{{ $change['action'] }}</flux:text>
                                                            </div>
                                                        @endforeach
                                                    </div>
                                                @endif
                                            </div>
                                            @break

                                        @case('test')
                                            <div class="space-y-3">
                                                <flux:text>Running tests to verify changes...</flux:text>
                                                @if(!empty($contextData['tests_run']))
                                                    <div class="space-y-2">
                                                        @foreach($contextData['tests_run'] as $test)
                                                            <div class="p-3 rounded-lg {{ $test['status'] === 'passed' ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-red-50 dark:bg-red-900/20' }}">
                                                                <div class="flex justify-between items-center">
                                                                    <code class="text-sm font-medium">{{ $test['name'] }}</code>
                                                                    <span class="text-xs {{ $test['status'] === 'passed' ? 'text-emerald-600' : 'text-red-600' }}">
                                                                        {{ strtoupper($test['status']) }} ({{ $test['time'] }})
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        @endforeach
                                                    </div>
                                                @endif
                                            </div>
                                            @break

                                        @case('review')
                                            <div class="space-y-3">
                                                <flux:text>Reviewing all changes made during this session...</flux:text>
                                                <div class="p-4 bg-pink-50 dark:bg-pink-900/20 rounded-lg">
                                                    <div class="grid grid-cols-2 gap-4 text-sm">
                                                        <div>
                                                            <strong>Files Found:</strong> {{ count($contextData['files_found']) }}
                                                        </div>
                                                        <div>
                                                            <strong>Files Read:</strong> {{ count($contextData['files_read']) }}
                                                        </div>
                                                        <div>
                                                            <strong>Changes Made:</strong> {{ count($contextData['changes_made']) }}
                                                        </div>
                                                        <div>
                                                            <strong>Tests Run:</strong> {{ count($contextData['tests_run']) }}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            @break

                                        @case('complete')
                                            <div class="space-y-3">
                                                <div class="p-6 bg-green-50 dark:bg-green-900/20 rounded-lg text-center">
                                                    <flux:icon.check-badge class="size-12 text-green-500 mx-auto mb-3" />
                                                    <flux:heading size="md">Task Complete!</flux:heading>
                                                    <flux:text class="mt-2">
                                                        Completed in {{ count($stepHistory) }} steps.
                                                    </flux:text>
                                                </div>
                                            </div>
                                            @break

                                        @default
                                            <flux:text>Processing step: {{ $stepId }}</flux:text>
                                    @endswitch
                                </div>
                            </flux:carousel.panel>
                        @endforeach
                    </flux:carousel.panels>
                </flux:carousel>
            </div>
        </div>
    </div>
</div>
