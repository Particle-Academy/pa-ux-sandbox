@extends('layouts.app')

@section('title', 'UX Demo Hub')

@section('content')
<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">UX Demo Hub</h1>
    <p class="text-gray-500 dark:text-gray-400 mb-8">
        Interactive demos for two component libraries — same design language, different frameworks.
    </p>

    {{-- @particle-academy/react-fancy --}}
    <section class="mb-10">
        <div class="flex items-center gap-3 mb-4">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white">@particle-academy/react-fancy</h2>
            <span class="inline-block rounded-full bg-blue-100 dark:bg-blue-900/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-300">React</span>
        </div>
        <div class="grid grid-cols-2 gap-4 lg:grid-cols-3">
            @php
                $reactDemos = [
                    // Phase 1: Components
                    ['name' => 'Action', 'slug' => 'action', 'desc' => 'Buttons, links, and interactive action elements', 'counterpart' => true],
                    ['name' => 'Carousel', 'slug' => 'carousel', 'desc' => 'Compound carousel with slides, controls, and steps', 'counterpart' => true],
                    ['name' => 'ColorPicker', 'slug' => 'color-picker', 'desc' => 'HSL color picker with swatches and input', 'counterpart' => true],
                    ['name' => 'Emoji', 'slug' => 'emoji', 'desc' => 'Render emojis by name with size variants', 'counterpart' => false],
                    ['name' => 'EmojiSelect', 'slug' => 'emoji-select', 'desc' => 'Searchable emoji picker with categories', 'counterpart' => true],
                    ['name' => 'Table', 'slug' => 'table', 'desc' => 'Data table with sorting, pagination, and search', 'counterpart' => false],
                    // Display
                    ['name' => 'Heading', 'slug' => 'heading', 'desc' => 'Heading component with size and weight variants', 'counterpart' => false],
                    ['name' => 'Text', 'slug' => 'text', 'desc' => 'Text component with color, size, and alignment options', 'counterpart' => false],
                    ['name' => 'Separator', 'slug' => 'separator', 'desc' => 'Horizontal and vertical separator/divider lines', 'counterpart' => false],
                    ['name' => 'Badge', 'slug' => 'badge', 'desc' => 'Status badges with solid, outline, and soft variants', 'counterpart' => false],
                    ['name' => 'Icon', 'slug' => 'icon', 'desc' => 'Icon wrapper with size and color support', 'counterpart' => false],
                    ['name' => 'Avatar', 'slug' => 'avatar', 'desc' => 'User avatar with image, initials, and status indicator', 'counterpart' => false],
                    ['name' => 'Skeleton', 'slug' => 'skeleton', 'desc' => 'Loading placeholder with pulse animation', 'counterpart' => false],
                    ['name' => 'Progress', 'slug' => 'progress', 'desc' => 'Progress bars and circular progress indicators', 'counterpart' => false],
                    ['name' => 'Brand', 'slug' => 'brand', 'desc' => 'Brand logo with name and tagline', 'counterpart' => false],
                    ['name' => 'Profile', 'slug' => 'profile', 'desc' => 'User profile card with avatar and details', 'counterpart' => false],
                    ['name' => 'Card', 'slug' => 'card', 'desc' => 'Card container with header, body, and footer', 'counterpart' => false],
                    ['name' => 'Callout', 'slug' => 'callout', 'desc' => 'Callout/alert banners with color variants', 'counterpart' => false],
                    ['name' => 'Timeline', 'slug' => 'timeline', 'desc' => 'Vertical timeline with items and connectors', 'counterpart' => false],
                    // Overlay
                    ['name' => 'Tooltip', 'slug' => 'tooltip', 'desc' => 'Hover tooltips with placement options', 'counterpart' => false],
                    ['name' => 'Popover', 'slug' => 'popover', 'desc' => 'Click-triggered popover with floating content', 'counterpart' => false],
                    ['name' => 'Dropdown', 'slug' => 'dropdown', 'desc' => 'Dropdown menu with items and keyboard navigation', 'counterpart' => false],
                    ['name' => 'ContextMenu', 'slug' => 'context-menu', 'desc' => 'Right-click context menu with nested items', 'counterpart' => false],
                    ['name' => 'Modal', 'slug' => 'modal', 'desc' => 'Modal dialog with header, body, and footer', 'counterpart' => false],
                    ['name' => 'Toast', 'slug' => 'toast', 'desc' => 'Toast notifications with variants and auto-dismiss', 'counterpart' => false],
                    ['name' => 'Command', 'slug' => 'command', 'desc' => 'Command palette with search and keyboard shortcuts', 'counterpart' => false],
                    // Navigation
                    ['name' => 'Tabs', 'slug' => 'tabs', 'desc' => 'Tab panels with underline, pills, and boxed variants', 'counterpart' => false],
                    ['name' => 'Accordion', 'slug' => 'accordion', 'desc' => 'Collapsible accordion panels', 'counterpart' => false],
                    ['name' => 'Breadcrumbs', 'slug' => 'breadcrumbs', 'desc' => 'Breadcrumb navigation with separator options', 'counterpart' => false],
                    ['name' => 'Navbar', 'slug' => 'navbar', 'desc' => 'Top navigation bar with responsive layout', 'counterpart' => false],
                    ['name' => 'Pagination', 'slug' => 'pagination', 'desc' => 'Page navigation with numbered buttons', 'counterpart' => false],
                    // Basic Inputs
                    ['name' => 'Input', 'slug' => 'input', 'desc' => 'Text input with sizes, leading/trailing, and validation states', 'counterpart' => false],
                    ['name' => 'Select', 'slug' => 'select', 'desc' => 'Dropdown select with option groups', 'counterpart' => false],
                    ['name' => 'Textarea', 'slug' => 'textarea', 'desc' => 'Multi-line text input with auto-resize', 'counterpart' => false],
                    ['name' => 'Checkbox', 'slug' => 'checkbox', 'desc' => 'Checkbox and checkbox group with indeterminate state', 'counterpart' => false],
                    ['name' => 'RadioGroup', 'slug' => 'radio-group', 'desc' => 'Radio button group for single selection', 'counterpart' => false],
                    ['name' => 'Switch', 'slug' => 'switch', 'desc' => 'Toggle switch with 18 color options', 'counterpart' => false],
                    ['name' => 'Slider', 'slug' => 'slider', 'desc' => 'Single and range slider with marks and labels', 'counterpart' => false],
                    ['name' => 'DatePicker', 'slug' => 'date-picker', 'desc' => 'Date and date-range picker with optional time', 'counterpart' => false],
                    ['name' => 'MultiSwitch', 'slug' => 'multi-switch', 'desc' => 'Segmented toggle between multiple options', 'counterpart' => false],
                    // Advanced Inputs
                    ['name' => 'Autocomplete', 'slug' => 'autocomplete', 'desc' => 'Searchable autocomplete with keyboard navigation', 'counterpart' => false],
                    ['name' => 'Pillbox', 'slug' => 'pillbox', 'desc' => 'Multi-value tag/pill input with autocomplete', 'counterpart' => false],
                    ['name' => 'OtpInput', 'slug' => 'otp-input', 'desc' => 'One-time password input with digit boxes', 'counterpart' => false],
                    ['name' => 'FileUpload', 'slug' => 'file-upload', 'desc' => 'Drag-and-drop file upload with preview', 'counterpart' => false],
                    ['name' => 'TimePicker', 'slug' => 'time-picker', 'desc' => 'Time input with hour/minute selection', 'counterpart' => false],
                    ['name' => 'Calendar', 'slug' => 'calendar', 'desc' => 'Date calendar with range and multi-select support', 'counterpart' => false],
                    // Rich Content
                    ['name' => 'Composer', 'slug' => 'composer', 'desc' => 'Rich text composer with toolbar and emoji support', 'counterpart' => false],
                    ['name' => 'Chart', 'slug' => 'chart', 'desc' => 'Chart components: bar, line, pie, donut, sparkline', 'counterpart' => false],
                    ['name' => 'Editor', 'slug' => 'editor', 'desc' => 'Markdown editor with preview and toolbar', 'counterpart' => false],
                    ['name' => 'Kanban', 'slug' => 'kanban', 'desc' => 'Kanban board with draggable cards and columns', 'counterpart' => false],
                    ['name' => 'Canvas', 'slug' => 'canvas', 'desc' => 'Interactive drawing canvas with tools', 'counterpart' => false],
                    ['name' => 'Diagram', 'slug' => 'diagram', 'desc' => 'Node-based diagram editor with connections', 'counterpart' => false],
                    // Menus & Navigation
                    ['name' => 'Menu', 'slug' => 'menu', 'desc' => 'Hierarchical menu with nested items', 'counterpart' => false],
                    ['name' => 'Sidebar', 'slug' => 'sidebar', 'desc' => 'Collapsible sidebar navigation', 'counterpart' => false],
                    ['name' => 'MobileMenu', 'slug' => 'mobile-menu', 'desc' => 'Responsive mobile navigation menu', 'counterpart' => false],
                    // Patterns
                    ['name' => 'Wizard Form', 'slug' => 'wizard', 'desc' => 'Multi-step form wizard built on Carousel', 'counterpart' => true],
                    ['name' => 'Nested Carousel', 'slug' => 'nested-carousel', 'desc' => 'Independent carousels nested inside each other', 'counterpart' => true],
                    ['name' => 'Dynamic Carousel', 'slug' => 'dynamic-carousel', 'desc' => 'Add and remove slides dynamically at runtime', 'counterpart' => true],
                    // Kitchen Sink
                    ['name' => 'Kitchen Sink', 'slug' => 'kitchen-sink', 'desc' => 'All components on a single page', 'counterpart' => false],
                ];
            @endphp
            @foreach($reactDemos as $demo)
                <a href="/react-demos/{{ $demo['slug'] }}" class="rounded-xl border border-gray-200 dark:border-gray-700 p-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <div class="flex items-start justify-between gap-2">
                        <h3 class="font-medium text-gray-900 dark:text-white">{{ $demo['name'] }}</h3>
                        <div class="flex shrink-0 gap-1">
                            <span class="inline-block rounded-full bg-blue-100 dark:bg-blue-900/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-300">React</span>
                            @if($demo['counterpart'])
                                <span class="inline-block rounded-full bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">LW</span>
                            @endif
                        </div>
                    </div>
                    <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ $demo['desc'] }}</p>
                </a>
            @endforeach
        </div>
    </section>

    {{-- @particle-academy/react-echarts --}}
    <section class="mb-10">
        <div class="flex items-center gap-3 mb-4">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white">@particle-academy/react-echarts</h2>
            <span class="inline-block rounded-full bg-emerald-100 dark:bg-emerald-900/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">React</span>
        </div>
        <div class="grid grid-cols-2 gap-4 lg:grid-cols-3">
            @php
                $echartsDemos = [
                    ['name' => 'Line', 'slug' => 'echarts-line', 'desc' => 'Line charts: basic, smooth, multi-series, stacked area'],
                    ['name' => 'Bar', 'slug' => 'echarts-bar', 'desc' => 'Bar charts: vertical, horizontal, stacked, with data zoom'],
                    ['name' => 'Pie', 'slug' => 'echarts-pie', 'desc' => 'Pie, doughnut, rose, and nested pie charts'],
                    ['name' => 'Scatter', 'slug' => 'echarts-scatter', 'desc' => 'Scatter plots and bubble charts'],
                    ['name' => 'Radar', 'slug' => 'echarts-radar', 'desc' => 'Radar/spider charts with filled and multi-series variants'],
                    ['name' => 'Heatmap', 'slug' => 'echarts-heatmap', 'desc' => 'Activity heatmaps with gradient color scales'],
                    ['name' => 'Candlestick', 'slug' => 'echarts-candlestick', 'desc' => 'OHLC candlestick charts for financial data'],
                    ['name' => 'Boxplot', 'slug' => 'echarts-boxplot', 'desc' => 'Box-and-whisker statistical charts'],
                    ['name' => 'Treemap', 'slug' => 'echarts-treemap', 'desc' => 'Hierarchical data as nested rectangles'],
                    ['name' => 'Sunburst', 'slug' => 'echarts-sunburst', 'desc' => 'Sunburst charts for hierarchical data'],
                    ['name' => 'Funnel', 'slug' => 'echarts-funnel', 'desc' => 'Funnel charts for conversion data'],
                    ['name' => 'Gauge', 'slug' => 'echarts-gauge', 'desc' => 'Gauge charts with gradient and multi-gauge layouts'],
                    ['name' => 'Sankey', 'slug' => 'echarts-sankey', 'desc' => 'Sankey flow diagrams with vertical and horizontal orientations'],
                    ['name' => 'Graph', 'slug' => 'echarts-graph', 'desc' => 'Force-directed and circular network graphs'],
                    ['name' => 'Parallel', 'slug' => 'echarts-parallel', 'desc' => 'Parallel coordinate charts for multi-dimensional data'],
                    ['name' => 'Theme River', 'slug' => 'echarts-theme-river', 'desc' => 'Theme river / stream graph charts'],
                    ['name' => 'Calendar', 'slug' => 'echarts-calendar', 'desc' => 'Calendar heatmap charts'],
                    ['name' => 'Pictorial Bar', 'slug' => 'echarts-pictorial-bar', 'desc' => 'Pictorial bar charts with custom symbols'],
                    ['name' => 'Map', 'slug' => 'echarts-map', 'desc' => 'Geographic map visualizations'],
                    ['name' => 'Custom', 'slug' => 'echarts-custom', 'desc' => 'Custom series with user-defined rendering'],
                    ['name' => 'Bar 3D', 'slug' => 'echarts-bar-3d', 'desc' => '3D bar charts with echarts-gl'],
                    ['name' => 'Scatter 3D', 'slug' => 'echarts-scatter-3d', 'desc' => '3D scatter plots with echarts-gl'],
                    ['name' => 'Surface 3D', 'slug' => 'echarts-surface', 'desc' => '3D mathematical surface plots'],
                    ['name' => 'Globe 3D', 'slug' => 'echarts-globe', 'desc' => '3D globe with scatter points'],
                    ['name' => 'Graphic', 'slug' => 'echarts-graphic', 'desc' => 'Custom shapes and drawing via ECharts graphic layer'],
                ];
            @endphp
            @foreach($echartsDemos as $demo)
                <a href="/react-demos/{{ $demo['slug'] }}" class="rounded-xl border border-gray-200 dark:border-gray-700 p-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <div class="flex items-start justify-between gap-2">
                        <h3 class="font-medium text-gray-900 dark:text-white">{{ $demo['name'] }}</h3>
                        <span class="inline-block rounded-full bg-emerald-100 dark:bg-emerald-900/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">ECharts</span>
                    </div>
                    <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ $demo['desc'] }}</p>
                </a>
            @endforeach
        </div>
    </section>

    {{-- fancy-flux --}}
    <section>
        <div class="flex items-center gap-3 mb-4">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white">fancy-flux</h2>
            <span class="inline-block rounded-full bg-purple-100 dark:bg-purple-900/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-purple-700 dark:text-purple-300">Livewire</span>
        </div>
        <div class="grid grid-cols-2 gap-4 lg:grid-cols-3">
            @php
                $livewireDemos = [
                    ['name' => 'Action', 'route' => 'fancy-flux-demos.action-examples', 'desc' => 'Buttons, links, and interactive action elements', 'counterpart' => true],
                    ['name' => 'Carousel', 'route' => 'fancy-flux-demos.basic-carousel', 'desc' => 'Flux carousel with variants and autoplay', 'counterpart' => true],
                    ['name' => 'ColorPicker', 'route' => 'fancy-flux-demos.color-picker-examples', 'desc' => 'HSL color picker with Livewire binding', 'counterpart' => true],
                    ['name' => 'EmojiSelect', 'route' => 'fancy-flux-demos.emoji-select-examples', 'desc' => 'Searchable emoji picker component', 'counterpart' => true],
                    ['name' => 'Wizard Form', 'route' => 'fancy-flux-demos.wizard-form', 'desc' => 'Multi-step wizard with validation and modals', 'counterpart' => true],
                    ['name' => 'Nested Carousel', 'route' => 'fancy-flux-demos.nested-carousel', 'desc' => 'Parent-child carousels with advancement', 'counterpart' => true],
                    ['name' => 'Dynamic Carousel', 'route' => 'fancy-flux-demos.dynamic-carousel', 'desc' => 'Dynamic slides and headless agent workflow', 'counterpart' => true],
                ];
            @endphp
            @foreach($livewireDemos as $demo)
                <a href="{{ Route::has($demo['route']) ? route($demo['route']) : '#' }}" class="rounded-xl border border-gray-200 dark:border-gray-700 p-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50 {{ Route::has($demo['route']) ? '' : 'opacity-50 pointer-events-none' }}">
                    <div class="flex items-start justify-between gap-2">
                        <h3 class="font-medium text-gray-900 dark:text-white">{{ $demo['name'] }}</h3>
                        <div class="flex shrink-0 gap-1">
                            <span class="inline-block rounded-full bg-purple-100 dark:bg-purple-900/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-purple-700 dark:text-purple-300">Livewire</span>
                            @if($demo['counterpart'])
                                <span class="inline-block rounded-full bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">React</span>
                            @endif
                        </div>
                    </div>
                    <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ $demo['desc'] }}</p>
                </a>
            @endforeach
        </div>
    </section>
</div>
@endsection
