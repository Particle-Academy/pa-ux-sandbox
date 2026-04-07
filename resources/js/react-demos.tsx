import { StrictMode, lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router";
import { DemoLayout } from "./react-demos/layouts/DemoLayout";
import { Home } from "./react-demos/pages/Home";

// Lazy-load helper for named exports
const l = (loader: () => Promise<any>, name: string) =>
  lazy(() => loader().then((m: any) => ({ default: m[name] })));

// Phase 1: Components
const ActionDemo = l(() => import("./react-demos/pages/ActionDemo"), "ActionDemo");
const CarouselDemo = l(() => import("./react-demos/pages/CarouselDemo"), "CarouselDemo");
const ColorPickerDemo = l(() => import("./react-demos/pages/ColorPickerDemo"), "ColorPickerDemo");
const EmojiDemo = l(() => import("./react-demos/pages/EmojiDemo"), "EmojiDemo");
const EmojiSelectDemo = l(() => import("./react-demos/pages/EmojiSelectDemo"), "EmojiSelectDemo");
const TableDemo = l(() => import("./react-demos/pages/TableDemo"), "TableDemo");
const InputsDemo = l(() => import("./react-demos/pages/InputsDemo"), "InputsDemo");
const WizardDemo = l(() => import("./react-demos/pages/WizardDemo"), "WizardDemo");
const NestedCarouselDemo = l(() => import("./react-demos/pages/NestedCarouselDemo"), "NestedCarouselDemo");
const DynamicCarouselDemo = l(() => import("./react-demos/pages/DynamicCarouselDemo"), "DynamicCarouselDemo");
// Phase 2: Display
const HeadingDemo = l(() => import("./react-demos/pages/HeadingDemo"), "HeadingDemo");
const TextDemo = l(() => import("./react-demos/pages/TextDemo"), "TextDemo");
const SeparatorDemo = l(() => import("./react-demos/pages/SeparatorDemo"), "SeparatorDemo");
const BadgeDemo = l(() => import("./react-demos/pages/BadgeDemo"), "BadgeDemo");
const IconDemo = l(() => import("./react-demos/pages/IconDemo"), "IconDemo");
const AvatarDemo = l(() => import("./react-demos/pages/AvatarDemo"), "AvatarDemo");
const SkeletonDemo = l(() => import("./react-demos/pages/SkeletonDemo"), "SkeletonDemo");
const ProgressDemo = l(() => import("./react-demos/pages/ProgressDemo"), "ProgressDemo");
const BrandDemo = l(() => import("./react-demos/pages/BrandDemo"), "BrandDemo");
const ProfileDemo = l(() => import("./react-demos/pages/ProfileDemo"), "ProfileDemo");
const CardDemo = l(() => import("./react-demos/pages/CardDemo"), "CardDemo");
const CalloutDemo = l(() => import("./react-demos/pages/CalloutDemo"), "CalloutDemo");
const TimelineDemo = l(() => import("./react-demos/pages/TimelineDemo"), "TimelineDemo");
// Phase 3: Overlay
const TooltipDemo = l(() => import("./react-demos/pages/TooltipDemo"), "TooltipDemo");
const PopoverDemo = l(() => import("./react-demos/pages/PopoverDemo"), "PopoverDemo");
const DropdownDemo = l(() => import("./react-demos/pages/DropdownDemo"), "DropdownDemo");
const ContextMenuDemo = l(() => import("./react-demos/pages/ContextMenuDemo"), "ContextMenuDemo");
const ModalDemo = l(() => import("./react-demos/pages/ModalDemo"), "ModalDemo");
const ToastDemo = l(() => import("./react-demos/pages/ToastDemo"), "ToastDemo");
const CommandDemo = l(() => import("./react-demos/pages/CommandDemo"), "CommandDemo");
// Phase 4: Navigation
const TabsDemo = l(() => import("./react-demos/pages/TabsDemo"), "TabsDemo");
const AccordionDemo = l(() => import("./react-demos/pages/AccordionDemo"), "AccordionDemo");
const BreadcrumbsDemo = l(() => import("./react-demos/pages/BreadcrumbsDemo"), "BreadcrumbsDemo");
const NavbarDemo = l(() => import("./react-demos/pages/NavbarDemo"), "NavbarDemo");
const PaginationDemo = l(() => import("./react-demos/pages/PaginationDemo"), "PaginationDemo");
// Phase 5: Advanced Inputs
const AutocompleteDemo = l(() => import("./react-demos/pages/AutocompleteDemo"), "AutocompleteDemo");
const PillboxDemo = l(() => import("./react-demos/pages/PillboxDemo"), "PillboxDemo");
const OtpInputDemo = l(() => import("./react-demos/pages/OtpInputDemo"), "OtpInputDemo");
const FileUploadDemo = l(() => import("./react-demos/pages/FileUploadDemo"), "FileUploadDemo");
const TimePickerDemo = l(() => import("./react-demos/pages/TimePickerDemo"), "TimePickerDemo");
const CalendarDemo = l(() => import("./react-demos/pages/CalendarDemo"), "CalendarDemo");
const MultiSwitchDemo = l(() => import("./react-demos/pages/MultiSwitchDemo"), "MultiSwitchDemo");
// Phase 6: Rich Content
const ComposerDemo = l(() => import("./react-demos/pages/ComposerDemo"), "ComposerDemo");
const ChartDemo = l(() => import("./react-demos/pages/ChartDemo"), "ChartDemo");
const EditorDemo = l(() => import("./react-demos/pages/EditorDemo"), "EditorDemo");
const KanbanDemo = l(() => import("./react-demos/pages/KanbanDemo"), "KanbanDemo");
const CanvasDemo = l(() => import("./react-demos/pages/CanvasDemo"), "CanvasDemo");
const DiagramDemo = l(() => import("./react-demos/pages/DiagramDemo"), "DiagramDemo");
// Phase 7: Menus & Navigation
const MenuDemo = l(() => import("./react-demos/pages/MenuDemo"), "MenuDemo");
const SidebarDemo = l(() => import("./react-demos/pages/SidebarDemo"), "SidebarDemo");
const MobileMenuDemo = l(() => import("./react-demos/pages/MobileMenuDemo"), "MobileMenuDemo");
const KitchenSinkDemo = l(() => import("./react-demos/pages/KitchenSinkDemo"), "KitchenSinkDemo");
// Basic Inputs
const InputDemo = l(() => import("./react-demos/pages/InputDemo"), "InputDemo");
const SelectDemo = l(() => import("./react-demos/pages/SelectDemo"), "SelectDemo");
const TextareaDemo = l(() => import("./react-demos/pages/TextareaDemo"), "TextareaDemo");
const CheckboxDemo = l(() => import("./react-demos/pages/CheckboxDemo"), "CheckboxDemo");
const RadioGroupDemo = l(() => import("./react-demos/pages/RadioGroupDemo"), "RadioGroupDemo");
const SwitchDemo = l(() => import("./react-demos/pages/SwitchDemo"), "SwitchDemo");
const SliderDemo = l(() => import("./react-demos/pages/SliderDemo"), "SliderDemo");
const DatePickerDemo = l(() => import("./react-demos/pages/DatePickerDemo"), "DatePickerDemo");
// Fancy Code
const CodeEditorDemo = l(() => import("./react-demos/pages/CodeEditorDemo"), "CodeEditorDemo");
// ECharts (lazy layout registers echarts on first visit)
const EChartsLayout = lazy(() => import("./react-demos/echarts-loader"));
const LineDemo = l(() => import("./react-demos/pages/echarts/LineDemo"), "LineDemo");
const BarDemo = l(() => import("./react-demos/pages/echarts/BarDemo"), "BarDemo");
const PieDemo = l(() => import("./react-demos/pages/echarts/PieDemo"), "PieDemo");
const ScatterDemo = l(() => import("./react-demos/pages/echarts/ScatterDemo"), "ScatterDemo");
const RadarDemo = l(() => import("./react-demos/pages/echarts/RadarDemo"), "RadarDemo");
const HeatmapDemo = l(() => import("./react-demos/pages/echarts/HeatmapDemo"), "HeatmapDemo");
const CandlestickDemo = l(() => import("./react-demos/pages/echarts/CandlestickDemo"), "CandlestickDemo");
const BoxplotDemo = l(() => import("./react-demos/pages/echarts/BoxplotDemo"), "BoxplotDemo");
const TreemapDemo = l(() => import("./react-demos/pages/echarts/TreemapDemo"), "TreemapDemo");
const SunburstDemo = l(() => import("./react-demos/pages/echarts/SunburstDemo"), "SunburstDemo");
const FunnelDemo = l(() => import("./react-demos/pages/echarts/FunnelDemo"), "FunnelDemo");
const GaugeDemo = l(() => import("./react-demos/pages/echarts/GaugeDemo"), "GaugeDemo");
const SankeyDemo = l(() => import("./react-demos/pages/echarts/SankeyDemo"), "SankeyDemo");
const GraphDemo = l(() => import("./react-demos/pages/echarts/GraphDemo"), "GraphDemo");
const ParallelDemo = l(() => import("./react-demos/pages/echarts/ParallelDemo"), "ParallelDemo");
const ThemeRiverDemo = l(() => import("./react-demos/pages/echarts/ThemeRiverDemo"), "ThemeRiverDemo");
const EChartsCalendarDemo = l(() => import("./react-demos/pages/echarts/CalendarDemo"), "CalendarDemo");
const PictorialBarDemo = l(() => import("./react-demos/pages/echarts/PictorialBarDemo"), "PictorialBarDemo");
const MapDemo = l(() => import("./react-demos/pages/echarts/MapDemo"), "MapDemo");
const CustomDemo = l(() => import("./react-demos/pages/echarts/CustomDemo"), "CustomDemo");
const Bar3DDemo = l(() => import("./react-demos/pages/echarts/Bar3DDemo"), "Bar3DDemo");
const Scatter3DDemo = l(() => import("./react-demos/pages/echarts/Scatter3DDemo"), "Scatter3DDemo");
const SurfaceDemo = l(() => import("./react-demos/pages/echarts/SurfaceDemo"), "SurfaceDemo");
const GlobeDemo = l(() => import("./react-demos/pages/echarts/GlobeDemo"), "GlobeDemo");
const GraphicDemo = l(() => import("./react-demos/pages/echarts/GraphicDemo"), "GraphicDemo");

const Loading = () => (
  <div className="flex items-center justify-center py-20">
    <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-600" />
  </div>
);

const root = document.getElementById("react-demos");
if (root) {
  createRoot(root).render(
    <StrictMode>
      <BrowserRouter basename="/react-demos">
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route element={<DemoLayout />}>
              <Route index element={<Home />} />
              <Route path="action" element={<ActionDemo />} />
              <Route path="carousel" element={<CarouselDemo />} />
              <Route path="color-picker" element={<ColorPickerDemo />} />
              <Route path="emoji" element={<EmojiDemo />} />
              <Route path="emoji-select" element={<EmojiSelectDemo />} />
              <Route path="inputs" element={<InputsDemo />} />
              <Route path="table" element={<TableDemo />} />
              <Route path="wizard" element={<WizardDemo />} />
              <Route path="nested-carousel" element={<NestedCarouselDemo />} />
              <Route path="dynamic-carousel" element={<DynamicCarouselDemo />} />
              {/* Display */}
              <Route path="heading" element={<HeadingDemo />} />
              <Route path="text" element={<TextDemo />} />
              <Route path="separator" element={<SeparatorDemo />} />
              <Route path="badge" element={<BadgeDemo />} />
              <Route path="icon" element={<IconDemo />} />
              <Route path="avatar" element={<AvatarDemo />} />
              <Route path="skeleton" element={<SkeletonDemo />} />
              <Route path="progress" element={<ProgressDemo />} />
              <Route path="brand" element={<BrandDemo />} />
              <Route path="profile" element={<ProfileDemo />} />
              <Route path="card" element={<CardDemo />} />
              <Route path="callout" element={<CalloutDemo />} />
              <Route path="timeline" element={<TimelineDemo />} />
              {/* Overlay */}
              <Route path="tooltip" element={<TooltipDemo />} />
              <Route path="popover" element={<PopoverDemo />} />
              <Route path="dropdown" element={<DropdownDemo />} />
              <Route path="context-menu" element={<ContextMenuDemo />} />
              <Route path="modal" element={<ModalDemo />} />
              <Route path="toast" element={<ToastDemo />} />
              <Route path="command" element={<CommandDemo />} />
              {/* Navigation */}
              <Route path="tabs" element={<TabsDemo />} />
              <Route path="accordion" element={<AccordionDemo />} />
              <Route path="breadcrumbs" element={<BreadcrumbsDemo />} />
              <Route path="navbar" element={<NavbarDemo />} />
              <Route path="pagination" element={<PaginationDemo />} />
              {/* Advanced Inputs */}
              <Route path="autocomplete" element={<AutocompleteDemo />} />
              <Route path="pillbox" element={<PillboxDemo />} />
              <Route path="otp-input" element={<OtpInputDemo />} />
              <Route path="file-upload" element={<FileUploadDemo />} />
              <Route path="time-picker" element={<TimePickerDemo />} />
              <Route path="calendar" element={<CalendarDemo />} />
              <Route path="multi-switch" element={<MultiSwitchDemo />} />
              {/* Rich Content */}
              <Route path="composer" element={<ComposerDemo />} />
              <Route path="chart" element={<ChartDemo />} />
              <Route path="editor" element={<EditorDemo />} />
              <Route path="kanban" element={<KanbanDemo />} />
              <Route path="canvas" element={<CanvasDemo />} />
              <Route path="diagram" element={<DiagramDemo />} />
              {/* Menus & Navigation */}
              <Route path="menu" element={<MenuDemo />} />
              <Route path="sidebar" element={<SidebarDemo />} />
              <Route path="mobile-menu" element={<MobileMenuDemo />} />
              {/* Basic Inputs */}
              <Route path="input" element={<InputDemo />} />
              <Route path="select" element={<SelectDemo />} />
              <Route path="textarea" element={<TextareaDemo />} />
              <Route path="checkbox" element={<CheckboxDemo />} />
              <Route path="radio-group" element={<RadioGroupDemo />} />
              <Route path="switch" element={<SwitchDemo />} />
              <Route path="slider" element={<SliderDemo />} />
              <Route path="date-picker" element={<DatePickerDemo />} />
              {/* Fancy Code */}
              <Route path="code-editor" element={<CodeEditorDemo />} />
              {/* ECharts (lazy-loaded layout registers echarts) */}
              <Route element={<EChartsLayout />}>
                <Route path="echarts-line" element={<LineDemo />} />
                <Route path="echarts-bar" element={<BarDemo />} />
                <Route path="echarts-pie" element={<PieDemo />} />
                <Route path="echarts-scatter" element={<ScatterDemo />} />
                <Route path="echarts-radar" element={<RadarDemo />} />
                <Route path="echarts-heatmap" element={<HeatmapDemo />} />
                <Route path="echarts-candlestick" element={<CandlestickDemo />} />
                <Route path="echarts-boxplot" element={<BoxplotDemo />} />
                <Route path="echarts-treemap" element={<TreemapDemo />} />
                <Route path="echarts-sunburst" element={<SunburstDemo />} />
                <Route path="echarts-funnel" element={<FunnelDemo />} />
                <Route path="echarts-gauge" element={<GaugeDemo />} />
                <Route path="echarts-sankey" element={<SankeyDemo />} />
                <Route path="echarts-graph" element={<GraphDemo />} />
                <Route path="echarts-parallel" element={<ParallelDemo />} />
                <Route path="echarts-theme-river" element={<ThemeRiverDemo />} />
                <Route path="echarts-calendar" element={<EChartsCalendarDemo />} />
                <Route path="echarts-pictorial-bar" element={<PictorialBarDemo />} />
                <Route path="echarts-map" element={<MapDemo />} />
                <Route path="echarts-custom" element={<CustomDemo />} />
                <Route path="echarts-bar-3d" element={<Bar3DDemo />} />
                <Route path="echarts-scatter-3d" element={<Scatter3DDemo />} />
                <Route path="echarts-surface" element={<SurfaceDemo />} />
                <Route path="echarts-globe" element={<GlobeDemo />} />
                <Route path="echarts-graphic" element={<GraphicDemo />} />
              </Route>
              {/* Kitchen Sink */}
              <Route path="kitchen-sink" element={<KitchenSinkDemo />} />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </StrictMode>
  );
}
