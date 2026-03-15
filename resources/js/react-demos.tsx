import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router";
import { Home } from "./react-demos/pages/Home";
import { ActionDemo } from "./react-demos/pages/ActionDemo";
import { CarouselDemo } from "./react-demos/pages/CarouselDemo";
import { ColorPickerDemo } from "./react-demos/pages/ColorPickerDemo";
import { EmojiDemo } from "./react-demos/pages/EmojiDemo";
import { EmojiSelectDemo } from "./react-demos/pages/EmojiSelectDemo";
import { TableDemo } from "./react-demos/pages/TableDemo";
import { InputsDemo } from "./react-demos/pages/InputsDemo";
import { WizardDemo } from "./react-demos/pages/WizardDemo";
import { NestedCarouselDemo } from "./react-demos/pages/NestedCarouselDemo";
import { DynamicCarouselDemo } from "./react-demos/pages/DynamicCarouselDemo";
import { DemoLayout } from "./react-demos/layouts/DemoLayout";
// Phase 2: Display
import { HeadingDemo } from "./react-demos/pages/HeadingDemo";
import { TextDemo } from "./react-demos/pages/TextDemo";
import { SeparatorDemo } from "./react-demos/pages/SeparatorDemo";
import { BadgeDemo } from "./react-demos/pages/BadgeDemo";
import { IconDemo } from "./react-demos/pages/IconDemo";
import { AvatarDemo } from "./react-demos/pages/AvatarDemo";
import { SkeletonDemo } from "./react-demos/pages/SkeletonDemo";
import { ProgressDemo } from "./react-demos/pages/ProgressDemo";
import { BrandDemo } from "./react-demos/pages/BrandDemo";
import { ProfileDemo } from "./react-demos/pages/ProfileDemo";
import { CardDemo } from "./react-demos/pages/CardDemo";
import { CalloutDemo } from "./react-demos/pages/CalloutDemo";
import { TimelineDemo } from "./react-demos/pages/TimelineDemo";
// Phase 3: Overlay
import { TooltipDemo } from "./react-demos/pages/TooltipDemo";
import { PopoverDemo } from "./react-demos/pages/PopoverDemo";
import { DropdownDemo } from "./react-demos/pages/DropdownDemo";
import { ContextMenuDemo } from "./react-demos/pages/ContextMenuDemo";
import { ModalDemo } from "./react-demos/pages/ModalDemo";
import { ToastDemo } from "./react-demos/pages/ToastDemo";
import { CommandDemo } from "./react-demos/pages/CommandDemo";
// Phase 4: Navigation
import { TabsDemo } from "./react-demos/pages/TabsDemo";
import { AccordionDemo } from "./react-demos/pages/AccordionDemo";
import { BreadcrumbsDemo } from "./react-demos/pages/BreadcrumbsDemo";
import { NavbarDemo } from "./react-demos/pages/NavbarDemo";
import { PaginationDemo } from "./react-demos/pages/PaginationDemo";
// Phase 5: Advanced Inputs
import { AutocompleteDemo } from "./react-demos/pages/AutocompleteDemo";
import { PillboxDemo } from "./react-demos/pages/PillboxDemo";
import { OtpInputDemo } from "./react-demos/pages/OtpInputDemo";
import { FileUploadDemo } from "./react-demos/pages/FileUploadDemo";
import { TimePickerDemo } from "./react-demos/pages/TimePickerDemo";
import { CalendarDemo } from "./react-demos/pages/CalendarDemo";
// Phase 6: Rich Content
import { ComposerDemo } from "./react-demos/pages/ComposerDemo";
import { ChartDemo } from "./react-demos/pages/ChartDemo";
import { EditorDemo } from "./react-demos/pages/EditorDemo";
import { KanbanDemo } from "./react-demos/pages/KanbanDemo";
import { CanvasDemo } from "./react-demos/pages/CanvasDemo";
import { DiagramDemo } from "./react-demos/pages/DiagramDemo";
import { MultiSwitchDemo } from "./react-demos/pages/MultiSwitchDemo";
// Phase 7: Menus & Navigation
import { MenuDemo } from "./react-demos/pages/MenuDemo";
import { SidebarDemo } from "./react-demos/pages/SidebarDemo";
import { MobileMenuDemo } from "./react-demos/pages/MobileMenuDemo";
import { KitchenSinkDemo } from "./react-demos/pages/KitchenSinkDemo";
// Basic Inputs
import { InputDemo } from "./react-demos/pages/InputDemo";
import { SelectDemo } from "./react-demos/pages/SelectDemo";
import { TextareaDemo } from "./react-demos/pages/TextareaDemo";
import { CheckboxDemo } from "./react-demos/pages/CheckboxDemo";
import { RadioGroupDemo } from "./react-demos/pages/RadioGroupDemo";
import { SwitchDemo } from "./react-demos/pages/SwitchDemo";
import { SliderDemo } from "./react-demos/pages/SliderDemo";
import { DatePickerDemo } from "./react-demos/pages/DatePickerDemo";
// ECharts
import { registerAll } from "@particle-academy/react-echarts";
import { LineDemo } from "./react-demos/pages/echarts/LineDemo";
import { BarDemo } from "./react-demos/pages/echarts/BarDemo";
import { PieDemo } from "./react-demos/pages/echarts/PieDemo";
import { ScatterDemo } from "./react-demos/pages/echarts/ScatterDemo";
import { RadarDemo } from "./react-demos/pages/echarts/RadarDemo";
import { HeatmapDemo } from "./react-demos/pages/echarts/HeatmapDemo";
import { CandlestickDemo } from "./react-demos/pages/echarts/CandlestickDemo";
import { BoxplotDemo } from "./react-demos/pages/echarts/BoxplotDemo";
import { TreemapDemo } from "./react-demos/pages/echarts/TreemapDemo";
import { SunburstDemo } from "./react-demos/pages/echarts/SunburstDemo";
import { FunnelDemo } from "./react-demos/pages/echarts/FunnelDemo";
import { GaugeDemo } from "./react-demos/pages/echarts/GaugeDemo";
import { SankeyDemo } from "./react-demos/pages/echarts/SankeyDemo";
import { GraphDemo } from "./react-demos/pages/echarts/GraphDemo";
import { ParallelDemo } from "./react-demos/pages/echarts/ParallelDemo";
import { ThemeRiverDemo } from "./react-demos/pages/echarts/ThemeRiverDemo";
import { CalendarDemo as EChartsCalendarDemo } from "./react-demos/pages/echarts/CalendarDemo";
import { PictorialBarDemo } from "./react-demos/pages/echarts/PictorialBarDemo";
import { MapDemo } from "./react-demos/pages/echarts/MapDemo";
import { CustomDemo } from "./react-demos/pages/echarts/CustomDemo";
import { Bar3DDemo } from "./react-demos/pages/echarts/Bar3DDemo";
import { Scatter3DDemo } from "./react-demos/pages/echarts/Scatter3DDemo";
import { SurfaceDemo } from "./react-demos/pages/echarts/SurfaceDemo";
import { GlobeDemo } from "./react-demos/pages/echarts/GlobeDemo";
import { GraphicDemo } from "./react-demos/pages/echarts/GraphicDemo";

