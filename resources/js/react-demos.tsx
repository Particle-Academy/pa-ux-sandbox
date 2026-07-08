import { StrictMode, lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router";
import { registerAll as registerEChartsAll, registerBuiltinThemes } from "@particle-academy/fancy-echarts";
import "./react-demos/setup-icons";
import { DemoLayout } from "./react-demos/layouts/DemoLayout";
import { Home } from "./react-demos/pages/Home";

// Register echarts modules synchronously before any chart-bearing demo
// can render. Without this the canvas renderer throws
// `TypeError: va[o] is not a constructor` on the first <EChart> mount,
// killing the whole SPA. See `showcase-app.tsx` for the matching fix on
// the Inertia entry. (Both will become redundant once fancy-inertia
// 0.2.x moves registerAll from useEffect to module-load.)
registerEChartsAll();
registerBuiltinThemes();

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
const AccordionPanelDemo = l(() => import("./react-demos/pages/AccordionPanelDemo"), "AccordionPanelDemo");
const AICanvasChatDemo = l(() => import("./react-demos/pages/AICanvasChatDemo"), "AICanvasChatDemo");
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
const CanvasStudioDemo = l(() => import("./react-demos/pages/CanvasStudioDemo"), "CanvasStudioDemo");
const BabylonCityDemo = l(() => import("./react-demos/pages/BabylonCityDemo"), "BabylonCityDemo");
const ScreenStageDemo = l(() => import("./react-demos/pages/ScreenStageDemo"), "ScreenStageDemo");
const WhiteboardDemo = l(() => import("./react-demos/pages/WhiteboardDemo"), "WhiteboardDemo");
const WhiteboardFullDemo = l(() => import("./react-demos/pages/WhiteboardFullDemo"), "WhiteboardFullDemo");
const WhiteboardAgentDemo = l(() => import("./react-demos/pages/WhiteboardAgentDemo"), "WhiteboardAgentDemo");
const WhiteboardSharedDemo = l(() => import("./react-demos/pages/WhiteboardSharedDemo"), "WhiteboardSharedDemo");
const WorkflowAgentDemo = l(() => import("./react-demos/pages/WorkflowAgentDemo"), "WorkflowAgentDemo");
const MapAgentDemo = l(() => import("./react-demos/pages/MapAgentDemo"), "MapAgentDemo");
const HumanPlusDemo = l(() => import("./react-demos/pages/HumanPlusDemo"), "HumanPlusDemo");
const Fancy3DHome = l(() => import("./react-demos/pages/Fancy3DHome"), "Fancy3DHome");
const Fancy3DPrimitivesDemo = l(() => import("./react-demos/pages/Fancy3DPrimitivesDemo"), "Fancy3DPrimitivesDemo");
const Fancy3DLayoutsDemo = l(() => import("./react-demos/pages/Fancy3DLayoutsDemo"), "Fancy3DLayoutsDemo");
const Fancy3DDecalDemo = l(() => import("./react-demos/pages/Fancy3DDecalDemo"), "Fancy3DDecalDemo");
const Fancy3DMonitorDemo = l(() => import("./react-demos/pages/Fancy3DMonitorDemo"), "Fancy3DMonitorDemo");
const Fancy3DCard3DDemo = l(() => import("./react-demos/pages/Fancy3DCard3DDemo"), "Fancy3DCard3DDemo");
const BabylonSmokeTestDemo = l(() => import("./react-demos/pages/BabylonSmokeTestDemo"), "BabylonSmokeTestDemo");
// Phase 7: Menus & Navigation
const MenuDemo = l(() => import("./react-demos/pages/MenuDemo"), "MenuDemo");
const SidebarDemo = l(() => import("./react-demos/pages/SidebarDemo"), "SidebarDemo");
const MobileMenuDemo = l(() => import("./react-demos/pages/MobileMenuDemo"), "MobileMenuDemo");
const KitchenSinkDemo = l(() => import("./react-demos/pages/KitchenSinkDemo"), "KitchenSinkDemo");
const TreeNavDemo = l(() => import("./react-demos/pages/TreeNavDemo"), "TreeNavDemo");
const IdeDemo = l(() => import("./react-demos/pages/IdeDemo"), "IdeDemo");
// Basic Inputs
const InputDemo = l(() => import("./react-demos/pages/InputDemo"), "InputDemo");
const SelectDemo = l(() => import("./react-demos/pages/SelectDemo"), "SelectDemo");
const TextareaDemo = l(() => import("./react-demos/pages/TextareaDemo"), "TextareaDemo");
const CheckboxDemo = l(() => import("./react-demos/pages/CheckboxDemo"), "CheckboxDemo");
const RadioGroupDemo = l(() => import("./react-demos/pages/RadioGroupDemo"), "RadioGroupDemo");
const SwitchDemo = l(() => import("./react-demos/pages/SwitchDemo"), "SwitchDemo");
const SliderDemo = l(() => import("./react-demos/pages/SliderDemo"), "SliderDemo");
const DatePickerDemo = l(() => import("./react-demos/pages/DatePickerDemo"), "DatePickerDemo");
// Fancy Code + Fancy Sheets
const CodeEditorDemo = l(() => import("./react-demos/pages/CodeEditorDemo"), "CodeEditorDemo");
const FileViewerDemo = l(() => import("./react-demos/pages/FileViewerDemo"), "FileViewerDemo");
const SpreadsheetDemo = l(() => import("./react-demos/pages/SpreadsheetDemo"), "SpreadsheetDemo");
const SheetsAgentDemo = l(() => import("./react-demos/pages/SheetsAgentDemo"), "SheetsAgentDemo");
const SlidesDemo = l(() => import("./react-demos/pages/SlidesDemo"), "SlidesDemo");
const SlideDemo = l(() => import("./react-demos/pages/SlideDemo"), "SlideDemo");
const SlideViewerDemo = l(() => import("./react-demos/pages/SlideViewerDemo"), "SlideViewerDemo");
const PresenterViewDemo = l(() => import("./react-demos/pages/PresenterViewDemo"), "PresenterViewDemo");
const TextElementDemo = l(() => import("./react-demos/pages/TextElementDemo"), "TextElementDemo");
const ImageElementDemo = l(() => import("./react-demos/pages/ImageElementDemo"), "ImageElementDemo");
const ShapeElementDemo = l(() => import("./react-demos/pages/ShapeElementDemo"), "ShapeElementDemo");
const DarkSlideDemo = l(() => import("./react-demos/pages/DarkSlideDemo"), "DarkSlideDemo");
// Human+ primitives — promoted from /dreaming 2026-05-12
const ReasonTagPageDemo = l(() => import("./react-demos/pages/ReasonTagDemo"), "ReasonTagDemo");
const MoodMeterPageDemo = l(() => import("./react-demos/pages/MoodMeterDemo"), "MoodMeterDemo");
const PromptInputPageDemo = l(() => import("./react-demos/pages/PromptInputDemo"), "PromptInputDemo");
const MagicWandPageDemo = l(() => import("./react-demos/pages/MagicWandDemo"), "MagicWandDemo");
const AppSheetDemo = l(() => import("./react-demos/pages/AppSheetDemo"), "AppSheetDemo");
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
const EffectScatterDemo = l(() => import("./react-demos/pages/echarts/EffectScatterDemo"), "EffectScatterDemo");
const EChartsShowcase = l(() => import("./react-demos/pages/echarts/EChartsShowcase"), "EChartsShowcase");
// fancy-screens
const ScreensIntroDemo = l(() => import("./react-demos/pages/screens/ScreensIntroDemo"), "ScreensIntroDemo");
const ScreensShowcaseDemo = l(() => import("./react-demos/pages/screens/ScreensShowcaseDemo"), "ScreensShowcaseDemo");

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
              <Route path="accordion-panel" element={<AccordionPanelDemo />} />
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
              {/* Spatial */}
              <Route path="tree-nav" element={<TreeNavDemo />} />
              {/* Patterns */}
              <Route path="ide" element={<IdeDemo />} />
              <Route path="app-sheet" element={<AppSheetDemo />} />
              <Route path="ai-canvas-chat" element={<AICanvasChatDemo />} />
              <Route path="canvas-studio" element={<CanvasStudioDemo />} />
              <Route path="babylon-city" element={<BabylonCityDemo />} />
              <Route path="screen-stage" element={<ScreenStageDemo />} />
              <Route path="whiteboard" element={<WhiteboardDemo />} />
              <Route path="whiteboard-full" element={<WhiteboardFullDemo />} />
              <Route path="whiteboard-agent" element={<WhiteboardAgentDemo />} />
              <Route path="whiteboard-shared" element={<WhiteboardSharedDemo />} />
              <Route path="workflow-agent" element={<WorkflowAgentDemo />} />
              <Route path="map-agent" element={<MapAgentDemo />} />
              <Route path="human-plus" element={<HumanPlusDemo />} />
              {/* fancy-3d package demos */}
              <Route path="3d" element={<Fancy3DHome />} />
              <Route path="3d-primitives" element={<Fancy3DPrimitivesDemo />} />
              <Route path="3d-layouts" element={<Fancy3DLayoutsDemo />} />
              <Route path="3d-decal" element={<Fancy3DDecalDemo />} />
              <Route path="3d-monitor" element={<Fancy3DMonitorDemo />} />
              <Route path="3d-card3d" element={<Fancy3DCard3DDemo />} />
              <Route path="babylon-smoke" element={<BabylonSmokeTestDemo />} />
              {/* Fancy Code */}
              <Route path="code-editor" element={<CodeEditorDemo />} />
              <Route path="file-viewer" element={<FileViewerDemo />} />
              <Route path="spreadsheet" element={<SpreadsheetDemo />} />
              <Route path="sheets-agent" element={<SheetsAgentDemo />} />
              <Route path="slides" element={<SlidesDemo />} />
              {/* Fancy Slides — per-component demos */}
              <Route path="slide" element={<SlideDemo />} />
              <Route path="slide-viewer" element={<SlideViewerDemo />} />
              <Route path="presenter-view" element={<PresenterViewDemo />} />
              {/* DeckEditor lives at /slides; alias here so the registry's deck-editor slug resolves. */}
              <Route path="deck-editor" element={<SlidesDemo />} />
              <Route path="text-element" element={<TextElementDemo />} />
              <Route path="image-element" element={<ImageElementDemo />} />
              <Route path="shape-element" element={<ShapeElementDemo />} />
              {/* Dark Slide — PHP PPTX writer */}
              <Route path="dark-slide" element={<DarkSlideDemo />} />
              {/* Human+ primitives */}
              <Route path="reason-tag" element={<ReasonTagPageDemo />} />
              <Route path="mood-meter" element={<MoodMeterPageDemo />} />
              <Route path="prompt-input" element={<PromptInputPageDemo />} />
              <Route path="magic-wand" element={<MagicWandPageDemo />} />
              {/* ECharts (lazy-loaded layout registers echarts) */}
              <Route element={<EChartsLayout />}>
                <Route path="echarts-showcase" element={<EChartsShowcase />} />
                <Route path="echarts-line" element={<LineDemo />} />
                <Route path="echarts-bar" element={<BarDemo />} />
                <Route path="echarts-pie" element={<PieDemo />} />
                <Route path="echarts-scatter" element={<ScatterDemo />} />
                <Route path="echarts-effect-scatter" element={<EffectScatterDemo />} />
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
              {/* fancy-screens */}
              <Route path="screens-intro" element={<ScreensIntroDemo />} />
              <Route path="screens-showcase" element={<ScreensShowcaseDemo />} />
              {/* Kitchen Sink */}
              <Route path="kitchen-sink" element={<KitchenSinkDemo />} />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </StrictMode>
  );
}
