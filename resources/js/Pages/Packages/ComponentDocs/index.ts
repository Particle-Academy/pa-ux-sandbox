import type { ComponentDoc } from "./types";
import { accordionDoc } from "./Accordion";
import { accordionPanelDoc } from "./AccordionPanel";
import { actionDoc } from "./Action";
import { buttonDoc } from "./Button";
import { agentCursorDoc } from "./AgentCursor";
import { agentPanelDoc } from "./AgentPanel";
import { artBoardDoc } from "./ArtBoard";
import { artPieceDoc } from "./ArtPiece";
import { artBoardSectionDoc } from "./ArtBoardSection";
import { artBoardNoteDoc } from "./ArtBoardNote";
import { autocompleteDoc } from "./Autocomplete";
import { avatarDoc } from "./Avatar";
import { badgeDoc } from "./Badge";
import { brandDoc } from "./Brand";
import { breadcrumbsDoc } from "./Breadcrumbs";
import { calendarDoc } from "./Calendar";
import { calloutDoc } from "./Callout";
import { cardDoc } from "./Card";
import { carouselDoc } from "./Carousel";
import { chartDoc } from "./Chart";
import { chatDrawerDoc } from "./ChatDrawer";
import { codeEditorDoc } from "./CodeEditor";
import { colorPickerDoc } from "./ColorPicker";
import { commandDoc } from "./Command";
import { composerDoc } from "./Composer";
import { contentRendererDoc } from "./ContentRenderer";
import { contextMenuDoc } from "./ContextMenu";
import { createEmptyWorkbookDoc } from "./CreateEmptyWorkbook";
import { dropdownDoc } from "./Dropdown";
import { echart3dDoc } from "./EChart3D";
import { echartDoc } from "./EChart";
import { echartGraphicDoc } from "./EChartGraphic";
import { editorDoc } from "./Editor";
import { emojiDoc } from "./Emoji";
import { emojiSelectDoc } from "./EmojiSelect";
import { fancy3dCanvasDoc } from "./Fancy3DCanvas";
import { fancy3dCard3DDoc } from "./Fancy3DCard3D";
import { fancy3dMonitorDoc } from "./Fancy3DMonitor";
import { fancy3dStageDoc } from "./Fancy3DStage";
import { fancy3dThreeStageDoc } from "./Fancy3DThreeStage";
import { fancy3dThreeMonitorDoc } from "./Fancy3DThreeMonitor";
import { fancy3dThreeCard3DDoc } from "./Fancy3DThreeCard3D";
import { deckEditorDoc } from "./DeckEditor";
import { fancySlidesSlideDoc } from "./FancySlidesSlide";
import { fancySlidesTextElementDoc } from "./FancySlidesTextElement";
import { fancySlidesImageElementDoc } from "./FancySlidesImageElement";
import { fancySlidesShapeElementDoc } from "./FancySlidesShapeElement";
import { presenterViewDoc } from "./PresenterView";
import { slideViewerDoc } from "./SlideViewer";
import { fancyAppRootDoc } from "./FancyAppRoot";
import { fileUploadDoc } from "./FileUpload";
import { flowEditorDoc } from "./FlowEditor";
import { headingDoc } from "./Heading";
import { holySheetAgentDoc } from "./HolySheetAgent";
import { iconDoc } from "./Icon";
import { inputTagDoc } from "./InputTag";
import { inputsDoc } from "./Inputs";
import { kanbanDoc } from "./Kanban";
import { magicWandDoc } from "./MagicWand";
import { menuDoc } from "./Menu";
import { microMcpServerDoc } from "./MicroMcpServer";
import { mobileMenuDoc } from "./MobileMenu";
import { modalDoc } from "./Modal";
import { moodMeterDoc } from "./MoodMeter";
import { navbarDoc } from "./Navbar";
import { otpInputDoc } from "./OtpInput";
import { paginationDoc } from "./Pagination";
import { pillboxDoc } from "./Pillbox";
import { popoverDoc } from "./Popover";
import { portalDoc } from "./Portal";
import { profileDoc } from "./Profile";
import { progressDoc } from "./Progress";
import { promptInputDoc } from "./PromptInput";
import { reasonTagDoc } from "./ReasonTag";
import { screenDoc } from "./Screen";
import { screenSystemDoc } from "./ScreenSystem";
import { separatorDoc } from "./Separator";
import { shareControlsDoc } from "./ShareControls";
import { sharedWhiteboardDoc } from "./SharedWhiteboard";
import { sheetWorkbookDoc } from "./SheetWorkbook";
import { sidebarDoc } from "./Sidebar";
import { skeletonDoc } from "./Skeleton";
import { tableDoc } from "./Table";
import { tabsDoc } from "./Tabs";
import { textDoc } from "./Text";
import { timePickerDoc } from "./TimePicker";
import { timelineDoc } from "./Timeline";
import { toastDoc } from "./Toast";
import { tooltipDoc } from "./Tooltip";
import { treeNavDoc } from "./TreeNav";
import { useFancyFormDoc } from "./UseFancyForm";
import { useFlowRunDoc } from "./UseFlowRun";
import { useFlowStateDoc } from "./UseFlowState";
import { whiteboardBoardDoc } from "./WhiteboardBoard";
import { whiteboardConnectorDoc } from "./WhiteboardConnector";
import { whiteboardCursorLayerDoc } from "./WhiteboardCursorLayer";
import { whiteboardDrawingDoc } from "./WhiteboardDrawing";
import { whiteboardShapeDoc } from "./WhiteboardShape";
import { whiteboardStickyNoteDoc } from "./WhiteboardStickyNote";