registerAll();

const root = document.getElementById("react-demos");
if (root) {
  createRoot(root).render(
    <StrictMode>
      <BrowserRouter basename="/react-demos">
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
            {/* Phase 2: Display */}
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
            {/* Phase 3: Overlay */}
            <Route path="tooltip" element={<TooltipDemo />} />
            <Route path="popover" element={<PopoverDemo />} />
            <Route path="dropdown" element={<DropdownDemo />} />
            <Route path="context-menu" element={<ContextMenuDemo />} />
            <Route path="modal" element={<ModalDemo />} />
            <Route path="toast" element={<ToastDemo />} />
            <Route path="command" element={<CommandDemo />} />
            {/* Phase 4: Navigation */}
            <Route path="tabs" element={<TabsDemo />} />
            <Route path="accordion" element={<AccordionDemo />} />
            <Route path="breadcrumbs" element={<BreadcrumbsDemo />} />
            <Route path="navbar" element={<NavbarDemo />} />
            <Route path="pagination" element={<PaginationDemo />} />
            {/* Phase 5: Advanced Inputs */}
            <Route path="autocomplete" element={<AutocompleteDemo />} />
            <Route path="pillbox" element={<PillboxDemo />} />
            <Route path="otp-input" element={<OtpInputDemo />} />
            <Route path="file-upload" element={<FileUploadDemo />} />
            <Route path="time-picker" element={<TimePickerDemo />} />
            <Route path="calendar" element={<CalendarDemo />} />
            <Route path="multi-switch" element={<MultiSwitchDemo />} />
            {/* Phase 6: Rich Content */}
            <Route path="composer" element={<ComposerDemo />} />
            <Route path="chart" element={<ChartDemo />} />
            <Route path="editor" element={<EditorDemo />} />
            <Route path="kanban" element={<KanbanDemo />} />
            <Route path="canvas" element={<CanvasDemo />} />
            <Route path="diagram" element={<DiagramDemo />} />
            {/* Phase 7: Menus & Navigation */}
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
            {/* ECharts */}
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
            {/* Kitchen Sink */}
            <Route path="kitchen-sink" element={<KitchenSinkDemo />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </StrictMode>
  );
}