/**
 * Per-component documentation registry. When a `pkg/slug` is in here,
 * the component detail page swaps in two extra tabs: Examples (gallery
 * of named demos) and Props (typed table). Components without an entry
 * keep the existing Preview / Install / Source / Dependencies surface.
 *
 * Roll out incrementally — adding an entry here lights up the docs tabs
 * for that component automatically.
 */
const DOCS: Record<string, ComponentDoc> = {
    // react-fancy
    "react-fancy/accordion": accordionDoc,
    "react-fancy/accordion-panel": accordionPanelDoc,
    "react-fancy/button": buttonDoc,
    "react-fancy/action": actionDoc,
    "react-fancy/autocomplete": autocompleteDoc,
    "react-fancy/avatar": avatarDoc,
    "react-fancy/badge": badgeDoc,
    "react-fancy/brand": brandDoc,
    "react-fancy/breadcrumbs": breadcrumbsDoc,
    "react-fancy/calendar": calendarDoc,
    "react-fancy/callout": calloutDoc,
    "react-fancy/card": cardDoc,
    "react-fancy/carousel": carouselDoc,
    "react-fancy/chart": chartDoc,
    "react-fancy/chat-drawer": chatDrawerDoc,
    "react-fancy/color-picker": colorPickerDoc,
    "react-fancy/command": commandDoc,
    "react-fancy/composer": composerDoc,
    "react-fancy/content-renderer": contentRendererDoc,
    "react-fancy/context-menu": contextMenuDoc,
    "react-fancy/dropdown": dropdownDoc,
    "react-fancy/editor": editorDoc,
    "react-fancy/emoji": emojiDoc,
    "react-fancy/emoji-select": emojiSelectDoc,
    "react-fancy/file-upload": fileUploadDoc,
    "react-fancy/heading": headingDoc,
    "react-fancy/icon": iconDoc,
    "react-fancy/input-tag": inputTagDoc,
    "react-fancy/inputs": inputsDoc,
    "react-fancy/kanban": kanbanDoc,
    "react-fancy/magic-wand": magicWandDoc,
    "react-fancy/menu": menuDoc,
    "react-fancy/mobile-menu": mobileMenuDoc,
    "react-fancy/modal": modalDoc,
    "react-fancy/mood-meter": moodMeterDoc,
    "react-fancy/navbar": navbarDoc,
    "react-fancy/otp-input": otpInputDoc,
    "react-fancy/pagination": paginationDoc,
    "react-fancy/pillbox": pillboxDoc,
    "react-fancy/popover": popoverDoc,
    "react-fancy/portal": portalDoc,
    "react-fancy/profile": profileDoc,
    "react-fancy/progress": progressDoc,
    "react-fancy/prompt-input": promptInputDoc,
    "react-fancy/reason-tag": reasonTagDoc,
    "react-fancy/separator": separatorDoc,
    "react-fancy/sidebar": sidebarDoc,
    "react-fancy/skeleton": skeletonDoc,
    "react-fancy/table": tableDoc,
    "react-fancy/tabs": tabsDoc,
    "react-fancy/text": textDoc,
    "react-fancy/time-picker": timePickerDoc,
    "react-fancy/timeline": timelineDoc,
    "react-fancy/toast": toastDoc,
    "react-fancy/tooltip": tooltipDoc,
    "react-fancy/tree-nav": treeNavDoc,

    // fancy-whiteboard
    "fancy-whiteboard/board": whiteboardBoardDoc,
    "fancy-whiteboard/sticky-note": whiteboardStickyNoteDoc,
    "fancy-whiteboard/cursor-layer": whiteboardCursorLayerDoc,
    "fancy-whiteboard/connector": whiteboardConnectorDoc,
    "fancy-whiteboard/shape": whiteboardShapeDoc,
    "fancy-whiteboard/drawing": whiteboardDrawingDoc,

    // fancy-artboard
    "fancy-artboard/artboard": artBoardDoc,
    "fancy-artboard/art-piece": artPieceDoc,
    "fancy-artboard/artboard-section": artBoardSectionDoc,
    "fancy-artboard/artboard-note": artBoardNoteDoc,

    // fancy-flow
    "fancy-flow/flow-editor": flowEditorDoc,
    "fancy-flow/use-flow-state": useFlowStateDoc,
    "fancy-flow/use-flow-run": useFlowRunDoc,

    // fancy-sheets
    "fancy-sheets/sheet-workbook": sheetWorkbookDoc,
    "fancy-sheets/create-empty-workbook": createEmptyWorkbookDoc,

    // fancy-code
    "fancy-code/code-editor": codeEditorDoc,

    // fancy-echarts
    "fancy-echarts/echart": echartDoc,
    "fancy-echarts/echart-3d": echart3dDoc,
    "fancy-echarts/echart-graphic": echartGraphicDoc,

    // fancy-slides
    "fancy-slides/slide": fancySlidesSlideDoc,
    "fancy-slides/slide-viewer": slideViewerDoc,
    "fancy-slides/presenter-view": presenterViewDoc,
    "fancy-slides/deck-editor": deckEditorDoc,
    "fancy-slides/text-element": fancySlidesTextElementDoc,
    "fancy-slides/image-element": fancySlidesImageElementDoc,
    "fancy-slides/shape-element": fancySlidesShapeElementDoc,

    // fancy-screens
    "fancy-screens/screen-system": screenSystemDoc,
    "fancy-screens/screen": screenDoc,

    // fancy-3d
    "fancy-3d/canvas": fancy3dCanvasDoc,
    "fancy-3d-babylon/stage": fancy3dStageDoc,
    "fancy-3d-babylon/monitor": fancy3dMonitorDoc,
    "fancy-3d-babylon/card-3d": fancy3dCard3DDoc,

    // fancy-3d-three
    "fancy-3d-three/stage": fancy3dThreeStageDoc,
    "fancy-3d-three/monitor": fancy3dThreeMonitorDoc,
    "fancy-3d-three/card-3d": fancy3dThreeCard3DDoc,

    // agent-integrations
    "agent-integrations/micro-mcp-server": microMcpServerDoc,
    "agent-integrations/agent-panel": agentPanelDoc,
    "agent-integrations/agent-cursor": agentCursorDoc,
    "agent-integrations/shared-whiteboard": sharedWhiteboardDoc,
    "agent-integrations/share-controls": shareControlsDoc,

    // holy-sheet
    "holy-sheet/agent": holySheetAgentDoc,

    // fancy-inertia
    "fancy-inertia/fancy-app-root": fancyAppRootDoc,
    "fancy-inertia/use-fancy-form": useFancyFormDoc,
};

export function getComponentDoc(pkg: string, slug: string): ComponentDoc | null {
    return DOCS[`${pkg}/${slug}`] ?? null;
}

export type { ComponentDoc, ComponentDocExample, ComponentDocProp } from "./types";
