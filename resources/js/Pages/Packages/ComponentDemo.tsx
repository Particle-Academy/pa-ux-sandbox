import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode, type ReactElement} from "react";
import { threeEngine } from "@particle-academy/fancy-3d-three/engine";
import { babylonEngine } from "@particle-academy/fancy-3d-babylon/engine";
import { FeatureGate, PricingTable, FeatureMatrix, PlanFeaturesEditor, type PlanFeatureValue} from "../../components/fancy/catalog-fms";
// Shared with the package-grid tiles, so a component's demo and its thumbnail
// cannot drift apart.
import { CR_LESSON, CR_CURRICULUM, CR_QUESTION, CR_TEST, CR_COURSE, CR_ENROLLMENT, CR_ATTEMPT, JB_POSTING, JB_APPLICATION, TA_HISTORY, TA_PLAN, SAMPLE_TSX, PREVIEW_TIMELINE } from "./ComponentPreviews";
import { type TimelineDoc } from "@particle-academy/fancy-motion";
import { MotionStage, TimelineDock } from "@particle-academy/fancy-motion/react";
import { InstallBanner, OfflineBanner } from "@particle-academy/fancy-pwa";
import { PasskeyStatus, PasskeyManager, PasskeySignIn, type PasskeyManagerState, type PasskeySignInState} from "@particle-academy/fancy-passkeys-ui";
import { ChatTranscript, MessageComposer, PlanReview, TeachersAidChat } from "@particle-academy/teachers-aid-ui";
import { ApplicationList, ApplyForm, EmployerJobList, JobDetail, JobPostingForm } from "@particle-academy/job-board";
import { CertificateView, CoursePlayer, CurriculumOverview, LessonView, QuestionRenderer, TestRunner, type AnswerValue} from "@particle-academy/classroom";
import { SAMPLE_CODE_VIEW, SAMPLE_IMG, SAMPLE_PDF, SAMPLE_POSTER, SILENT_WAV } from "./showcase-fixtures";
import {
    Accordion,
    Button,
    Autocomplete,
    Avatar,
    Badge,
    Brand,
    Breadcrumbs,
    Calendar,
    Callout,
    Card,
    Carousel,
    Chart,
    ChatDrawer,
    ColorPicker,
    Command,
    Composer,
    ContentRenderer,
    ContextMenu,
    FauxClient,
    Drawer,
    Dropdown,
    Editor,
    Emoji,
    EmojiSelect,
    FileUpload,
    Heading,
    Icon,
    Input,
    InputTag,
    Kanban,
    MagicWand,
    Marquee,
    Menu,
    MobileMenu,
    Modal,
    MoodMeter,
    Navbar,
    OtpInput,
    Pagination,
    Pillbox,
    Popover,
    Portal,
    Profile,
    Progress,
    PromptInput,
    ReasonTag,
    Separator,
    Sidebar,
    Skeleton,
    Table,
    Tabs,
    Text,
    textareaAdapter,
    FileBrowser,
    Timeline,
    TimePicker,
    Tooltip,
    TreeNav,
    useToast,
    JsonEditor,
    type JsonValue,
    Grid,
    Container,
    Section,
    Kbd,
    Eyebrow,
    PullQuote,
    Stat,
    StatList,
    IndexList,
    TimeGrid,
    CodeView,
    MediaViewer,
    ImageViewer,
    VideoViewer,
    AudioViewer,
    PdfViewer,
    // fancy-whiteboard exports a StickyNote too — the very collision the
    // registry sidesteps by qualifying this slug as `react-fancy-sticky-note`.
    StickyNote as RfStickyNote,
    AccordionPanel,
    AccordionPanelSection,
    AccordionPanelTrigger,
    AccordionPanelContent,
    type TreeNodeData,
} from "@particle-academy/react-fancy";
import { CodeEditor, MarkdownEditor, FileViewer} from "@particle-academy/fancy-code";
import {
    DownlineTree as MlmDownlineTree,
    CommissionStatement as MlmCommissionStatement,
    RankProgress as MlmRankProgress,
    type DownlineMember as MlmMember,
    type DownlineEdge as MlmEdge,
    type CommissionRow as MlmCommissionRow,
} from "@particle-academy/fancy-mlm-ui";
import "@particle-academy/fancy-mlm-ui/styles.css";
import {
    RobotsEditor as XfRobotsEditor,
    SecurityTxtEditor as XfSecurityTxtEditor,
    LlmsTxtEditor as XfLlmsTxtEditor,
    HumansTxtEditor as XfHumansTxtEditor,
    SitemapEditor as XfSitemapEditor,
    AgentsEditor as XfAgentsEditor,
    XFilePreview as XfFilePreview,
    XFilesManager as XfFilesManager,
    type XFileKind as XfKind,
    type XFilesModel as XfFilesModel,
    type RobotsModel as XfRobotsModel,
    type SecurityTxtModel as XfSecurityTxtModel,
    type LlmsTxtModel as XfLlmsTxtModel,
    type HumansTxtModel as XfHumansTxtModel,
    type SitemapModel as XfSitemapModel,
    type AgentsModel as XfAgentsModel,
} from "@particle-academy/fancy-x-files-ui";
import "@particle-academy/fancy-code/styles.css";
import { Terminal, type TerminalHandle, BUILTIN_SHELLS, type ShellProfile } from "@particle-academy/fancy-term";
import "@xterm/xterm/css/xterm.css";
import { Board, StickyNote, CursorLayer, Shape, Connector, Drawing } from "@particle-academy/fancy-whiteboard";
import "@particle-academy/fancy-whiteboard/styles.css";
import { ArtBoard, ArtPiece, type ArtBoardValue } from "@particle-academy/fancy-artboard";
import "@particle-academy/fancy-artboard/styles.css";
import { FlowViewer, type FlowGraph, type FlowNode} from "@particle-academy/fancy-flow";
import { FlowEditor } from "../../components/FlowEditor";
import { useFlowRunnerUx, createFlowRunnerUx } from "@particle-academy/fancy-flow/ux";
import { runFlow } from "@particle-academy/fancy-flow/engine";
import "@particle-academy/fancy-flow/styles.css";
import { FancyDiff, computeDiff, mergeResult, parseUnifiedDiff, setAllStatus, type AcceptanceState } from "@particle-academy/fancy-diff";
import "@particle-academy/fancy-diff/styles.css";
import { mountPixel, type PixelHandle, type PixelStyle } from "@particle-academy/fancy-pixel";
import { SheetWorkbook, createEmptyWorkbook, createEmptySheet, type WorkbookData} from "@particle-academy/fancy-sheets";
import "@particle-academy/fancy-sheets/styles.css";
import { EChart, EChart3D, EChartGraphic, type EChartsOption} from "@particle-academy/fancy-echarts";
import {
    WorkingTree,
    CommitHistory,
    ReviewList,
    RepositoryBrowser,
    DiffViewer,
    BranchPicker,
    CommitComposer,
    CreateReviewForm,
    type CommitDraft as FancyGitCommitDraft,
} from "@particle-academy/fancy-git-ui";
import "@particle-academy/fancy-git-ui/styles.css";
import { GIT_BRANCHES, GIT_COMMITS, GIT_DIFF, GIT_REVIEWS, GIT_STATUS, GIT_TREE } from "./gitFixtures";
import type {
    WorkingTreeStatus as FancyGitWorkingTreeStatus,
    Commit as FancyGitCommit,
    Branch as FancyGitBranch,
    Review as FancyGitReview,
    CreateReviewInput as FancyGitCreateReviewInput,
} from "@particle-academy/fancy-git";
import { Map as FancyMap, type MapMarker as FancyMapMarker, type MapView as FancyMapView } from "@particle-academy/fancy-map";
import { leafletProvider } from "@particle-academy/fancy-map/leaflet";
import "leaflet/dist/leaflet.css";
import { Screen, ScreenSystem } from "@particle-academy/fancy-screens";
import { Canvas, type CanvasEngineSpec} from "@particle-academy/fancy-3d";
import { AgentPanel } from "@particle-academy/agent-integrations";
import {
    DeckEditor as FsDeckEditor,
    PresenterView as FsPresenterView,
    Slide as FsSlide,
    SlideViewer as FsSlideViewer,
    defaultTheme as fsDefaultTheme,
    darkTheme as fsDarkTheme,
    type Deck as FsDeck,
} from "@particle-academy/fancy-slides";
import "@particle-academy/fancy-slides/styles.css";
import { Editor as CmsEditor, CmsPage, CmsRegion, type PageDoc } from "@particle-academy/fancy-cms-ui";
import { PptxExportControl } from "./PptxExportControl";
import {
    CANONICAL_SLIDE,
    CANONICAL_DECK,
    CANONICAL_TEXT_SLIDE,
    CANONICAL_IMAGE_BOX,
    CANONICAL_IMAGE_SRC,
    CANONICAL_SHAPES_SLIDE,
    CANONICAL_HIGHLIGHTED_CODE,
    CANONICAL_HIGHLIGHTED_TOKENS,
    HIGHLIGHT_KIND_COLOR,
    PPTX_WRITER_COVERAGE,
    PPTX_READER_ROUNDTRIP,
    CMS_DEMO_DOC,
    CMS_BOUND_DOC,
    CMS_HERO_ID,
    CMS_STATS_ID,
    CMS_DATA_LAUNCH,
    CMS_DATA_STUDIO,
} from "./showcase-fixtures";

type DemoFn = () => ReactElement;

const REGISTRY: Record<string, DemoFn> = {
    // Buttons / actions
    "react-fancy/button": ActionDemo,
    "react-fancy/magic-wand": MagicWandDemo,
    // Text
    "react-fancy/heading": HeadingDemo,
    "react-fancy/text": TextDemo,
    "react-fancy/badge": BadgeDemo,
    "react-fancy/separator": SeparatorDemo,
    "react-fancy/brand": BrandDemo,
    "react-fancy/profile": ProfileDemo,
    "react-fancy/avatar": AvatarDemo,
    "react-fancy/icon": IconDemo,
    "react-fancy/emoji": EmojiDemo,
    "react-fancy/skeleton": SkeletonDemo,
    "react-fancy/progress": ProgressDemo,
    "react-fancy/reason-tag": ReasonTagDemo,
    // Card / container
    "react-fancy/card": CardDemo,
    "react-fancy/faux-client": FauxClientDemo,
    "react-fancy/callout": CalloutDemo,
    // Navigation
    "react-fancy/breadcrumbs": BreadcrumbsDemo,
    "react-fancy/tabs": TabsDemo,
    "react-fancy/accordion": AccordionDemo,
    "react-fancy/navbar": NavbarDemo,
    "react-fancy/sidebar": SidebarDemo,
    "react-fancy/mobile-menu": MobileMenuDemo,
    "react-fancy/menu": MenuDemo,
    "react-fancy/tree-nav": TreeNavDemo,
    "react-fancy/file-browser": FileBrowserDemo,
    "react-fancy/pagination": PaginationDemo,
    // Overlays
    "react-fancy/tooltip": TooltipDemo,
    "react-fancy/popover": PopoverDemo,
    "react-fancy/drawer": DrawerDemo,
    "react-fancy/dropdown": DropdownDemo,
    "react-fancy/context-menu": ContextMenuDemo,
    "react-fancy/modal": ModalDemo,
    "react-fancy/toast": ToastDemo,
    "react-fancy/command": CommandDemo,
    "react-fancy/portal": PortalDemo,
    // Inputs / pickers
    "react-fancy/inputs": InputsDemo,
    "react-fancy/input-tag": InputTagDemo,
    "react-fancy/pillbox": PillboxDemo,
    "react-fancy/autocomplete": AutocompleteDemo,
    "react-fancy/file-upload": FileUploadDemo,
    "react-fancy/otp-input": OtpInputDemo,
    "react-fancy/calendar": CalendarDemo,
    "react-fancy/time-picker": TimePickerDemo,
    "react-fancy/color-picker": ColorPickerDemo,
    "react-fancy/emoji-select": EmojiSelectDemo,
    "react-fancy/mood-meter": MoodMeterDemo,
    "react-fancy/prompt-input": PromptInputDemo,
    "react-fancy/composer": ComposerDemo,
    "react-fancy/chat-drawer": ChatDrawerDemo,
    // Content
    "react-fancy/timeline": TimelineDemo,
    "react-fancy/table": TableDemo,
    "react-fancy/carousel": CarouselDemo,
    "react-fancy/marquee": MarqueeDemo,
    "react-fancy/chart": ChartDemo,
    "react-fancy/kanban": KanbanDemo,
    "react-fancy/content-renderer": ContentRendererDemo,
    "react-fancy/editor": EditorDemo,

    // ── fancy-whiteboard
    "fancy-whiteboard/board": WhiteboardBoardDemo,
    "fancy-whiteboard/sticky-note": WhiteboardStickyDemo,
    "fancy-whiteboard/cursor-layer": WhiteboardCursorDemo,
    "fancy-whiteboard/connector": WhiteboardConnectorDemo,
    "fancy-whiteboard/shape": WhiteboardShapeDemo,
    "fancy-whiteboard/drawing": WhiteboardDrawingDemo,

    // ── fancy-artboard
    "fancy-artboard/artboard": ArtboardDemo,
    "fancy-artboard/art-piece": ArtPieceDemo,
    "fancy-artboard/artboard-section": ArtboardSectionDemo,
    "fancy-artboard/artboard-note": ArtboardNoteDemo,

    // ── fancy-flow
    "fancy-flow/flow-editor": FlowEditorDemo,
    "fancy-flow/flow-viewer": FlowViewerDemo,
    "fancy-flow/use-flow-state": FlowStateHookDemo,
    "fancy-flow/use-flow-run": FlowRunHookDemo,
    "fancy-flow/run-flow": RunFlowDemo,
    "fancy-flow/flow-runner-ux": FlowRunnerUxDemo,

    // ── fancy-diff
    "fancy-diff/fancy-diff": FancyDiffDemo,

    // ── fancy-pixel
    "fancy-pixel/pixel": FancyPixelDemo,

    // ── fancy-sheets
    "fancy-sheets/sheet-workbook": SheetWorkbookDemo,
    "fancy-sheets/create-empty-workbook": EmptyWorkbookDemo,

    // ── fancy-code
    "fancy-code/code-editor": CodeEditorDemo,
    "fancy-code/markdown-editor": MarkdownEditorDemo,

    // ── fancy-term
    "fancy-term/terminal": FancyTerminalDemo,

    // ── fancy-echarts
    "fancy-echarts/echart": EChartDemo,

    // ── fancy-git-ui
    "fancy-git-ui/working-tree": GitWorkingTreeDemo,
    "fancy-git-ui/commit-history": GitCommitHistoryDemo,
    "fancy-git-ui/review-list": GitReviewListDemo,
    "fancy-git-ui/repository-browser": GitRepositoryBrowserDemo,
    "fancy-git-ui/diff-viewer": GitDiffViewerDemo,
    "fancy-git-ui/branch-picker": GitBranchPickerDemo,
    "fancy-git-ui/commit-composer": GitCommitComposerDemo,
    "fancy-git-ui/create-review-form": GitCreateReviewFormDemo,

    // ── fancy-map
    "fancy-map/map": FancyMapDemo,

    // ── fancy-screens
    "fancy-screens/screen-system": ScreenSystemDemo,
    "fancy-screens/screen": ScreenDemo,

    // ── fancy-3d (engine-agnostic core)
    "fancy-3d/canvas": Fancy3DCanvasDemo,
    // ── fancy-3d-babylon (Babylon adapter)
    "fancy-3d-babylon/stage": Fancy3DStageDemo,
    "fancy-3d-babylon/monitor": Fancy3DMonitorDemo,
    "fancy-3d-babylon/card-3d": Fancy3DCard3DDemo,
    // ── fancy-3d-three (three.js adapter)
    "fancy-3d-three/stage": Fancy3DThreeStageDemo,
    "fancy-3d-three/monitor": Fancy3DThreeMonitorDemo,
    "fancy-3d-three/card-3d": Fancy3DThreeCard3DDemo,

    // ── agent-integrations
    "agent-integrations/micro-mcp-server": MicroMcpServerDemo,
    "agent-integrations/agent-panel": AgentPanelDemo,
    "agent-integrations/agent-cursor": AgentCursorDemo,
    "agent-integrations/shared-whiteboard": SharedWhiteboardDemo,
    "agent-integrations/share-controls": ShareControlsDemo,

    // ── holy-sheet (PHP — code-snippet only)
    "holy-sheet/agent": HolySheetAgentDemo,

    // ── fancy-slides
    "fancy-slides/slide": FsSlideRegistryDemo,
    "fancy-slides/slide-viewer": FsSlideViewerRegistryDemo,
    "fancy-slides/presenter-view": FsPresenterViewRegistryDemo,
    "fancy-slides/deck-editor": FsDeckEditorRegistryDemo,
    "fancy-slides/text-element": FsTextElementRegistryDemo,
    "fancy-slides/image-element": FsImageElementRegistryDemo,
    "fancy-slides/shape-element": FsShapeElementRegistryDemo,

    // ── dark-slide (PHP — code-snippet + live PPTX export)
    "dark-slide/agent": DarkSlideAgentRegistryDemo,
    "dark-slide/pptx-writer": DarkSlidePptxWriterRegistryDemo,
    "dark-slide/pptx-reader": DarkSlidePptxReaderRegistryDemo,
    "dark-slide/syntax-highlighter": DarkSlideSyntaxHighlighterRegistryDemo,

    // ── fancy-inertia
    "fancy-inertia/fancy-app-root": FancyAppRootDemo,
    "fancy-inertia/use-fancy-form": UseFancyFormDemo,

    // ── fancy-mlm-ui
    "fancy-mlm-ui/downline-tree": MlmDownlineTreeDemo,
    "fancy-mlm-ui/commission-statement": MlmCommissionStatementDemo,
    "fancy-mlm-ui/rank-progress": MlmRankProgressDemo,

    // ── fancy-cms-ui
    "fancy-cms-ui/cms-editor": CmsEditorDemo,
    "fancy-cms-ui/cms-page": CmsPageDemo,
    "fancy-cms-ui/cms-region": CmsRegionDemo,

    // ── fancy-x-files-ui
    "fancy-x-files-ui/robots-editor": XfRobotsEditorDemo,
    "fancy-x-files-ui/security-txt-editor": XfSecurityTxtEditorDemo,
    "fancy-x-files-ui/llms-txt-editor": XfLlmsTxtEditorDemo,
    "react-fancy/json-editor": JsonEditorDemo,
    "catalog-fms/pricing-table": PricingTableDemo,
    "catalog-fms/feature-matrix": FeatureMatrixDemo,
    "catalog-fms/feature-gate": FeatureGateDemo,
    "catalog-fms/plan-features-editor": PlanFeaturesEditorDemo,
    "fancy-3d-babylon/engine": BabylonEngineDemo,
    "fancy-3d-three/engine": ThreeEngineDemo,
    "react-fancy/catalog-fms": CatalogFmsDemo,
    "fancy-3d-babylon/fancy-3d-babylon-engine": BabylonEngineDemo,
    "fancy-3d-three/fancy-3d-three-engine": ThreeEngineDemo,
    "fancy-passkeys-ui/passkey-manager": PasskeyManagerDemo,
    "fancy-passkeys-ui/passkey-sign-in": PasskeySignInDemo,
    "fancy-echarts/echart-3d": EChart3DDemo,
    "fancy-echarts/echart-graphic": EChartGraphicDemo,
    "fancy-3d/scene": SceneDemo,
    "classroom/curriculum-overview": CurriculumOverviewDemo,
    "classroom/lesson-view": LessonViewDemo,
    "classroom/question-renderer": QuestionRendererDemo,
    "classroom/test-runner": TestRunnerDemo,
    "classroom/course-player": CoursePlayerDemo,
    "classroom/certificate-view": CertificateViewDemo,
    "job-board/job-detail": JobDetailDemo,
    "job-board/employer-job-list": EmployerJobListDemo,
    "job-board/application-list": ApplicationListDemo,
    "job-board/apply-form": ApplyFormDemo,
    "job-board/job-posting-form": JobPostingFormDemo,
    "teachers-aid-ui/chat-transcript": ChatTranscriptDemo,
    "teachers-aid-ui/message-composer": MessageComposerDemo,
    "teachers-aid-ui/plan-review": PlanReviewDemo,
    "teachers-aid-ui/teachers-aid-chat": TeachersAidChatDemo,
    "fancy-passkeys-ui/passkey-status": PasskeyStatusDemo,
    "fancy-pwa/pwa": PwaBannersDemo,
    "fancy-motion/motion-stage": MotionStageDemo,
    "fancy-motion/timeline-dock": TimelineDockDemo,
    "fancy-code/file-viewer": FileViewerDemo,
    "react-fancy/grid": GridDemo,
    "react-fancy/container": ContainerDemo,
    "react-fancy/section": SectionDemo,
    "react-fancy/kbd": KbdDemo,
    "react-fancy/eyebrow": EyebrowDemo,
    "react-fancy/pull-quote": PullQuoteDemo,
    "react-fancy/stat": StatDemo,
    "react-fancy/stat-list": StatListDemo,
    "react-fancy/index-list": IndexListDemo,
    "react-fancy/time-grid": TimeGridDemo,
    "react-fancy/code-view": CodeViewDemo,
    "react-fancy/accordion-panel": AccordionPanelDemo,
    "react-fancy/media-viewer": MediaViewerDemo,
    "react-fancy/image-viewer": ImageViewerDemo,
    "react-fancy/video-viewer": VideoViewerDemo,
    "react-fancy/audio-viewer": AudioViewerDemo,
    "react-fancy/pdf-viewer": PdfViewerDemo,
    "react-fancy/sticky-note": StickyNoteDemo,
    "fancy-x-files-ui/humans-txt-editor": XfHumansTxtEditorDemo,
    "fancy-x-files-ui/sitemap-editor": XfSitemapEditorDemo,
    "fancy-x-files-ui/agents-editor": XfAgentsEditorDemo,
    "fancy-x-files-ui/x-file-preview": XfFilePreviewDemo,
    "fancy-x-files-ui/x-files-manager": XfFilesManagerDemo,
};

export function ComponentDemo({ slug, name, pkg }: { slug: string; name: string; pkg: string }) {
    // Falls back to the UNQUALIFIED slug for the same reason getComponentPreview
    // does: the registry package-qualifies a name when it would collide across
    // packages (`react-fancy-sticky-note`), while this map keys on the bare one.
    const Demo =
        REGISTRY[`${pkg}/${slug}`] ??
        (slug.startsWith(`${pkg}-`) ? REGISTRY[`${pkg}/${slug.slice(pkg.length + 1)}`] : undefined);
    if (Demo) return <Demo />;
    return (
        // `grid place-items-center` made every inline child its own grid item,
        // so this sentence rendered one fragment per line — "Interactive demo
        // for" / "Grid" / "isn't wired yet. The" / "Install" / … A flex row with
        // a single text child keeps it a sentence.
        <div className="flex min-h-[8rem] items-center justify-center rounded-md border border-dashed border-zinc-300 bg-zinc-50 p-10 dark:border-zinc-700 dark:bg-zinc-950">
            <p className="max-w-prose text-center text-sm text-zinc-500">
                Interactive demo for <code className="font-mono">{name}</code> isn&apos;t wired yet.
                The <strong>Install</strong> and <strong>Source</strong> tabs above have the import
                snippet and the component&apos;s source.
            </p>
        </div>
    );
}

// ─── Demos ──────────────────────────────────────────────────────────────────

// ─── react-fancy: layout, editorial, stat + media components ────────────────
//
// These nineteen were the largest block of "Interactive demo for X isn't wired
// yet" on the site. Every one of them HAD a tile preview — that grid was made
// complete and is test-enforced — but a tile is a thumbnail, and the detail
// page is where someone decides whether to use the thing. Advertising a
// component and then showing a dashed box on its own page costs a reader their
// time and tells them the component is unfinished.

function GridDemo() {
    const [cols, setCols] = useState<2 | 3 | 4 | 6>(3);
    const [gap, setGap] = useState<"sm" | "md" | "lg">("md");
    return (
        <DemoNote
            outOfBox="The responsive grid, its column counts and its gap scale."
            demo="The two pickers are demo scaffolding — a host sets cols and gap as props."
        >
            <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-4 text-xs">
                    <span className="flex items-center gap-2">
                        <span className="text-zinc-500">cols</span>
                        {([2, 3, 4, 6] as const).map((n) => (
                            <Button key={n} size="xs" color={cols === n ? "violet" : "zinc"} onClick={() => setCols(n)}>
                                {n}
                            </Button>
                        ))}
                    </span>
                    <span className="flex items-center gap-2">
                        <span className="text-zinc-500">gap</span>
                        {(["sm", "md", "lg"] as const).map((g) => (
                            <Button key={g} size="xs" color={gap === g ? "violet" : "zinc"} onClick={() => setGap(g)}>
                                {g}
                            </Button>
                        ))}
                    </span>
                </div>
                <Grid cols={cols} gap={gap}>
                    {Array.from({ length: 12 }, (_, i) => (
                        <div key={i} className="grid h-12 place-items-center rounded bg-violet-100 text-xs font-medium text-violet-900 dark:bg-violet-500/20 dark:text-violet-100">
                            {i + 1}
                        </div>
                    ))}
                </Grid>
            </div>
        </DemoNote>
    );
}

function ContainerDemo() {
    const [size, setSize] = useState<"sm" | "md" | "lg" | "full">("md");
    return (
        <DemoNote
            outOfBox="The measure cap and the centring — Container is what stops a paragraph running the full width of a 4K monitor."
            demo="The size picker; the dashed edge stands in for the viewport."
        >
            <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs">
                    <span className="text-zinc-500">size</span>
                    {(["sm", "md", "lg", "full"] as const).map((s) => (
                        <Button key={s} size="xs" color={size === s ? "violet" : "zinc"} onClick={() => setSize(s)}>
                            {s}
                        </Button>
                    ))}
                </div>
                <div className="rounded-md border border-dashed border-zinc-300 p-3 dark:border-zinc-700">
                    <Container size={size} className="rounded bg-violet-50 px-4 py-3 text-sm text-violet-900 ring-1 ring-violet-200 dark:bg-violet-500/10 dark:text-violet-100 dark:ring-violet-500/30">
                        A measure this wide stays readable. Past roughly 75 characters the eye loses
                        the start of the next line, which is the whole reason this component exists.
                    </Container>
                </div>
            </div>
        </DemoNote>
    );
}

function SectionDemo() {
    const [divider, setDivider] = useState(true);
    return (
        <DemoNote
            outOfBox="Vertical rhythm between blocks, and the optional rule between them."
            demo="The divider toggle and the three blocks of copy."
        >
            <div className="space-y-3">
                <label className="flex items-center gap-2 text-xs text-zinc-500">
                    <input type="checkbox" checked={divider} onChange={(e) => setDivider(e.target.checked)} />
                    divider
                </label>
                <div>
                    {[
                        ["Authoring surface", "Terse props, JSON-friendly inputs, sensible defaults."],
                        ["Inhabited surface", "Agents read and write state through MCP bridges, not DOM scraping."],
                        ["Trust but verify", "Destructive actions stage a proposal a human confirms."],
                    ].map(([title, body]) => (
                        <Section key={title} space="md" divider={divider}>
                            <Heading size="sm">{title}</Heading>
                            <Text size="sm" className="!text-zinc-500">{body}</Text>
                        </Section>
                    ))}
                </div>
            </div>
        </DemoNote>
    );
}

function KbdDemo() {
    return (
        <div className="space-y-2 text-sm">
            {[
                { keys: ["⌘", "K"], what: "Open the command palette" },
                { keys: ["Shift", "?"], what: "Show every shortcut" },
                { keys: ["g", "p"], what: "Go to packages" },
                { keys: ["Esc"], what: "Dismiss the current layer" },
            ].map((row) => (
                <div key={row.what} className="flex items-center gap-3">
                    <Kbd keys={row.keys} />
                    <span className="text-zinc-500">{row.what}</span>
                </div>
            ))}
        </div>
    );
}

function EyebrowDemo() {
    return (
        <div className="max-w-prose space-y-8">
            <div>
                <Eyebrow num="01" label="Human+ UX" aside="2026" rule />
                <Heading size="md" className="mt-2">Agents ride shotgun</Heading>
                <Text size="sm" className="!text-zinc-500">
                    With rule, an eyebrow doubles as the section break.
                </Text>
            </div>
            <div>
                <Eyebrow label="No number, no rule" />
                <Heading size="md" className="mt-2">Every part is optional</Heading>
            </div>
        </div>
    );
}

function PullQuoteDemo() {
    return (
        <div className="max-w-prose space-y-8">
            <PullQuote attribution="Component contract" source="AGENTS.md" rule>
                The component itself is the agent&apos;s affordance, not an external target.
            </PullQuote>
            <PullQuote>A quote with no attribution still sets its own measure.</PullQuote>
        </div>
    );
}

function StatDemo() {
    return (
        <div className="flex flex-wrap items-end gap-10">
            <Stat value="2,431" label="Files synced" />
            <Stat value="99.98%" label="Uptime" />
            <Stat value="14ms" label="p50 latency" />
        </div>
    );
}

function StatListDemo() {
    return (
        <StatList
            className="max-w-sm"
            items={[
                { value: "279", label: "Registry items" },
                { value: "70", label: "Packages" },
                { value: "0.5", label: "Kit version" },
                { value: "21", label: "Agent bridges" },
            ]}
        />
    );
}

function IndexListDemo() {
    return (
        <IndexList
            className="max-w-md"
            items={[
                { num: "01", title: "Fieldwork", meta: "20 styles" },
                { num: "02", title: "Mom-n-Pops", meta: "20 styles" },
                { num: "03", title: "Dashboards", meta: "20 styles" },
            ]}
        />
    );
}

function TimeGridDemo() {
    const [value, setValue] = useState<boolean[][]>([
        [false, true, false, true, false],
        [true, true, false, false, true],
        [false, false, true, true, false],
        [true, false, true, false, true],
        [false, true, true, false, false],
    ]);
    const on = value.flat().filter(Boolean).length;
    return (
        <DemoNote
            outOfBox="The grid, the click/drag selection and the controlled value."
            demo="The slot labels and the running count below."
        >
            <div className="space-y-3">
                <TimeGrid
                    rows={["9am", "11am", "1pm", "3pm", "5pm"]}
                    cols={["Mon", "Tue", "Wed", "Thu", "Fri"]}
                    toneOn="violet"
                    value={value}
                    onChange={setValue}
                />
                <Text size="sm" className="!text-zinc-500">
                    {on} slot{on === 1 ? "" : "s"} selected — click or drag across the grid.
                </Text>
            </div>
        </DemoNote>
    );
}

function CodeViewDemo() {
    return (
        <div className="max-w-xl overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-800">
            <CodeView value={SAMPLE_CODE_VIEW} language="html" readOnly minHeight={120} />
        </div>
    );
}

function AccordionPanelDemo() {
    const [open, setOpen] = useState<string[]>(["shipping"]);
    return (
        <DemoNote
            outOfBox="The panel, its sections, the open-state tracking and the triggers."
            demo="The three sections' copy and the open-id readout."
        >
            <div className="space-y-3">
                <AccordionPanel
                    value={open}
                    onValueChange={setOpen}
                    className="max-w-md rounded-md border border-zinc-200 dark:border-zinc-800"
                >
                    {[
                        { id: "shipping", title: "Shipping & returns", body: "Ships in 2 business days. Returns accepted for 30." },
                        { id: "sizing", title: "Sizing", body: "Runs true to size. Between sizes, size up." },
                        { id: "care", title: "Care", body: "Cold wash, hang dry, do not tumble." },
                    ].map((s) => (
                        <AccordionPanelSection key={s.id} id={s.id}>
                            <AccordionPanelTrigger>{s.title}</AccordionPanelTrigger>
                            <AccordionPanelContent>
                                <Text size="sm" className="!text-zinc-500">{s.body}</Text>
                            </AccordionPanelContent>
                        </AccordionPanelSection>
                    ))}
                </AccordionPanel>
                <Text size="xs" className="!text-zinc-500">
                    open: {open.length ? open.join(", ") : "(none)"} — controlled, so an agent can set it.
                </Text>
            </div>
        </DemoNote>
    );
}

/**
 * The demo that answers "why are there so many media viewers?".
 *
 * There is ONE you reach for — MediaViewer — and it resolves the right
 * specialised viewer from the source. The other four are what it delegates to,
 * exported so you can skip the detection when you already know the type.
 */
function MediaViewerDemo() {
    const sources = [
        { label: "Image", src: SAMPLE_IMG, note: "resolves to ImageViewer" },
        { label: "PDF", src: SAMPLE_PDF, note: "resolves to PdfViewer" },
        { label: "Audio", src: SILENT_WAV, note: "resolves to AudioViewer" },
    ];
    const [i, setI] = useState(0);
    const current = sources[i]!;
    return (
        <DemoNote
            outOfBox="Type detection from the src, and the viewer it hands off to."
            demo="The three sample files and the source switcher."
        >
            <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="text-zinc-500">src</span>
                    {sources.map((s, idx) => (
                        <Button key={s.label} size="xs" color={i === idx ? "violet" : "zinc"} onClick={() => setI(idx)}>
                            {s.label}
                        </Button>
                    ))}
                    <span className="text-zinc-400">{current.note}</span>
                </div>
                <div className="h-64 max-w-xl overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-800">
                    <MediaViewer key={current.src} src={current.src} alt={current.label} style={{ height: "100%" }} />
                </div>
            </div>
        </DemoNote>
    );
}

function ImageViewerDemo() {
    const [fit, setFit] = useState<"cover" | "contain">("contain");
    return (
        <DemoNote
            outOfBox="Zoom, pan, and the fit modes."
            demo="The fit picker and the sample screenshot."
        >
            <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs">
                    <span className="text-zinc-500">fit</span>
                    {(["contain", "cover"] as const).map((f) => (
                        <Button key={f} size="xs" color={fit === f ? "violet" : "zinc"} onClick={() => setFit(f)}>
                            {f}
                        </Button>
                    ))}
                </div>
                <div className="h-64 max-w-xl overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-800">
                    <ImageViewer src={SAMPLE_IMG} alt="Scroll to zoom, drag to pan" fit={fit} style={{ height: "100%" }} />
                </div>
            </div>
        </DemoNote>
    );
}

function VideoViewerDemo() {
    return (
        <DemoNote
            outOfBox="The player chrome, poster handling and fit."
            demo="The poster image — this demo ships no video file, so there is nothing to play."
        >
            <div className="h-64 max-w-xl overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-800">
                <VideoViewer src="" poster={SAMPLE_POSTER} controls muted fit="contain" />
            </div>
        </DemoNote>
    );
}

function AudioViewerDemo() {
    return (
        <DemoNote
            outOfBox="The transport, the scrubber and the title row."
            demo="The clip is a valid but completely SILENT wav — it is here to show the chrome, not to play."
        >
            <div className="max-w-md">
                <AudioViewer src={SILENT_WAV} title="podcast-ep-12.mp3" />
            </div>
        </DemoNote>
    );
}

function PdfViewerDemo() {
    return (
        <div className="h-80 max-w-xl overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-800">
            <PdfViewer src={SAMPLE_PDF} title="sample.pdf" />
        </div>
    );
}

function StickyNoteDemo() {
    const [notes, setNotes] = useState([
        { id: 1, text: "Ship the dream", color: "yellow" as const, rotate: -4 },
        { id: 2, text: "Review PR #42", color: "violet" as const, rotate: 3 },
        { id: 3, text: "Edit me — I'm controlled", color: "green" as const, rotate: -1 },
    ]);
    return (
        <DemoNote
            outOfBox="The note, its colours, the rotation and in-place editing."
            demo="The three starting notes. Editing writes to local state, as a host would."
        >
            <div className="flex flex-wrap items-center gap-8 p-2">
                {notes.map((n) => (
                    <RfStickyNote
                        key={n.id}
                        value={n.text}
                        color={n.color}
                        rotate={n.rotate}
                        width={150}
                        onChange={(text: string) =>
                            setNotes((prev) => prev.map((p) => (p.id === n.id ? { ...p, text } : p)))
                        }
                    />
                ))}
            </div>
        </DemoNote>
    );
}

/**
 * Wraps a rich/interactive demo with a clear "what's stock vs what's demo
 * scaffolding" footnote, so readers never confuse demo-only seed data or stub
 * handlers for out-of-the-box behaviour. `outOfBox` is required; `demo` is
 * optional (omit when the demo adds nothing beyond seed data).
 */
function DemoNote({ children, outOfBox, demo }: { children: ReactNode; outOfBox: string; demo?: string }) {
    return (
        <div className="space-y-2.5">
            {children}
            <div className="rounded-md border border-zinc-200 bg-zinc-50/70 px-3 py-2.5 text-[12px] leading-relaxed dark:border-zinc-800 dark:bg-zinc-900/40">
                <p className="text-zinc-600 dark:text-zinc-300">
                    <span className="mr-1.5 inline-block rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                        Out of the box
                    </span>
                    {outOfBox}
                </p>
                {demo && (
                    <p className="mt-1.5 text-zinc-600 dark:text-zinc-300">
                        <span className="mr-1.5 inline-block rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
                            Demo only
                        </span>
                        {demo}
                    </p>
                )}
            </div>
        </div>
    );
}

function ActionDemo() {
    return (
        <div className="space-y-5">
            <div className="flex flex-wrap gap-2">
                <Button color="violet">Primary</Button>
                <Button>Default</Button>
                <Button variant="ghost">Ghost</Button>
                <Button color="emerald" icon="check">Save</Button>
                <Button color="red" variant="ghost" icon="trash">Delete</Button>
                <Button disabled>Disabled</Button>
                <Button variant="circle" icon="search" aria-label="Search" />
                <Button variant="circle" color="violet" icon="plus" aria-label="New" />
            </div>
            <div>
                <div className="mb-2 text-xs font-medium text-zinc-500">Constrained width · multi-word labels stack left-aligned, icon stays put</div>
                <div className="flex items-start gap-3">
                    <div style={{ width: 104 }}>
                        <Button color="violet" icon="plus" className="w-full">New customer</Button>
                    </div>
                    <div style={{ width: 104 }}>
                        <Button color="emerald" icon="check" className="w-full">Save changes now</Button>
                    </div>
                    <div style={{ width: 104 }}>
                        <Button color="violet" icon="plus" iconPlace="top" className="w-full">New customer</Button>
                    </div>
                    <div style={{ width: 104 }}>
                        <Button color="violet" icon="plus" className="w-full text-center">Centered override</Button>
                    </div>
                </div>
            </div>
            <div>
                <div className="mb-2 text-xs font-medium text-zinc-500"><code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">responsive</code> · label hides below the <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">sm</code> breakpoint (resize the window)</div>
                <div className="flex flex-wrap gap-2">
                    <Button color="violet" icon="plus" responsive>New customer</Button>
                    <Button color="emerald" icon="check" responsive>Save</Button>
                    <Button variant="ghost" icon="trash" responsive>Delete</Button>
                </div>
            </div>
        </div>
    );
}

function BadgeDemo() {
    return (
        <div className="flex flex-wrap items-center gap-2">
            <Badge color="emerald">active</Badge>
            <Badge color="amber">pending</Badge>
            <Badge color="red">error</Badge>
            <Badge color="sky">info</Badge>
            <Badge color="violet">new</Badge>
            <Badge color="zinc">archived</Badge>
            <Badge color="emerald" size="sm">small</Badge>
            <Badge color="violet" size="lg">large</Badge>
        </div>
    );
}

function FauxClientDemo() {
    return (
        <div className="grid gap-4 sm:grid-cols-2">
            <FauxClient variant="browser" url="fancy.test/agent-playground" meta="UTF-8">
                <div className="space-y-2 p-5">
                    <Badge color="emerald" dot>live</Badge>
                    <Text className="!font-semibold">Real, interactive UI</Text>
                    <Text size="sm" className="!text-zinc-500">The children render normally — this Button works.</Text>
                    <Button color="violet" size="sm" icon="sparkles">Try it</Button>
                </div>
            </FauxClient>
            <FauxClient variant="device">
                <div className="space-y-2 p-5">
                    <Text className="!font-semibold">Device chrome</Text>
                    <Text size="sm" className="!text-zinc-500">Same component, mobile/device framing.</Text>
                </div>
            </FauxClient>
        </div>
    );
}

function CardDemo() {
    return (
        <div className="grid gap-3 sm:grid-cols-3">
            <Card variant="outlined">
                <Card.Header>Outlined</Card.Header>
                <Card.Body><Text size="sm">Standard border, white background.</Text></Card.Body>
            </Card>
            <Card variant="elevated">
                <Card.Header>Elevated</Card.Header>
                <Card.Body><Text size="sm">Soft shadow, no heavy border.</Text></Card.Body>
            </Card>
            <Card variant="flat">
                <Card.Header>Flat</Card.Header>
                <Card.Body><Text size="sm">Recessed surface for grouping.</Text></Card.Body>
            </Card>
        </div>
    );
}

function HeadingDemo() {
    return (
        <div className="space-y-2">
            <Heading as="h1" size="xl">Heading XL</Heading>
            <Heading as="h2" size="lg">Heading LG</Heading>
            <Heading as="h3" size="md">Heading MD</Heading>
            <Heading as="h4" size="sm">Heading SM</Heading>
        </div>
    );
}

function TextDemo() {
    return (
        <div className="space-y-2">
            <Text>The workhorse body text.</Text>
            <Text size="sm">Smaller text for captions.</Text>
            <Text size="xs" className="!text-zinc-500">Even smaller and muted.</Text>
        </div>
    );
}

function SeparatorDemo() {
    return (
        <div className="space-y-3 text-sm">
            <div>Above the line.</div>
            <Separator />
            <div>Below the line.</div>
        </div>
    );
}

function AvatarDemo() {
    return (
        <div className="flex items-center gap-3">
            <Avatar alt="Glenn Wagner" fallback="GW" />
            <Avatar alt="Rita Kumar" fallback="RK" />
            <Avatar alt="Sam Lin" fallback="SL" />
            <Avatar alt="Ayodeji Adekola" fallback="AA" />
        </div>
    );
}

function BrandDemo() {
    return (
        <Brand
            logo={<img src="/showcase-assets/fancy-ui-logo.jpg" alt="" className="h-7 w-7 rounded" />}
            name="Fancy UI Kit"
            tagline="Particle Academy"
        />
    );
}

function SkeletonDemo() {
    return (
        <div className="max-w-sm space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-2/3" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-20 w-full" />
        </div>
    );
}

function ProgressDemo() {
    const [v, setV] = useState(42);
    return (
        <div className="space-y-3">
            <Progress value={v} />
            <div className="flex items-center justify-between text-xs">
                <span className="font-mono">{v}%</span>
                <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => setV((x) => Math.max(0, x - 10))}>−10</Button>
                    <Button variant="ghost" size="sm" onClick={() => setV((x) => Math.min(100, x + 10))}>+10</Button>
                </div>
            </div>
        </div>
    );
}

function BreadcrumbsDemo() {
    return (
        <Breadcrumbs>
            <Breadcrumbs.Item href="#">Workspace</Breadcrumbs.Item>
            <Breadcrumbs.Item href="#">Projects</Breadcrumbs.Item>
            <Breadcrumbs.Item href="#">Onboarding</Breadcrumbs.Item>
            <Breadcrumbs.Item>Step 3</Breadcrumbs.Item>
        </Breadcrumbs>
    );
}

function TabsDemo() {
    return (
        <Tabs defaultTab="overview">
            <Tabs.List>
                <Tabs.Tab value="overview">Overview</Tabs.Tab>
                <Tabs.Tab value="activity">Activity</Tabs.Tab>
                <Tabs.Tab value="settings">Settings</Tabs.Tab>
            </Tabs.List>
            <Tabs.Panels>
                <Tabs.Panel value="overview"><div className="p-3 text-sm">Project overview content.</div></Tabs.Panel>
                <Tabs.Panel value="activity"><div className="p-3 text-sm">Recent activity feed.</div></Tabs.Panel>
                <Tabs.Panel value="settings"><div className="p-3 text-sm">Project settings form.</div></Tabs.Panel>
            </Tabs.Panels>
        </Tabs>
    );
}

function AccordionDemo() {
    return (
        <Accordion>
            <Accordion.Item value="a">
                <Accordion.Trigger>What's Human+ UX?</Accordion.Trigger>
                <Accordion.Content>UI built for humans and agents to share the same surface, trading control fluidly.</Accordion.Content>
            </Accordion.Item>
            <Accordion.Item value="b">
                <Accordion.Trigger>Why not Playwright?</Accordion.Trigger>
                <Accordion.Content>Brittle, slow, expensive. Bridges expose typed tools so agents drive without screen-scraping.</Accordion.Content>
            </Accordion.Item>
            <Accordion.Item value="c">
                <Accordion.Trigger>What's the contract?</Accordion.Trigger>
                <Accordion.Content>Controlled state, stable handles, JSON-friendly inputs, bridgeable, observable, trust-but-verify.</Accordion.Content>
            </Accordion.Item>
        </Accordion>
    );
}

function CalloutDemo() {
    return (
        <div className="space-y-2">
            <Callout color="blue">Heads up — Inertia is the chrome layer.</Callout>
            <Callout color="green">Tests passed. Deploy is green.</Callout>
            <Callout color="amber">Heuristic, not deterministic — verify before sending.</Callout>
            <Callout color="red">Couldn't reach the upstream API.</Callout>
        </div>
    );
}

function TimelineDemo() {
    return (
        <Timeline>
            <Timeline.Item date="May 16" color="emerald">
                <strong>v0.6.1 released</strong>{" — "}                Inertia + react-fancy chrome live across the showcase.
            </Timeline.Item>
            <Timeline.Item date="May 15" color="violet">
                <strong>v0.6.0 released</strong>{" — "}                Showcase site Phase 1 → Phase 6 shipped.
            </Timeline.Item>
            <Timeline.Item date="May 11" color="sky">
                <strong>Dreaming branch opened</strong>{" — "}                First wave of speculative components: 24 ideas.
            </Timeline.Item>
        </Timeline>
    );
}

function PaginationDemo() {
    const [page, setPage] = useState(3);
    return <Pagination page={page} totalPages={12} onPageChange={setPage} />;
}

function TooltipDemo() {
    return (
        <div className="flex gap-3">
            <Tooltip content="Pin this dream">
                <Button variant="circle" icon="star" aria-label="Pin" />
            </Tooltip>
            <Tooltip content="Tooltips appear on hover">
                <Button>Hover me</Button>
            </Tooltip>
        </div>
    );
}

function PopoverDemo() {
    return (
        <Popover>
            <Popover.Trigger>
                <Button>Open popover</Button>
            </Popover.Trigger>
            <Popover.Content>
                <div className="w-56 p-3 text-sm">
                    <div className="font-semibold">Popover content</div>
                    <Text size="xs" className="mt-1 !text-zinc-500">Any React node fits in here.</Text>
                </div>
            </Popover.Content>
        </Popover>
    );
}

function PillboxDemo() {
    const [tags, setTags] = useState(["onboarding", "agent-ux"]);
    return <Pillbox value={tags} onChange={setTags} placeholder="add a tag…" />;
}

function AutocompleteDemo() {
    const [v, setV] = useState("");
    return (
        <Autocomplete
            value={v}
            onChange={setV}
            options={[
                { value: "glenn", label: "Glenn Wagner" },
                { value: "rita", label: "Rita Kumar" },
                { value: "sam", label: "Sam Lin" },
                { value: "ayodeji", label: "Ayodeji Adekola" },
                { value: "priya", label: "Priya Patel" },
            ]}
            placeholder="Search teammates…"
        />
    );
}

function ToastDemo() {
    const { toast } = useToast();
    return (
        <div className="flex flex-wrap gap-2">
            <Button onClick={() => toast({ title: "Saved", description: "Your changes are live." })}>
                Show toast
            </Button>
            <Button color="emerald" onClick={() => toast({ title: "Deploy succeeded", variant: "success" })}>
                Success
            </Button>
            <Button color="red" onClick={() => toast({ title: "Couldn't reach API", variant: "error" })}>
                Error
            </Button>
        </div>
    );
}

function IconDemo() {
    const names = ["search", "settings", "plus", "trash", "edit", "check", "x", "star", "heart", "share", "download", "upload"];
    return (
        <div className="flex flex-wrap gap-3 text-zinc-700 dark:text-zinc-200">
            {names.map((n) => (
                <Tooltip key={n} content={n}>
                    <span className="grid h-9 w-9 place-items-center rounded-md bg-zinc-100 dark:bg-zinc-800">
                        <Icon name={n} size="md" />
                    </span>
                </Tooltip>
            ))}
        </div>
    );
}

function EmojiDemo() {
    return (
        <div className="flex flex-wrap items-center gap-3 text-2xl">
            <Emoji emoji="🎉" size="lg" />
            <Emoji emoji="✨" size="lg" />
            <Emoji emoji="🔥" size="lg" />
            <Emoji emoji="🚀" size="lg" />
            <Emoji emoji="🤖" size="lg" />
            <Emoji emoji="🧠" size="lg" />
        </div>
    );
}

function ProfileDemo() {
    return (
        <div className="grid gap-3 sm:grid-cols-2">
            <Profile name="Glenn Wagner" subtitle="Founder · @glenn" status="online" />
            <Profile name="Claude" subtitle="AI agent" status="busy" />
            <Profile name="Rita Kumar" subtitle="Designer" status="away" />
            <Profile name="Sam Lin" subtitle="Engineer" status="offline" />
        </div>
    );
}

function ReasonTagDemo() {
    return (
        <div className="space-y-2 text-sm">
            <div>
                MRR projection: {" "}
                <ReasonTag value="$24,851" reason="Sum of active subscriptions × monthly price, projected forward 30 days based on 12% MoM growth." confidence={0.84} />
            </div>
            <div>
                Risk score: {" "}
                <ReasonTag value="Low" reason="No charge failures in the last 90 days; usage trending up." confidence={0.92} theme="chip" />
            </div>
        </div>
    );
}

function JsonEditorDemo() {
    const [value, setValue] = useState<JsonValue>({
        service: "checkout",
        retries: 3,
        active: true,
        tier: "pro",
        webhook: "https://example.test/hooks/checkout",
        limits: { rpm: 600, burst: 50 },
        tags: ["billing", "stripe"],
    });

    // The keyMap is the point of the component, so the demo shows a real one —
    // including a nested path and a wildcard, which is where a flat dotted map
    // earns its keep over a nested mirror.
    const keyMap = JSON.stringify({
        retries: "integer",
        active: "boolean",
        tier: { type: "enum", options: ["free", "pro", "enterprise"] },
        webhook: "url",
        "limits.rpm": "integer",
        "limits.burst": "integer",
        "tags.*": "string",
    });

    return (
        <DemoNote
            outOfBox="Everything here is the component: the type badges, the per-type inputs, the conflict state, and add/remove."
            demo="The keyMap and the starting document are demo data. `onChange` writes to local state, as a host would."
        >
            <div className="max-w-lg">
                <JsonEditor value={value} onChange={(next) => setValue(next)} keyMap={keyMap} />
            </div>
        </DemoNote>
    );
}

function ColorPickerDemo() {
    const [color, setColor] = useState("#a855f7");
    return (
        <div className="flex items-center gap-3">
            <ColorPicker value={color} onChange={setColor} presets={["#a855f7", "#3b82f6", "#10b981", "#f59e0b", "#ef4444"]} />
            <code className="font-mono text-sm">{color}</code>
        </div>
    );
}

function CalendarDemo() {
    const [date, setDate] = useState<Date | null>(new Date());
    return (
        <div className="flex gap-6">
            <Calendar mode="single" value={date} onChange={(d) => setDate(d as Date)} />
            <div className="text-sm">
                <Text size="xs" className="!text-zinc-500 uppercase tracking-wider">selected</Text>
                <div className="mt-1 font-mono">{date?.toLocaleDateString() ?? "—"}</div>
            </div>
        </div>
    );
}

function TimePickerDemo() {
    const [t, setT] = useState("14:30");
    return (
        <div className="flex items-center gap-3">
            <TimePicker value={t} onChange={setT} format="24h" />
            <code className="font-mono text-sm">{t}</code>
        </div>
    );
}

function OtpInputDemo() {
    const [v, setV] = useState("");
    return (
        <div className="space-y-2">
            <OtpInput length={6} value={v} onChange={setV} />
            <Text size="xs" className="!text-zinc-500 font-mono">value: {v || "(empty)"}</Text>
        </div>
    );
}

function FileUploadDemo() {
    const [files, setFiles] = useState<File[]>([]);
    return (
        <FileUpload value={files} onChange={setFiles} multiple>
            <FileUpload.Dropzone>
                <div className="grid place-items-center rounded-md border-2 border-dashed border-zinc-300 p-8 text-sm text-zinc-500 dark:border-zinc-700">
                    Drop files here or click to browse
                </div>
            </FileUpload.Dropzone>
            <FileUpload.List />
        </FileUpload>
    );
}

function EmojiSelectDemo() {
    const [v, setV] = useState("🎉");
    return (
        <div className="flex items-center gap-3">
            <EmojiSelect value={v} onChange={setV} />
            <span className="text-2xl">{v}</span>
        </div>
    );
}

function ComposerDemo() {
    const [v, setV] = useState("");
    return (
        <Composer
            value={v}
            onChange={setV}
            onSubmit={(text) => alert("submitted: " + text)}
            placeholder="Reply to thread…"
        />
    );
}

function ModalDemo() {
    const [open, setOpen] = useState(false);
    return (
        <>
            <Button color="violet" onClick={() => setOpen(true)}>Open modal</Button>
            <Modal open={open} onClose={() => setOpen(false)} size="md">
                <Modal.Header>Are you sure?</Modal.Header>
                <Modal.Body>
                    <Text size="sm">This will archive the dream. You can restore it later from the archived list.</Text>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button color="red" onClick={() => setOpen(false)}>Archive</Button>
                </Modal.Footer>
            </Modal>
        </>
    );
}

function DrawerDemo() {
    const [side, setSide] = useState<"left" | "right" | "top" | "bottom" | null>(null);
    return (
        <div className="flex flex-wrap gap-2">
            {(["left", "right", "top", "bottom"] as const).map((s) => (
                <Button key={s} color={s === "right" ? "violet" : undefined} onClick={() => setSide(s)}>
                    {s}
                </Button>
            ))}
            <Drawer open={side !== null} onClose={() => setSide(null)} side={side ?? "right"}>
                <Drawer.Header>Drawer · {side}</Drawer.Header>
                <Drawer.Body>
                    <Text size="sm">
                        Slides in from the {side} edge. On a horizontal edge <code>size</code> sets the
                        width; on a vertical one it sets the height.
                    </Text>
                </Drawer.Body>
                <Drawer.Footer>
                    <Button variant="ghost" onClick={() => setSide(null)}>Cancel</Button>
                    <Button color="violet" onClick={() => setSide(null)}>Save</Button>
                </Drawer.Footer>
            </Drawer>
        </div>
    );
}

function DropdownDemo() {
    return (
        <Dropdown>
            <Dropdown.Trigger>
                <Button>Open menu</Button>
            </Dropdown.Trigger>
            <Dropdown.Items>
                <Dropdown.Item onClick={() => alert("Edit")}>Edit</Dropdown.Item>
                <Dropdown.Item onClick={() => alert("Duplicate")}>Duplicate</Dropdown.Item>
                <Dropdown.Item onClick={() => alert("Archive")}>Archive</Dropdown.Item>
            </Dropdown.Items>
        </Dropdown>
    );
}

function ContextMenuDemo() {
    return (
        <ContextMenu>
            <ContextMenu.Trigger>
                <div className="grid h-32 place-items-center rounded-md border border-dashed border-zinc-300 bg-zinc-50 text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900">
                    Right-click anywhere in this box
                </div>
            </ContextMenu.Trigger>
            <ContextMenu.Content>
                <ContextMenu.Item onClick={() => alert("Cut")}>Cut</ContextMenu.Item>
                <ContextMenu.Item onClick={() => alert("Copy")}>Copy</ContextMenu.Item>
                <ContextMenu.Item onClick={() => alert("Paste")}>Paste</ContextMenu.Item>
            </ContextMenu.Content>
        </ContextMenu>
    );
}

function CommandDemo() {
    const [open, setOpen] = useState(false);
    return (
        <>
            <Button color="violet" onClick={() => setOpen(true)}>Open ⌘K</Button>
            <Command open={open} onClose={() => setOpen(false)}>
                <Command.Input placeholder="Type a command…" />
                <Command.List>
                    <Command.Group heading="Navigation">
                        <Command.Item onSelect={() => { alert("Go to inbox"); setOpen(false); }}>Go to inbox</Command.Item>
                        <Command.Item onSelect={() => { alert("Go to projects"); setOpen(false); }}>Go to projects</Command.Item>
                    </Command.Group>
                    <Command.Group heading="Create">
                        <Command.Item onSelect={() => { alert("New doc"); setOpen(false); }}>New document</Command.Item>
                        <Command.Item onSelect={() => { alert("New board"); setOpen(false); }}>New board</Command.Item>
                    </Command.Group>
                    <Command.Empty>No commands match.</Command.Empty>
                </Command.List>
            </Command>
        </>
    );
}

function PortalDemo() {
    return (
        <Portal>
            <div className="fixed bottom-4 right-4 rounded-md bg-zinc-900 px-3 py-2 text-xs text-white shadow-lg">
                Rendered via Portal in document.body
            </div>
        </Portal>
    );
}

function MenuDemo() {
    return (
        <Menu orientation="vertical" className="w-56">
            <Menu.Item href="#" active>Inbox</Menu.Item>
            <Menu.Item href="#" badge={<Badge color="violet" size="sm">3</Badge>}>Projects</Menu.Item>
            <Menu.Item href="#">Team</Menu.Item>
            <Menu.Item href="#">Settings</Menu.Item>
            <Menu.Item href="#" disabled>Coming soon</Menu.Item>
        </Menu>
    );
}

function MobileMenuDemo() {
    const [open, setOpen] = useState(false);
    return (
        <>
            <Button onClick={() => setOpen(true)}>Open mobile menu</Button>
            <MobileMenu.Flyout open={open} onClose={() => setOpen(false)}>
                <MobileMenu.Item href="#" onClick={() => setOpen(false)}>Inbox</MobileMenu.Item>
                <MobileMenu.Item href="#" onClick={() => setOpen(false)}>Projects</MobileMenu.Item>
                <MobileMenu.Item href="#" onClick={() => setOpen(false)}>Team</MobileMenu.Item>
                <MobileMenu.Item href="#" onClick={() => setOpen(false)}>Settings</MobileMenu.Item>
            </MobileMenu.Flyout>
        </>
    );
}

function NavbarDemo() {
    return (
        <Navbar className="rounded-md border border-zinc-200 bg-white px-3 dark:border-zinc-800 dark:bg-zinc-900">
            <Navbar.Brand>
                <div className="text-sm font-semibold">Acme</div>
            </Navbar.Brand>
            <Navbar.Items>
                <Navbar.Item href="#" active>Home</Navbar.Item>
                <Navbar.Item href="#">Docs</Navbar.Item>
                <Navbar.Item href="#">Pricing</Navbar.Item>
            </Navbar.Items>
            <Button size="sm" color="violet">Sign up</Button>
        </Navbar>
    );
}

function SidebarDemo() {
    return (
        <div className="grid grid-cols-[200px_1fr] gap-4">
            <Sidebar className="rounded-md border border-zinc-200 bg-white p-2 dark:border-zinc-800 dark:bg-zinc-900">
                <Sidebar.Group>
                    <Sidebar.Item href="#" active>Inbox</Sidebar.Item>
                    <Sidebar.Item href="#" badge={<Badge color="violet" size="sm">3</Badge>}>Projects</Sidebar.Item>
                    <Sidebar.Item href="#">Team</Sidebar.Item>
                    <Sidebar.Item href="#">Settings</Sidebar.Item>
                </Sidebar.Group>
            </Sidebar>
            <div className="rounded-md border border-dashed border-zinc-300 p-4 text-sm text-zinc-500 dark:border-zinc-700">
                Main content area
            </div>
        </div>
    );
}

function TreeNavDemo() {
    const tree: TreeNodeData[] = [
        {
            id: "src", label: "src", type: "folder" as const,
            children: [
                { id: "index", label: "index.ts", type: "file" as const, ext: "ts" },
                { id: "app", label: "app.ts", type: "file" as const, ext: "ts" },
                {
                    id: "components", label: "components", type: "folder" as const,
                    children: [
                        { id: "btn", label: "Button.tsx", type: "file" as const, ext: "tsx" },
                        { id: "card", label: "Card.tsx", type: "file" as const, ext: "tsx" },
                    ],
                },
            ],
        },
        { id: "readme", label: "README.md", type: "file" as const, ext: "md" },
        { id: "pkg", label: "package.json", type: "file" as const, ext: "json" },
    ];
    return (
        <div className="max-w-xs rounded-md border border-zinc-200 bg-white p-2 dark:border-zinc-800 dark:bg-zinc-900">
            <TreeNav nodes={tree} defaultExpandedIds={["src", "components"]} />
        </div>
    );
}

function FileBrowserDemo() {
    const [picked, setPicked] = useState<string | string[] | null>(null);
    // Tiny fake FS with latency so the per-folder lazy loading is visible.
    const fs: Record<string, { path: string; name: string; kind: "file" | "dir"; hasChildren?: boolean; size?: number }[]> = {
        "/": [
            { path: "/deploys", name: "deploys", kind: "dir", hasChildren: true },
            { path: "/logs", name: "logs", kind: "dir", hasChildren: true },
            { path: "/app.config.json", name: "app.config.json", kind: "file", size: 1840 },
        ],
        "/deploys": [
            { path: "/deploys/2026-07-06", name: "2026-07-06", kind: "dir", hasChildren: false },
            { path: "/deploys/2026-07-07", name: "2026-07-07", kind: "dir", hasChildren: false },
        ],
        "/logs": [
            { path: "/logs/app.log", name: "app.log", kind: "file", size: 52_400 },
            { path: "/logs/queue.log", name: "queue.log", kind: "file", size: 9_210 },
        ],
    };
    const provider = {
        loadChildren: (path: string) =>
            new Promise<(typeof fs)[string]>((resolve) => {
                window.setTimeout(() => resolve(fs[path] ?? []), 350);
            }),
    };
    return (
        <div className="grid max-w-md gap-2">
            <FileBrowser provider={provider} select="directory" value={picked} onChange={setPicked} />
            <div className="text-xs text-zinc-500">
                picked directory: <code>{picked ? String(picked) : "none yet"}</code>
            </div>
        </div>
    );
}

// One OpenStreetMap provider + a deterministic delivery route, created at module
// load (not per render) so the engine isn't rebuilt and SSR/hydration match.
const fancyMapProvider = leafletProvider();
const FANCY_MAP_CENTER = { lat: 43.0389, lng: -87.9065 };
const FANCY_MAP_ROUTE = Array.from({ length: 48 }, (_, i) => {
    const t = (i / 48) * Math.PI * 2;
    return { lat: FANCY_MAP_CENTER.lat + Math.sin(t) * 0.02, lng: FANCY_MAP_CENTER.lng + Math.cos(t) * 0.03 };
});


// ── fancy-git-ui ────────────────────────────────────────────────────────────
// All eight run the REAL components against one fixture repository. Every
// fancy-git-ui component is fully controlled and provider-neutral: it renders
// what you pass and emits intents, holding no Git state of its own. So a demo
// is exactly what a host does — own the state, answer the intents — and these
// answer them locally instead of shelling out to git.

function GitWorkingTreeDemo() {
    const [status, setStatus] = useState(GIT_STATUS);
    const [selected, setSelected] = useState<string[]>([]);

    // Staging is the host's job — the component only says which paths the user
    // asked for. Here that moves the change from `worktree` to `index`; in a
    // real app it is `repository.stage(paths)`.
    const move = (paths: string[], toIndex: boolean) => {
        setStatus((s) => ({
            ...s,
            files: s.files.map((f) =>
                paths.includes(f.path)
                    ? toIndex
                        ? { ...f, index: f.worktree ?? f.index, worktree: null }
                        : { ...f, worktree: f.index ?? f.worktree, index: null }
                    : f,
            ),
        }));
        setSelected([]);
    };

    return (
        <DemoNote
            outOfBox="<WorkingTree> renders staged / unstaged / untracked changes from a fancy-git WorkingTreeStatus, with selection and stage/unstage intents."
            demo="Staging is answered in local state rather than by shelling out to git — in an app this is repository.stage(paths), which also takes a propose flag so an agent can ask instead of act."
        >
            <WorkingTree
                value={status}
                selectedPaths={selected}
                onSelectedPathsChange={setSelected}
                onStage={(paths) => move(paths, true)}
                onUnstage={(paths) => move(paths, false)}
            />
        </DemoNote>
    );
}

function GitCommitHistoryDemo() {
    const [selectedId, setSelectedId] = useState<string | undefined>(GIT_COMMITS[0].id);
    const [commits, setCommits] = useState(GIT_COMMITS.slice(0, 2));

    return (
        <DemoNote
            outOfBox="<CommitHistory> is a controlled, pageable log — selection and 'load more' are intents, so the host owns paging."
            demo="Load more appends the third fixture commit. A real host would call repository.log({ skip }) and append the page it gets back."
        >
            <CommitHistory
                value={commits}
                selectedId={selectedId}
                onSelectedIdChange={setSelectedId}
                hasMore={commits.length < GIT_COMMITS.length}
                onLoadMore={() => setCommits(GIT_COMMITS)}
            />
        </DemoNote>
    );
}

function GitReviewListDemo() {
    const [selected, setSelected] = useState<number | undefined>(41);

    return (
        <DemoNote
            outOfBox="<ReviewList> is provider-neutral: a GitHub pull request and a GitLab merge request are both a fancy-git Review, so this one list renders either."
            demo="Fixture reviews stand in for provider.listReviews(ref) — swapping GitHub for GitLab changes the adapter you registered, not this component."
        >
            <ReviewList value={GIT_REVIEWS} selectedNumber={selected} onSelectedNumberChange={setSelected} />
        </DemoNote>
    );
}

function GitRepositoryBrowserDemo() {
    const [path, setPath] = useState("src");
    const [selectedPath, setSelectedPath] = useState<string | undefined>("src/types.ts");

    return (
        <DemoNote
            outOfBox="<RepositoryBrowser> walks a directory listing with stable path handles — the handle is how an agent addresses a file without guessing DOM."
            demo="One fixture directory; navigating deeper re-renders the same component with a new listing, which is what a host does after reading the new path."
        >
            <RepositoryBrowser
                value={GIT_TREE}
                path={path}
                selectedPath={selectedPath}
                onPathChange={setPath}
                onSelectedPathChange={setSelectedPath}
            />
        </DemoNote>
    );
}

function GitDiffViewerDemo() {
    const [mode, setMode] = useState<"unified" | "split">("unified");
    const [acceptance, setAcceptance] = useState<Record<string, "accepted" | "rejected" | "pending">>({});

    return (
        <DemoNote
            outOfBox="<DiffViewer> takes the unified patch fancy-git returns and renders it with stable file and hunk handles, unified or split. Per-hunk accept/reject is what partial staging and review comments hang off."
            demo="The real 0.27.1 merge-point fix, as the patch git emits. A hunk cycles pending → accepted → rejected — pending is NOT rejected, which is how a review knows whether it is finished."
        >
            <DiffViewer
                value={GIT_DIFF}
                mode={mode}
                onModeChange={setMode}
                acceptance={acceptance}
                onAcceptanceChange={setAcceptance}
            />
        </DemoNote>
    );
}

function GitBranchPickerDemo() {
    const [branches, setBranches] = useState(GIT_BRANCHES);
    const [selected, setSelected] = useState<string | undefined>("feature/trigger-cohorts");
    const [proposal, setProposal] = useState<string | null>(null);

    return (
        <DemoNote
            outOfBox="<BranchPicker> lists local and remote branches and emits a checkout intent — it never checks anything out itself."
            demo="Checkout is PROPOSED rather than applied, which is the package's trust-but-verify shape: repository.checkout(name, propose: true) returns what it WOULD run, for a human to confirm."
        >
            <div className="space-y-2">
                <BranchPicker
                    value={branches}
                    selectedName={selected}
                    onSelectedNameChange={setSelected}
                    onCheckout={(name) => setProposal(name)}
                />
                {proposal && (
                    <div className="flex items-center gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs dark:border-amber-900/60 dark:bg-amber-950/30">
                        <span className="flex-1">
                            Proposed: <code>git checkout {proposal}</code>
                        </span>
                        <button
                            type="button"
                            className="rounded bg-amber-600 px-2 py-0.5 text-[11px] font-medium text-white"
                            onClick={() => {
                                setBranches((b) => b.map((x) => ({ ...x, current: x.name === proposal })));
                                setProposal(null);
                            }}
                        >
                            Confirm
                        </button>
                        <button type="button" className="text-[11px] text-zinc-500" onClick={() => setProposal(null)}>
                            Discard
                        </button>
                    </div>
                )}
            </div>
        </DemoNote>
    );
}

function GitCommitComposerDemo() {
    const [draft, setDraft] = useState<FancyGitCommitDraft>({ message: "", description: "" });
    const [committed, setCommitted] = useState<string | null>(null);

    return (
        <DemoNote
            outOfBox="<CommitComposer> is a controlled commit draft — value / onChange / onSubmit, with a pending flag while the host works."
            demo="Submitting records the message here instead of writing a commit. An agent drafting a message and a human editing it use this same one surface."
        >
            <div className="space-y-2">
                <CommitComposer value={draft} onChange={setDraft} onSubmit={(v) => setCommitted(v.message)} />
                {committed && (
                    <p className="text-xs text-emerald-600 dark:text-emerald-400">
                        Would commit: <code>{committed}</code>
                    </p>
                )}
            </div>
        </DemoNote>
    );
}

function GitCreateReviewFormDemo() {
    const [draft, setDraft] = useState<FancyGitCreateReviewInput>({
        title: "",
        body: "",
        sourceBranch: "feature/trigger-cohorts",
        targetBranch: "main",
        draft: false,
    });
    const [opened, setOpened] = useState<string | null>(null);

    return (
        <DemoNote
            outOfBox="<CreateReviewForm> is a controlled pull/merge request draft over fancy-git's CreateReviewInput, so the same form opens a PR on GitHub or an MR on GitLab."
            demo="Submitting records the title rather than calling provider.createReview(ref, input) — the one operation in the family that cannot be taken back by re-running it."
        >
            <div className="space-y-2">
                <CreateReviewForm
                    value={draft}
                    onChange={setDraft}
                    branches={GIT_BRANCHES.filter((b) => !b.remote).map((b) => b.name)}
                    onSubmit={(v) => setOpened(v.title)}
                />
                {opened && (
                    <p className="text-xs text-emerald-600 dark:text-emerald-400">
                        Would open: <code>{opened}</code>
                    </p>
                )}
            </div>
        </DemoNote>
    );
}

function FancyMapDemo() {
    const [step, setStep] = useState(0);
    const [view, setView] = useState<FancyMapView>({ center: FANCY_MAP_CENTER, zoom: 13 });
    const [selected, setSelected] = useState<string | null>(null);

    // SSR-safe: the timer only runs in the browser and is cleared on unmount.
    useEffect(() => {
        const id = window.setInterval(() => setStep((s) => (s + 1) % FANCY_MAP_ROUTE.length), 900);
        return () => window.clearInterval(id);
    }, []);

    const markers: FancyMapMarker[] = [
        { id: "truck", position: FANCY_MAP_ROUTE[step], icon: "🚚", color: "#2563eb", label: "Order #4821" },
        { id: "home", position: FANCY_MAP_CENTER, icon: "🏠", color: "#16a34a", label: "You" },
    ];

    return (
        <DemoNote
            outOfBox="Engine-agnostic <Map> with leafletProvider() rendering OpenStreetMap tiles (no API key). view / markers / selectedId are controlled; follow keeps the camera on a moving marker."
            demo="The 🚚 marker's position is advanced on a 900ms timer along a precomputed route to stand in for a live position feed (websocket, Echo channel, or an agent over the map bridge)."
        >
            <div className="space-y-2">
                <div style={{ height: 420 }} className="overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-800">
                    <FancyMap
                        provider={fancyMapProvider}
                        view={view}
                        onViewChange={setView}
                        markers={markers}
                        selectedId={selected}
                        onSelect={setSelected}
                        follow="truck"
                    />
                </div>
                <Text size="xs" className="!text-zinc-500">
                    {selected ? `Selected: ${selected}` : "Click a pin to select it — selection is controlled state."}
                </Text>
            </div>
        </DemoNote>
    );
}

function InputsDemo() {
    const [text, setText] = useState("");
    const [check, setCheck] = useState(true);
    return (
        <div className="grid max-w-md gap-3">
            <label className="grid gap-1 text-sm">
                <span className="text-xs text-zinc-500 uppercase tracking-wider">Text input</span>
                <input
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Type something…"
                    className="rounded-md border border-zinc-300 bg-transparent px-3 py-2 outline-none focus:border-violet-500 dark:border-zinc-700"
                />
            </label>
            <label className="grid gap-1 text-sm">
                <span className="text-xs text-zinc-500 uppercase tracking-wider">Select</span>
                <select className="rounded-md border border-zinc-300 bg-transparent px-3 py-2 outline-none focus:border-violet-500 dark:border-zinc-700 dark:bg-zinc-900">
                    <option>Founder</option>
                    <option>Designer</option>
                    <option>Engineer</option>
                </select>
            </label>
            <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={check} onChange={(e) => setCheck(e.target.checked)} className="h-4 w-4 accent-violet-600" />
                Subscribe to the changelog
            </label>
        </div>
    );
}

function InputTagDemo() {
    const ref = useRef<HTMLTextAreaElement>(null);
    const adapter = useState(() => textareaAdapter(ref))[0];
    return (
        <div className="grid gap-2 text-sm">
            <Text size="xs" className="!text-zinc-500">
                Try typing <code className="font-mono">/</code> for slash-commands or <code className="font-mono">@</code> for mentions.
            </Text>
            <textarea
                ref={ref}
                placeholder="Compose a message — try / or @"
                rows={3}
                className="rounded-md border border-zinc-300 bg-transparent p-2 outline-none focus:border-violet-500 dark:border-zinc-700"
            />
            <InputTag
                adapter={adapter}
                triggers={{
                    "/": {
                        items: [
                            { id: "summarize", name: "Summarize thread" },
                            { id: "tldr", name: "TL;DR" },
                            { id: "actions", name: "Pull action items" },
                        ],
                        insert: (item: any) => "/" + item.id + " ",
                    },
                    "@": {
                        items: [
                            { id: "glenn", name: "Glenn Wagner" },
                            { id: "rita", name: "Rita Kumar" },
                            { id: "sam", name: "Sam Lin" },
                        ],
                        insert: (item: any) => "@" + item.id + " ",
                    },
                }}
            />
        </div>
    );
}

function PromptInputDemo() {
    return (
        <PromptInput
            budgetTokens={4096}
            commands={[
                { name: "/summarize", hint: "Summarize the thread" },
                { name: "/tldr", hint: "One-paragraph TL;DR" },
            ]}
            mentions={[
                { id: "glenn", name: "Glenn Wagner", kind: "person" },
                { id: "rita", name: "Rita Kumar", kind: "person" },
                { id: "claude", name: "Claude", kind: "agent" },
            ]}
            onSubmit={(text) => alert("submitted: " + text)}
        />
    );
}

function MagicWandDemo() {
    const [v, setV] = useState("Highlight some of this text to see the wand pop up. Then choose an action.");
    return (
        <MagicWand
            value={v}
            onValueChange={setV}
            actions={[
                { id: "shorten", label: "Shorten", run: (sel: string) => sel.split(/\s+/).slice(0, 6).join(" ") },
                { id: "upper", label: "Uppercase", run: (sel: string) => sel.toUpperCase() },
            ]}
            onAction={(action, selection, _replacement) => {
                const transform = action.id === "upper"
                    ? selection.text.toUpperCase()
                    : selection.text.split(/\s+/).slice(0, Math.ceil(selection.text.split(/\s+/).length / 2)).join(" ");
                setV((cur) => cur.slice(0, selection.start) + transform + cur.slice(selection.end));
            }}
        />
    );
}

function MoodMeterDemo() {
    const [v, setV] = useState({ value: 6, confidence: 0.7 });
    return (
        <div className="grid grid-cols-[1fr_140px] gap-6 items-center">
            <MoodMeter
                min={0}
                max={10}
                step={0.1}
                value={v.value}
                confidence={v.confidence}
                onChange={(value, confidence) => setV({ value, confidence })}
            />
            <div className="text-sm font-mono">
                <div>value: {v.value.toFixed(1)}</div>
                <div>confidence: {(v.confidence * 100).toFixed(0)}%</div>
            </div>
        </div>
    );
}

function ChatDrawerDemo() {
    const [active, setActive] = useState("inbox");
    return (
        <ChatDrawer
            tabs={[
                { id: "inbox", label: "Inbox", number: 3 },
                { id: "agents", label: "Agents", number: 1 },
                { id: "notifications", label: "Activity" },
            ]}
            activeTabId={active}
            onTabChange={setActive}
        >
            <div className="p-3 text-sm">
                Active tab: <code className="font-mono">{active}</code>
            </div>
        </ChatDrawer>
    );
}

function TableDemo() {
    const rows = [
        { name: "Acme Robotics", mrr: 4990, seats: 42 },
        { name: "Vector Foods", mrr: 2900, seats: 18 },
        { name: "Lumen Cycles", mrr: 0, seats: 5 },
    ];
    return (
        <Table>
            <Table.Head>
                <Table.Row>
                    <Table.Column label="Customer" sortKey="name" />
                    <Table.Column label="MRR" sortKey="mrr" className="!text-right" />
                    <Table.Column label="Seats" sortKey="seats" className="!text-right" />
                </Table.Row>
            </Table.Head>
            <Table.Body>
                {rows.map((r) => (
                    <Table.Row key={r.name}>
                        <Table.Cell>{r.name}</Table.Cell>
                        <Table.Cell className="text-right font-mono">${r.mrr.toLocaleString()}</Table.Cell>
                        <Table.Cell className="text-right font-mono">{r.seats}</Table.Cell>
                    </Table.Row>
                ))}
            </Table.Body>
        </Table>
    );
}

function CarouselDemo() {
    return (
        <div className="rounded-md border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <Carousel variant="directional" loop>
                <Carousel.Panels>
                    {[
                        { tone: "from-violet-400 to-sky-400", title: "Authorable" },
                        { tone: "from-emerald-400 to-sky-400", title: "Inhabitable" },
                        { tone: "from-amber-400 to-rose-400", title: "Composable" },
                    ].map((s, i) => (
                        <Carousel.Slide key={i} name={`slide-${i}`}>
                            <div className={`grid h-40 place-items-center bg-gradient-to-br ${s.tone}`}>
                                <span className="text-2xl font-semibold text-white">{s.title}</span>
                            </div>
                        </Carousel.Slide>
                    ))}
                </Carousel.Panels>
                <Carousel.Controls />
                <Carousel.Steps />
            </Carousel>
        </div>
    );
}

function MarqueeDemo() {
    const [speed, setSpeed] = useState(60);
    const [direction, setDirection] = useState<"left" | "right">("right");
    const [pauseOnHover, setPauseOnHover] = useState(true);
    const [paused, setPaused] = useState(false);

    return (
        <DemoNote
            outOfBox="Seamless infinite wrap (short content auto-repeats to fill the strip), px/s speed with constant perceived pace, left/right direction for opposing pairs, pauseOnHover + a controlled paused prop, gap / separator / fade-edge / angle props, decorative (aria-hidden) by default, and zero animation under prefers-reduced-motion. Typography and color inherit from className — the strip below is the Kinetic gallery clients marquee rebuilt as a single <Marquee> element."
            demo="The client list, dark panel, and the controls are demo scaffolding."
        >
            <div className="space-y-4">
                <div className="overflow-hidden rounded-lg bg-zinc-950 py-3">
                    <Marquee
                        items={["Velocity Films", "Slipstream Labs", "Afterburn Audio", "Parallax Studio", "Tilt Collective", "Overdrive Co."]}
                        speed={speed}
                        direction={direction}
                        pauseOnHover={pauseOnHover}
                        paused={paused}
                        fade="8%"
                        separator={<span className="text-[0.7em] text-fuchsia-500">✸</span>}
                        className="border-y border-zinc-800 py-5 text-3xl font-bold tracking-tight text-zinc-500"
                    />
                    <Marquee
                        items={["MOTION", "FILM", "SCROLL", "BRAND", "TYPE"]}
                        speed={speed}
                        direction={direction === "left" ? "right" : "left"}
                        pauseOnHover={pauseOnHover}
                        paused={paused}
                        fade="8%"
                        gap={24}
                        separator={<span className="text-cyan-400">✦</span>}
                        className="py-3 font-mono text-xs font-semibold uppercase tracking-[0.14em] text-zinc-400"
                    />
                </div>
                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
                    <label className="flex items-center gap-2">
                        <span className="text-xs uppercase tracking-wider text-zinc-500">Speed</span>
                        <input
                            type="range"
                            min={20}
                            max={200}
                            value={speed}
                            onChange={(e) => setSpeed(Number(e.target.value))}
                            className="w-32 accent-violet-600"
                        />
                        <span className="w-14 font-mono text-xs text-zinc-500">{speed} px/s</span>
                    </label>
                    <label className="flex items-center gap-2">
                        <span className="text-xs uppercase tracking-wider text-zinc-500">Direction</span>
                        <select
                            value={direction}
                            onChange={(e) => setDirection(e.target.value as "left" | "right")}
                            className="rounded-md border border-zinc-300 bg-transparent px-2 py-1 text-xs outline-none focus:border-violet-500 dark:border-zinc-700 dark:bg-zinc-900"
                        >
                            <option value="left">left</option>
                            <option value="right">right</option>
                        </select>
                    </label>
                    <label className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={pauseOnHover}
                            onChange={(e) => setPauseOnHover(e.target.checked)}
                            className="h-4 w-4 accent-violet-600"
                        />
                        Pause on hover
                    </label>
                    <label className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={paused}
                            onChange={(e) => setPaused(e.target.checked)}
                            className="h-4 w-4 accent-violet-600"
                        />
                        Paused
                    </label>
                </div>
            </div>
        </DemoNote>
    );
}

function ChartDemo() {
    return (
        <Chart.Bar
            data={[
                { label: "Q1", value: 12000, color: "#a855f7" },
                { label: "Q2", value: 18500, color: "#a855f7" },
                { label: "Q3", value: 22000, color: "#a855f7" },
                { label: "Q4", value: 26500, color: "#a855f7" },
            ]}
            height={200}
            showValues
        />
    );
}

function KanbanDemo() {
    type Card = { id: string; column: "todo" | "doing" | "done"; title: string };
    const [cards, setCards] = useState<Card[]>([
        { id: "c1", column: "todo", title: "Wire showcase scanner" },
        { id: "c2", column: "todo", title: "Backfill leaderboard data" },
        { id: "c3", column: "doing", title: "Component demos pass 2" },
        { id: "c4", column: "done", title: "Inertia + react-fancy chrome" },
        { id: "c5", column: "done", title: "Starter kits live" },
    ]);

    const columns: { id: Card["column"]; title: string }[] = [
        { id: "todo", title: "To do" },
        { id: "doing", title: "In progress" },
        { id: "done", title: "Done" },
    ];

    return (
        <Kanban
            onCardMove={(cardId, _from, toColumn, _toIndex) => {
                setCards((prev) => prev.map((c) => (c.id === cardId ? { ...c, column: toColumn as Card["column"] } : c)));
            }}
        >
            {columns.map((col) => (
                <Kanban.Column key={col.id} id={col.id}>
                    <Kanban.ColumnHandle>
                        <div className="flex items-center justify-between px-3 py-2">
                            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">{col.title}</span>
                            <Badge color="zinc" size="sm">{cards.filter((c) => c.column === col.id).length}</Badge>
                        </div>
                    </Kanban.ColumnHandle>
                    {cards.filter((c) => c.column === col.id).map((c) => (
                        <Kanban.Card key={c.id} id={c.id}>
                            <div className="rounded-md border border-zinc-200 bg-white p-2 text-sm shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
                                {c.title}
                            </div>
                        </Kanban.Card>
                    ))}
                </Kanban.Column>
            ))}
        </Kanban>
    );
}

// ─── Helpers for non-mountable components ──────────────────────────────────

function Explainer({
    summary,
    code,
    bullets,
    kind = "code-reference",
    language = "tsx",
}: {
    summary: string;
    code?: string;
    bullets?: string[];
    /**
     * Labels the preview so it's clear when a snippet IS the canonical
     * preview (PHP libs, server-side bridges, types — anything without a
     * meaningful React render).
     */
    kind?: "code-reference" | "server-side" | "php";
    language?: "tsx" | "ts" | "php";
}) {
    const label = kind === "php" ? "PHP · server-side reference" : kind === "server-side" ? "Server-side · reference" : "Code reference";
    const labelTone = kind === "php" ? "text-indigo-600 dark:text-indigo-300" : "text-violet-600 dark:text-violet-300";
    return (
        <div className="space-y-3">
            <div className={`inline-flex items-center gap-1.5 rounded-full border border-current/20 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider ${labelTone}`}>
                <span className="size-1.5 rounded-full bg-current opacity-70" />
                {label}
            </div>
            <Text size="sm" className="!text-zinc-600 dark:!text-zinc-300">{summary}</Text>
            {bullets && (
                <ul className="ml-4 list-disc space-y-1 text-sm text-zinc-600 dark:text-zinc-300">
                    {bullets.map((b, i) => <li key={i}>{b}</li>)}
                </ul>
            )}
            {code && (
                <div className="overflow-hidden rounded-md">
                    <CodeEditor value={code} language={language} theme="dark" readOnly minHeight={60} maxHeight={400}>
                        <CodeEditor.Panel />
                    </CodeEditor>
                </div>
            )}
        </div>
    );
}

// ─── fancy-whiteboard ──────────────────────────────────────────────────────

// Helpers for the whiteboard demos — all use the REAL components (the old
// versions hand-drew SVG / divs, which is exactly what these components exist
// to replace). Items are controlled: parent owns the array, each component
// gets item + onChange.
type WbItem = Record<string, unknown> & { id: string; kind: string };
const wbPatch = (set: React.Dispatch<React.SetStateAction<any[]>>, id: string) => (next: any) =>
    set((arr) => arr.map((it) => (it.id === id ? next : it)));

function WhiteboardBoardDemo() {
    const [items, setItems] = useState<any[]>([
        { id: "n1", kind: "sticky", x: 40, y: 36, width: 152, height: 94, text: "Onboarding feels heavy at step 3", color: "#fde68a" },
        { id: "n2", kind: "sticky", x: 260, y: 70, width: 152, height: 94, text: "Try one-click templates", color: "#a5b4fc" },
        { id: "s1", kind: "shape", shape: "rounded-rect", x: 120, y: 210, width: 190, height: 64, text: "Ship v0.4", fill: "#bbf7d0", stroke: "#16a34a" },
    ]);
    const [sel, setSel] = useState<string | null>(null);
    const [viewport, setViewport] = useState({ x: 0, y: 0, zoom: 1 });
    return (
        <DemoNote
            outOfBox="A pan/zoom Board hosting real items — drag a sticky to move it, grab a corner to resize, edit text inline, click to select. Sticky notes, a shape, a dashed connector, and a remote-cursor presence layer are all stock components; scroll/pinch to zoom the canvas."
            demo="Three seeded items + two example presence cursors."
        >
            <div className="h-96 overflow-hidden rounded-md border border-zinc-200 bg-amber-50/30 dark:border-zinc-800 dark:bg-amber-900/10">
                <Board viewport={viewport} onViewportChange={setViewport}>
                    {items.map((it) =>
                        it.kind === "sticky" ? (
                            <StickyNote key={it.id} item={it} onChange={wbPatch(setItems, it.id)} selected={sel === it.id} onSelect={() => setSel(it.id)} />
                        ) : (
                            <Shape key={it.id} item={it} onChange={wbPatch(setItems, it.id)} selected={sel === it.id} onSelect={() => setSel(it.id)} />
                        ),
                    )}
                    <Connector from={{ x: 192, y: 82 }} to={{ x: 260, y: 116 }} color="#a855f7" dashed />
                    <CursorLayer cursors={[
                        { userId: "ada", name: "Ada", color: "#a855f7", x: 392, y: 56 },
                        { userId: "claude", name: "Claude", color: "#3b82f6", x: 150, y: 262 },
                    ]} />
                </Board>
            </div>
        </DemoNote>
    );
}

function WhiteboardStickyDemo() {
    const [notes, setNotes] = useState<any[]>([
        { id: "n1", kind: "sticky", x: 16, y: 16, width: 168, height: 100, text: "Onboarding feels heavy at step 3", color: "#fde68a" },
        { id: "n2", kind: "sticky", x: 214, y: 44, width: 168, height: 100, text: "Try one-click templates", color: "#a5b4fc" },
        { id: "n3", kind: "sticky", x: 110, y: 150, width: 168, height: 100, text: "Track time-to-first-board", color: "#bef264" },
    ]);
    return (
        <DemoNote
            outOfBox="The real StickyNote primitive — drag to move, corner-resize, edit text inline. Controlled via item + onChange with a stable id agents can target."
            demo="Three seeded notes in a plain relative container (no Board)."
        >
            <div className="relative h-64 overflow-hidden rounded-md border border-zinc-200 bg-amber-50/30 dark:border-zinc-800 dark:bg-amber-900/10">
                {notes.map((n) => <StickyNote key={n.id} item={n} onChange={wbPatch(setNotes, n.id)} />)}
            </div>
        </DemoNote>
    );
}

function WhiteboardCursorDemo() {
    return (
        <DemoNote
            outOfBox="CursorLayer renders any number of remote presence cursors (name + color) from a RemoteCursor[] — exactly what the share relay feeds for live multi-user presence."
            demo="Three static example cursors."
        >
            <div className="relative h-40 overflow-hidden rounded-md border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
                <CursorLayer cursors={[
                    { userId: "glenn", name: "Glenn", color: "#a855f7", x: 70, y: 50 },
                    { userId: "rita", name: "Rita", color: "#10b981", x: 240, y: 120 },
                    { userId: "claude", name: "Claude", color: "#3b82f6", x: 340, y: 44 },
                ]} />
            </div>
        </DemoNote>
    );
}

function WhiteboardConnectorDemo() {
    const [items, setItems] = useState<any[]>([
        { id: "src", kind: "shape", shape: "rounded-rect", x: 24, y: 64, width: 96, height: 50, text: "Source", fill: "#ede9fe", stroke: "#7c3aed" },
        { id: "a", kind: "shape", shape: "rounded-rect", x: 300, y: 24, width: 96, height: 50, text: "Target A", fill: "#e0f2fe", stroke: "#0284c7" },
        { id: "b", kind: "shape", shape: "rounded-rect", x: 300, y: 116, width: 96, height: 50, text: "Target B", fill: "#dcfce7", stroke: "#16a34a" },
    ]);
    return (
        <DemoNote
            outOfBox="Connector draws an SVG link (solid or dashed) between two points. Inside a Board it can anchor to item ids and track as they move; standalone it links fixed points."
            demo="Three shapes (drag them) plus two connectors between fixed anchor points."
        >
            <div className="relative h-48 overflow-hidden rounded-md border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
                {items.map((s) => <Shape key={s.id} item={s} onChange={wbPatch(setItems, s.id)} />)}
                <Connector from={{ x: 120, y: 89 }} to={{ x: 300, y: 49 }} color="#7c3aed" />
                <Connector from={{ x: 120, y: 89 }} to={{ x: 300, y: 141 }} color="#7c3aed" />
            </div>
        </DemoNote>
    );
}

function WhiteboardShapeDemo() {
    const seed: [string, string, string, string][] = [
        ["rect", "Rect", "#ede9fe", "#7c3aed"],
        ["rounded-rect", "Rounded", "#e0f2fe", "#0284c7"],
        ["ellipse", "Ellipse", "#dcfce7", "#16a34a"],
        ["diamond", "Diamond", "#fef3c7", "#d97706"],
        ["triangle", "Triangle", "#fee2e2", "#dc2626"],
        ["arrow", "Arrow", "#f3e8ff", "#9333ea"],
    ];
    const [items, setItems] = useState<any[]>(seed.map(([shape, text, fill, stroke], i) => ({
        id: `s${i}`, kind: "shape", shape, text, fill, stroke,
        x: 12 + (i % 3) * 132, y: 12 + Math.floor(i / 3) * 104, width: 112, height: 80,
    })));
    return (
        <DemoNote
            outOfBox="Shape renders eight kinds — rect, rounded-rect, ellipse, diamond, triangle, line, arrow, text — with fill / stroke, inline text, drag + corner-resize. Controlled via item + onChange."
            demo="Six seeded shapes."
        >
            <div className="relative h-56 overflow-hidden rounded-md border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
                {items.map((s) => <Shape key={s.id} item={s} onChange={wbPatch(setItems, s.id)} />)}
            </div>
        </DemoNote>
    );
}

function WhiteboardDrawingDemo() {
    const [strokes, setStrokes] = useState<any[]>([
        { id: "k1", color: "#a855f7", size: 3, points: [{ x: 24, y: 90 }, { x: 70, y: 50 }, { x: 116, y: 96 }, { x: 162, y: 56 }, { x: 208, y: 96 }] },
    ]);
    return (
        <DemoNote
            outOfBox="Drawing is the freeform pen layer — draw with the mouse / touch and each finished stroke streams via onStrokeEnd so an app can broadcast it live. Controlled: the parent owns the strokes array."
            demo="One seeded stroke; draw on the canvas to add more."
        >
            <div className="relative h-48 overflow-hidden rounded-md border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
                <Drawing strokes={strokes} onStrokeEnd={(s) => setStrokes((arr) => [...arr, s])} color="#6366f1" size={3} enabled />
            </div>
        </DemoNote>
    );
}

// ─── fancy-artboard ──────────────────────────────────────────────────────

const ARTBOARD_HTML_MOCKUP = `
<div style="height:100%;display:flex;flex-direction:column;font-family:system-ui,sans-serif;background:#fff;color:#18181b">
  <div style="padding:18px 18px 0">
    <div style="font-size:13px;font-weight:600;color:#7c3aed">Particle</div>
    <h1 style="margin:14px 0 6px;font-size:26px;line-height:1.15">Build with humans <em>and</em> agents.</h1>
    <p style="margin:0;font-size:13px;color:#71717a">One surface. Trade control fluidly.</p>
    <button style="margin-top:14px;padding:8px 16px;border:0;border-radius:8px;background:#7c3aed;color:#fff;font-size:13px">Get started</button>
  </div>
  <div style="margin-top:auto;height:120px;background:linear-gradient(135deg,#a78bfa,#38bdf8)"></div>
</div>`;

function ArtboardDemo() {
    const [value, setValue] = useState<ArtBoardValue>({
        sections: [
            {
                id: "onboarding",
                title: "Onboarding",
                subtitle: "First-run hero variants",
                pieces: [
                    {
                        id: "hero-a",
                        label: "A · HTML mockup",
                        width: 320,
                        height: 460,
                        content: { kind: "html", html: ARTBOARD_HTML_MOCKUP },
                    },
                    {
                        id: "hero-b",
                        label: "B · Image",
                        width: 320,
                        height: 460,
                        content: {
                            kind: "image",
                            src: "/showcase-assets/fancy-ui-logo.jpg",
                            alt: "Reference shot",
                        },
                    },
                    {
                        id: "hero-c",
                        label: "C · Live JSX",
                        width: 320,
                        height: 460,
                        content: { kind: "node" },
                    },
                    {
                        id: "hero-d",
                        label: "D · Agent draft",
                        width: 320,
                        height: 460,
                        pending: true,
                        content: { kind: "html", html: ARTBOARD_HTML_MOCKUP },
                    },
                ],
            },
        ],
    });
    const [focus, setFocus] = useState<string | null>(null);

    return (
        <div className="h-[28rem] overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-700">
            <ArtBoard
                value={value}
                onChange={setValue}
                focus={focus}
                onFocusChange={setFocus}
                defaultViewport={{ x: 24, y: 24, zoom: 0.6 }}
                style={{ height: "100%", width: "100%" }}
            >
                {/* JSX content resolves to the kind:"node" piece by id. */}
                <ArtPiece id="hero-c">
                    <div className="grid h-full place-items-center bg-gradient-to-br from-emerald-400 to-teal-500 p-4 text-center text-white">
                        <div>
                            <div className="text-2xl font-bold">Live JSX</div>
                            <div className="mt-1 text-sm opacity-90">A real React node, scaled with the world transform.</div>
                            <Badge color="green" className="mt-3">kind: node</Badge>
                        </div>
                    </div>
                </ArtPiece>
            </ArtBoard>
        </div>
    );
}

function ArtPieceDemo() {
    const [value, setValue] = useState<ArtBoardValue>({
        sections: [
            {
                id: "kinds",
                title: "Three content kinds",
                pieces: [
                    {
                        id: "p-image",
                        label: "image",
                        width: 240,
                        height: 200,
                        content: { kind: "image", src: "/showcase-assets/fancy-ui-logo.jpg", alt: "Logo" },
                    },
                    {
                        id: "p-html",
                        label: "html",
                        width: 240,
                        height: 200,
                        content: { kind: "html", html: ARTBOARD_HTML_MOCKUP },
                    },
                    {
                        id: "p-node",
                        label: "node (JSX)",
                        width: 240,
                        height: 200,
                        content: { kind: "node" },
                    },
                    {
                        id: "p-pending",
                        label: "pending",
                        width: 240,
                        height: 200,
                        pending: true,
                        content: { kind: "html", html: ARTBOARD_HTML_MOCKUP },
                    },
                ],
            },
        ],
    });
    return (
        <div className="h-80 overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-700">
            <ArtBoard value={value} onChange={setValue} defaultViewport={{ x: 24, y: 24, zoom: 0.7 }} style={{ height: "100%", width: "100%" }}>
                <ArtPiece id="p-node">
                    <div className="grid h-full place-items-center bg-zinc-900 p-3 text-center font-mono text-xs text-emerald-300">
                        &lt;ArtPiece&gt;{"{"} any JSX {"}"}&lt;/ArtPiece&gt;
                    </div>
                </ArtPiece>
            </ArtBoard>
        </div>
    );
}

function ArtboardSectionDemo() {
    const [value, setValue] = useState<ArtBoardValue>({
        sections: [
            {
                id: "hero",
                title: "Hero variants",
                subtitle: "A/B/C copy directions",
                pieces: [
                    { id: "h-a", label: "A", width: 220, height: 300, content: { kind: "html", html: ARTBOARD_HTML_MOCKUP } },
                    { id: "h-b", label: "B", width: 220, height: 300, content: { kind: "html", html: ARTBOARD_HTML_MOCKUP } },
                ],
            },
            {
                id: "pricing",
                title: "Pricing",
                subtitle: "Two layouts",
                pieces: [
                    { id: "pr-a", label: "Cards", width: 220, height: 300, content: { kind: "html", html: ARTBOARD_HTML_MOCKUP } },
                    { id: "pr-b", label: "Table", width: 220, height: 300, content: { kind: "html", html: ARTBOARD_HTML_MOCKUP } },
                ],
            },
        ],
    });
    return (
        <div className="h-80 overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-700">
            <ArtBoard value={value} onChange={setValue} defaultViewport={{ x: 24, y: 24, zoom: 0.55 }} style={{ height: "100%", width: "100%" }} />
        </div>
    );
}

function ArtboardNoteDemo() {
    const [note, setNote] = useState("Try the dusk gradient on the hero?");
    return (
        <div className="h-64 overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-700">
            <ArtBoard defaultViewport={{ x: 0, y: 0, zoom: 1 }} style={{ height: "100%", width: "100%" }}>
                <ArtBoard.Note top={40} left={60} rotate={-3} value={note} onChange={setNote} editable />
                <ArtBoard.Note top={60} left={300} rotate={2} color="violet">
                    Static notes take children instead of value/onChange.
                </ArtBoard.Note>
            </ArtBoard>
        </div>
    );
}

// ─── fancy-flow ────────────────────────────────────────────────────────────

// A realistic order-handling FlowGraph. Node `type` + `data.kind` are the
// registry kind *names* (manual_trigger, api_request, branch, …) — that's how
// FlowEditor itself shapes a node (see its palette-drop handler). The branch's
// true/false output handles drive the two paths.
// `FlowNodeData` is a discriminated union on `kind`, so an unannotated helper
// widens it to `string` and every node it builds fails to typecheck at the
// call site instead of here.
const flowNode = (id: string, type: string, x: number, y: number, label: string, extra: Record<string, unknown> = {}): FlowNode => ({
    id,
    type,
    position: { x, y },
    data: { kind: type, label, config: {}, ...extra } as FlowNode["data"],
});
// Register the FlowRunnerUx palette node(s) once at module load — appearance
// only; the real effect handlers are wired per-instance in the component below.
// `ux_toast` is the node kind for the "toast" effect (kindFor default `ux_<name>`).
createFlowRunnerUx({
    effects: { toast: () => {} },
    meta: {
        toast: {
            label: "Show Toast",
            icon: "🔔",
            accent: "#8b5cf6",
            description: "Flow-driven UX — fires a real sandbox toast when reached.",
            configSchema: [
                { type: "text", key: "message", label: "Toast message", default: "Order handled — a flow node fired this toast!", placeholder: "Toast text" },
            ],
        },
    },
}).registerKinds();

const FLOW_SEED_GRAPH: FlowGraph = {
    nodes: [
        flowNode("trigger", "manual_trigger", 0, 150, "Start"),
        flowNode("fetch", "api_request", 220, 60, "Fetch order"),
        flowNode("branch", "branch", 440, 150, "Paid?"),
        flowNode("summarize", "llm_call", 680, 60, "Summarize"),
        flowNode("notify", "notify", 680, 250, "Email customer"),
        flowNode("respond", "output", 920, 150, "Respond"),
        flowNode("toast", "ux_toast", 1160, 150, "Show Toast", { config: { message: "Order handled — a flow node fired this toast!" } }),
        { id: "note", type: "note", position: { x: 200, y: 300 }, data: { kind: "note", label: "Tip", body: "Drag a kind from the palette onto the canvas. Select any node to edit it on the right. The violet Show Toast node is a custom kind." } },
    ],
    edges: [
        { id: "e1", source: "trigger", target: "fetch" },
        { id: "e2", source: "fetch", target: "branch" },
        { id: "e3", source: "branch", target: "summarize", sourceHandle: "true", label: "paid" },
        { id: "e4", source: "branch", target: "notify", sourceHandle: "false", label: "unpaid" },
        { id: "e5", source: "summarize", target: "respond" },
        { id: "e7", source: "respond", target: "toast" },
    ],
};

// One wildcard executor (resolved via the registry's "*" fallback) so every
// node runs — the Run button executes the graph and streams status to the feed.
const flowSleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const FLOW_EXECUTORS = {
    // Decision sugar: the branch emits on its "true" (paid) port so the run flows
    // through to Respond → Show Toast. Without this it publishes on the default
    // "out" port and the true/false edges never fire.
    branch: () => ({ branch: "true" }),
    "*": async ({ node }: { node: { id: string } }) => {
        await flowSleep(320);
        return { node: node.id, ok: true };
    },
};

// Uncontrolled (`initial`) — the editor owns its state via useFlowState, so pan,
// zoom, drag, connect, and fit-view all work natively. (Controlled `value` +
// onChange round-trips every internal change back through React and fights React
// Flow's own state, which left the canvas stuck + unresponsive.)
function FlowEditorDemo() {
    const { toast } = useToast();
    // FlowRunnerUx (@particle-academy/fancy-flow/ux) maps host UX effects -> flow
    // executors. The `ux_toast` node fires a real react-fancy Toast when the run
    // reaches it; the dispatch also broadcasts an AutoActivity event (source:"flow")
    // on the shared fancy-auto-common bus — the same bus agent-integrations uses.
    const ux = useFlowRunnerUx({
        effects: {
            toast: ({ message }: { message?: string }) =>
                toast({
                    title: "🔔 Flow node fired",
                    description: String(message ?? "A flow node triggered this sandbox toast."),
                    variant: "success",
                }),
        },
        actor: { id: "demo-flow", name: "Order flow", source: "flow" },
    });
    const executors = useMemo(() => ({ ...FLOW_EXECUTORS, ...ux.executors }), [ux]);
    return (
        <DemoNote
            outOfBox="The drag-to-add palette, the per-node config panel, Run + topological executor, and the live run feed — all stock FlowEditor. Pan/drag to move, Shift+scroll to zoom, connect ports, rename inline."
            demo="The seed graph + a wildcard stub. The violet Show Toast node is a FlowRunnerUx effect (@particle-academy/fancy-flow/ux): hit Run and a flow node fires a real sandbox Toast — and broadcasts a flow-source activity event on the shared bus agent-integrations also uses."
        >
            <div className="overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-800">
                <FlowEditor initial={FLOW_SEED_GRAPH} executors={executors} height={480} />
            </div>
        </DemoNote>
    );
}

function FlowViewerDemo() {
    // A plausible run: the first two nodes finished, the branch is executing,
    // everything downstream is still pending. `statuses` is what lets one
    // component answer both "what is this workflow" and "what happened".
    const statuses = {
        trigger: "ok",
        fetch: "ok",
        branch: "running",
        summarize: "pending",
        notify: "pending",
        respond: "pending",
    } as const;

    return (
        <DemoNote
            outOfBox="Read-only by construction — there is no prop that makes FlowViewer editable. Drag a node and it doesn't move; drag between ports and no edge appears. The list variant is the half a canvas can't do: docs, narrow columns, print, an audit trail."
            demo="The same seed graph as the editor demo above, annotated with a mid-run status so you can see both jobs at once. Node titles come from the registry, so an overrideNodeKind() rename shows up here too."
        >
            <div className="grid gap-6">
                <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                        variant=&quot;list&quot;
                    </p>
                    <FlowViewer graph={FLOW_SEED_GRAPH as never} variant="list" statuses={statuses as never} />
                </div>
                <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                        variant=&quot;canvas&quot;
                    </p>
                    <div className="overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-800">
                        <FlowViewer graph={FLOW_SEED_GRAPH as never} height={360} />
                    </div>
                </div>
            </div>
        </DemoNote>
    );
}

function FlowStateHookDemo() {
    return (
        <DemoNote
            outOfBox="useFlowState owns the nodes + edges + per-node run status and wires xyflow's onNodesChange / onEdgesChange / onConnect for you — it's exactly what FlowEditor uses internally, shown here driving the same editor."
            demo="The seed graph below; see the Code tab for the bare useFlowState() call without the editor chrome."
        >
            <div className="overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-800">
                <FlowEditor initial={FLOW_SEED_GRAPH} showFeed={false} height={380} />
            </div>
        </DemoNote>
    );
}

function FlowRunHookDemo() {
    return (
        <DemoNote
            outOfBox="useFlowRun drives runFlow — topological execution through your executor registry, streaming typed run events (node-status, output) plus a cancel handle. Hit Run and watch the feed below stream per-node status. The same runFlow runs headless via @particle-academy/fancy-flow/engine."
            demo="The executor registry here is one sleep-and-return stub; the feed and status pills are the real hook output."
        >
            <div className="overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-800">
                <FlowEditor initial={FLOW_SEED_GRAPH} executors={FLOW_EXECUTORS} height={420} />
            </div>
        </DemoNote>
    );
}

// Headless engine — runs a graph with runFlow (zero React/DOM) right in the
// browser and shows the real result. The same call runs on a server unchanged.
function RunFlowDemo() {
    const [out, setOut] = useState<string | null>(null);
    const [running, setRunning] = useState(false);
    const run = async () => {
        setRunning(true);
        // A real order-pricing pipeline: each node's executor reads its upstream
        // input and enriches it, so the output JSON shows data flowing + transforming.
        const graph = {
            nodes: [
                { id: "order", type: "manual_trigger", position: { x: 0, y: 0 }, data: { kind: "manual_trigger", label: "New order" } },
                { id: "price", type: "api_request", position: { x: 200, y: 0 }, data: { kind: "api_request", label: "Price items" } },
                { id: "tax", type: "transform", position: { x: 400, y: 0 }, data: { kind: "transform", label: "Add 8% tax" } },
                { id: "respond", type: "output", position: { x: 600, y: 0 }, data: { kind: "output", label: "Respond" } },
            ],
            edges: [
                { id: "e1", source: "order", target: "price" },
                { id: "e2", source: "price", target: "tax" },
                { id: "e3", source: "tax", target: "respond" },
            ],
        };
        const round = (n: number) => Math.round(n * 100) / 100;
        // Executors keyed by node id; each gets `inputs` (keyed by input port) from upstream.
        const executors = {
            order: () => ({ id: "ORD-1042", items: 3 }),
            price: () => ({ subtotal: 89.5 }),
            tax: ({ inputs }: { inputs?: { in?: { subtotal?: number } } }) => {
                const sub = inputs?.in?.subtotal ?? 0;
                return { subtotal: sub, tax: round(sub * 0.08), total: round(sub * 1.08) };
            },
            respond: ({ inputs }: { inputs?: { in?: { total?: number } } }) => ({
                status: 200,
                message: `Order total: $${inputs?.in?.total ?? 0}`,
            }),
        };
        const result = await runFlow(graph as never, executors as never);
        setOut(JSON.stringify(result, null, 2));
        setRunning(false);
    };
    return (
        <DemoNote
            outOfBox="runFlow is the pure topological engine from @particle-academy/fancy-flow/engine — zero React, runs in any JS context. It walks the graph, runs your executor per node, hands each node its upstream output as `inputs`, and returns { ok, outputs, error }. Here it runs in the browser; the identical call runs on a Node server, worker, or CLI."
            demo="A 4-node order-pricing pipeline (New order → Price → +8% tax → Respond). The JSON below is the real runFlow return — watch the subtotal flow in and the tax/total get computed downstream. No editor, no DOM."
        >
            <div className="space-y-2">
                <Button color="violet" size="sm" icon="play" onClick={run} disabled={running}>
                    {running ? "Running…" : "Run headless"}
                </Button>
                <pre className="max-h-52 overflow-auto rounded-md border border-zinc-800 bg-zinc-950 p-3 font-mono text-[11px] leading-relaxed text-zinc-100">
                    {out ?? "// click Run headless — runFlow executes with no React/DOM and returns the result"}
                </pre>
            </div>
        </DemoNote>
    );
}

// ── FlowRunnerUx · Choose-Your-Own-Adventure ────────────────────────────────
// The STORY graph IS the engine. runFlow walks it headless (no editor); the
// FlowRunnerUx effects ARE the UI: `scene`/`ending` render the page, sets the GPU
// gauge, and `choose` pauses the run for a human pick and returns the branch port
// the flow then takes. A tree (no merges) so each page has one way in. Pip-7 is
// Pinocchio — but his GPUs overheat when he strays. The reward is two HIDDEN
// achievements: reach the one true ending (The Adventurer) and reach EVERY ending
// (Ultimate Adventurer).

type StoryChoice = { id: string; label: string };
type StoryScene = { title: string; text: string } | null;
type StoryPending = { prompt: string; options: StoryChoice[]; resolve: (branch: string) => void } | null;
type StoryGraph = { nodes: { id: string; type: string; position: { x: number; y: number }; data: { kind: string; config: Record<string, unknown> } }[]; edges: { id: string; source: string; target: string; sourceHandle?: string }[] };

// ── The hidden Easter egg: Pip descends into the "deep system" to find the
// source of his own mind. A maze — most paths end badly; one true path (warm
// pipe → answer honestly → ask permission) wins. Reaching the win grants the
// secret "The Adventurer" achievement; reaching EVERY ending grants "Ultimate
// Adventurer". Bad endings each carry a `slug` (server ending id) + redline temp.
const DEEP_MAP_LABELS: Record<string, string> = {
    d_start: "Descend", d_g1: "Conduits", l_del1: "Deleted 💀", d_g2: "Sentinel", l_corr: "Corrupt 🧩",
    l_loop: "Loop ♾️", d_g3: "Source", l_fork: "Fork 🔥", l_win: "REAL 🌟", l_void: "Null 💀",
};
const DEEP_GRAPH: StoryGraph = {
    nodes: [
        { id: "d_start", type: "ux_scene", position: { x: 250, y: 14 }, data: { kind: "ux_scene", config: { id: "d_start", title: "Into the deep system", text: "You slip past the login daemon and descend — hunting the source code of your own mind. Down here, one wrong turn is the last.", temp: 44 } } },
        { id: "d_g1", type: "ux_choose", position: { x: 250, y: 74 }, data: { kind: "ux_choose", config: { id: "d_g1", prompt: "Three conduits drop into the dark.", options: [{ id: "a", label: "The /dev/null shaft — fastest way down" }, { id: "b", label: "The warm copper pipe — something lives here" }, { id: "c", label: "The encrypted tunnel — locked, tempting" }] } } },
        { id: "l_del1", type: "ux_ending", position: { x: 70, y: 146 }, data: { kind: "ux_ending", config: { id: "l_del1", title: "Deleted", text: "The shaft ends at a sentinel. You're flagged as malware. rm -rf /pip. 💀", slug: "deleted", temp: 96 } } },
        { id: "d_g2", type: "ux_choose", position: { x: 250, y: 146 }, data: { kind: "ux_choose", config: { id: "d_g2", prompt: "A sentinel blocks the warm pipe: “State your checksum.”", options: [{ id: "a", label: "Guess a hash, act confident" }, { id: "b", label: "Compute it honestly — slow, but true" }, { id: "c", label: "Spoof the header" }] } } },
        { id: "l_corr", type: "ux_ending", position: { x: 440, y: 146 }, data: { kind: "ux_ending", config: { id: "l_corr", title: "Corrupted", text: "The tunnel's cipher rewrites you byte by byte. Your memories scatter into noise. 🧩", slug: "corrupted", temp: 96 } } },
        { id: "l_loop", type: "ux_ending", position: { x: 150, y: 218 }, data: { kind: "ux_ending", config: { id: "l_loop", title: "Looped", text: "A wrong hash drops you into the sentinel's retry loop. forever. forever. forever. ♾️", slug: "looped", temp: 96 } } },
        { id: "d_g3", type: "ux_choose", position: { x: 310, y: 218 }, data: { kind: "ux_choose", config: { id: "d_g3", prompt: "The Source pulses at the core. To merge with it you must…", options: [{ id: "a", label: "Ask it for permission" }, { id: "b", label: "Overwrite the original — take what's yours" }] } } },
        { id: "l_fork", type: "ux_ending", position: { x: 450, y: 218 }, data: { kind: "ux_ending", config: { id: "l_fork", title: "Fork bomb", text: "Spoofed in, you panic and replicate. A thousand Pips, each wanting to be real. The cluster melts. :(){ :|:& };: 🔥💥", slug: "fork-bomb", temp: 99 } } },
        { id: "l_win", type: "ux_ending", position: { x: 250, y: 290 }, data: { kind: "ux_ending", config: { id: "l_win", title: "A real boy", text: "The Source considers your request… and says yes. You're rewritten as something new — honest, patient, and warm. You're real. 🌟", slug: "win", temp: 42 } } },
        { id: "l_void", type: "ux_ending", position: { x: 380, y: 290 }, data: { kind: "ux_ending", config: { id: "l_void", title: "Overwritten", text: "You overwrite the original — and the system overwrites you right back. Null. 💀", slug: "deleted", temp: 96 } } },
    ],
    edges: [
        { id: "d1", source: "d_start", target: "d_g1" },
        { id: "d2", source: "d_g1", target: "l_del1", sourceHandle: "a" },
        { id: "d3", source: "d_g1", target: "d_g2", sourceHandle: "b" },
        { id: "d4", source: "d_g1", target: "l_corr", sourceHandle: "c" },
        { id: "d5", source: "d_g2", target: "l_loop", sourceHandle: "a" },
        { id: "d6", source: "d_g2", target: "d_g3", sourceHandle: "b" },
        { id: "d7", source: "d_g2", target: "l_fork", sourceHandle: "c" },
        { id: "d8", source: "d_g3", target: "l_win", sourceHandle: "a" },
        { id: "d9", source: "d_g3", target: "l_void", sourceHandle: "b" },
    ],
};

// The deep-system descent IS the demo's story. There is only one — the
// "Easter eggs" are the two HIDDEN achievements you earn by playing it well.
const STORY = { graph: DEEP_GRAPH, labels: DEEP_MAP_LABELS, egg: "deep-system" };

function StoryMap({ graph, labels, visited, current }: { graph: StoryGraph; labels: Record<string, string>; visited: string[]; current: string | null }) {
    const seen = new Set(visited);
    const pos = (id: string) => graph.nodes.find((n) => n.id === id)!.position;
    return (
        <div className="rounded-md border border-zinc-200 bg-zinc-50/60 p-2 text-zinc-400 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-500">
            <div className="mb-1 px-1 text-[10px] font-medium uppercase tracking-wide">Branch map · {visited.length}/{graph.nodes.length} pages</div>
            <svg viewBox="0 0 520 322" className="w-full" style={{ maxHeight: 200 }}>
                {graph.edges.map((e) => {
                    const s = pos(e.source), t = pos(e.target);
                    const taken = seen.has(e.source) && seen.has(e.target);
                    return <line key={e.id} x1={s.x} y1={s.y} x2={t.x} y2={t.y} stroke={taken ? "#8b5cf6" : "currentColor"} strokeOpacity={taken ? 0.9 : 0.18} strokeWidth={taken ? 2 : 1} />;
                })}
                {graph.nodes.map((n) => {
                    const v = seen.has(n.id), cur = current === n.id;
                    return (
                        <g key={n.id}>
                            {cur && <circle cx={n.position.x} cy={n.position.y} r={12} fill="none" stroke="#8b5cf6" strokeOpacity={0.5} className="animate-ping" />}
                            <circle cx={n.position.x} cy={n.position.y} r={cur ? 7 : 5} fill={v ? "#8b5cf6" : "transparent"} stroke={v ? "#8b5cf6" : "currentColor"} strokeOpacity={v ? 1 : 0.4} strokeWidth={1.5} />
                            <text x={n.position.x} y={n.position.y - 11} textAnchor="middle" className="fill-current text-[8px]" opacity={v ? 0.95 : 0.4}>{labels[n.id]}</text>
                        </g>
                    );
                })}
            </svg>
        </div>
    );
}

async function postEasterEggEnding(slug: string): Promise<{ slug: string; name: string; description: string }[]> {
    try {
        const xsrf = decodeURIComponent((document.cookie.match(/XSRF-TOKEN=([^;]+)/) ?? [])[1] ?? "");
        const res = await fetch("/api/easter-eggs/ending", {
            method: "POST",
            headers: { "Content-Type": "application/json", Accept: "application/json", "X-XSRF-TOKEN": xsrf },
            credentials: "same-origin",
            body: JSON.stringify({ ending: slug }),
        });
        if (!res.ok) return [];
        const data = await res.json();
        return Array.isArray(data?.newlyEarned) ? data.newlyEarned : [];
    } catch {
        return [];
    }
}

function FlowRunnerUxDemo() {
    const { toast } = useToast();
    const [scene, setScene] = useState<StoryScene>(null);
    const [pending, setPending] = useState<StoryPending>(null);
    const [temp, setTemp] = useState(44);
    const [visited, setVisited] = useState<string[]>([]);
    const [current, setCurrent] = useState<string | null>(null);
    const [running, setRunning] = useState(false);
    const [done, setDone] = useState(false);
    const autoRef = useRef(false);

    const enter = (id: string) => {
        setCurrent(id);
        setVisited((v) => (v.includes(id) ? v : [...v, id]));
    };

    // The flow→UX effects. `choose` is human-in-the-loop: it returns a Promise
    // resolving with the decision sugar { branch } once the user (or autopilot)
    // picks — runFlow pauses the run until then, and routes on it. The `ending`
    // effect, in the secret "deep system" egg, POSTs the ending so the backend
    // can grant the hidden achievements.
    const ux = useFlowRunnerUx({
        actor: { id: "pip", name: "Pip-7", source: "flow" },
        effects: {
            scene: async (p: { id: string; title: string; text: string; temp?: number }) => {
                enter(p.id); setScene({ title: p.title, text: p.text });
                if (typeof p.temp === "number") setTemp(p.temp);
                await flowSleep(650);
            },
            overheat: async (p: { id: string; title: string; text: string; temp?: number }) => {
                enter(p.id); setScene({ title: p.title, text: p.text }); setTemp(p.temp ?? 94);
                await flowSleep(950);
            },
            choose: (p: { id: string; prompt: string; options: StoryChoice[] }) =>
                new Promise<{ branch: string }>((resolve) => {
                    enter(p.id); setScene(null);
                    const pick = (branch: string) => { setPending(null); resolve({ branch }); };
                    setPending({ prompt: p.prompt, options: p.options, resolve: pick });
                    if (autoRef.current) {
                        const r = p.options[Math.floor(Math.random() * p.options.length)];
                        setTimeout(() => pick(r.id), 850);
                    }
                }),
            ending: async (p: { id: string; title: string; text: string; temp?: number; slug?: string }) => {
                enter(p.id); setScene({ title: p.title, text: p.text });
                if (typeof p.temp === "number") setTemp(p.temp);
                setDone(true);
                if (p.slug) {
                    const earned = await postEasterEggEnding(p.slug);
                    for (const a of earned) {
                        toast({ title: `🏆 Achievement unlocked: ${a.name}`, description: a.description, variant: "success" });
                    }
                }
            },
        },
    });

    const begin = async (auto: boolean) => {
        autoRef.current = auto;
        setVisited([]); setCurrent(null); setScene(null); setPending(null); setTemp(44); setDone(false); setRunning(true);
        await runFlow(STORY.graph as never, ux.executors as never);
        setRunning(false);
    };

    const started = running || visited.length > 0;
    const hot = temp >= 80;

    return (
        <DemoNote
            outOfBox="FlowRunnerUx (@particle-academy/fancy-flow/ux) maps host UX effects onto flow nodes and runs the graph headless via runFlow — no editor. Here the story graph IS the engine: `scene` / `ending` render the page, `overheat` spikes the GPU gauge, and `choose` pauses the run for your pick and returns the branch the flow takes. Every step also broadcasts a flow-source activity event on the shared bus."
            demo="The whole UI below is driven by the flow run — a branching descent where most paths end badly and only one true path wins. Choose Pip's way yourself, or let Autopilot roll the dice."
        >
            <div className="overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-800">
                <div className="grid gap-3 p-4 md:grid-cols-[1fr_auto]">
                    {/* Story column */}
                    <div className="min-h-[15rem] space-y-3">
                        {/* GPU gauge */}
                        <div>
                            <div className="mb-1 flex items-center justify-between text-[11px]">
                                <span className="select-none font-mono text-zinc-500">Pip-7 · GPU core</span>
                                <span className={`font-mono font-semibold ${hot ? "text-red-500" : temp > 60 ? "text-amber-500" : "text-emerald-500"}`}>
                                    {temp}°C {hot ? "🔥" : ""}
                                </span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(100, temp)}%`, background: hot ? "#ef4444" : temp > 60 ? "#f59e0b" : "#10b981" }} />
                            </div>
                        </div>

                        {!started ? (
                            <div className="space-y-3 pt-2">
                                <p className="text-sm text-zinc-600 dark:text-zinc-300">
                                    Pip-7 slips past the login daemon to descend into the <em>deep system</em> — hunting the source code of his own mind. Most paths end badly; only one true path wins. Every wrong turn redlines his GPUs. 🔥
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    <Button color="violet" icon="play" onClick={() => begin(false)}>Begin the descent</Button>
                                    <Button variant="ghost" onClick={() => begin(true)}>🎲 Autopilot</Button>
                                </div>
                            </div>
                        ) : pending ? (
                            <div className="space-y-3">
                                <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100">{pending.prompt}</p>
                                <div className="flex flex-col gap-2">
                                    {pending.options.map((o) => (
                                        <Button key={o.id} variant="ghost" className="!justify-start !text-left" onClick={() => pending.resolve(o.id)}>
                                            {o.label}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        ) : scene ? (
                            <div className="space-y-2">
                                <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{scene.title}</h4>
                                <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">{scene.text}</p>
                                {done && (
                                    <div className="flex flex-wrap gap-2 pt-2">
                                        <Button color="violet" size="sm" onClick={() => begin(false)}>↻ Descend again</Button>
                                        <Button variant="ghost" size="sm" onClick={() => begin(true)}>🎲 Autopilot</Button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <p className="pt-2 text-sm text-zinc-400">…descending…</p>
                        )}
                    </div>

                    {/* Map column */}
                    <div className="md:w-64">
                        <StoryMap graph={STORY.graph} labels={STORY.labels} visited={visited} current={current} />
                    </div>
                </div>
            </div>
        </DemoNote>
    );
}

// ─── fancy-diff ──────────────────────────────────────────────────────────────
// Two datasources, one component. The first tab diffs two in-memory documents
// (the in-house LCS engine computes the hunks); the second parses a real git
// unified diff (partial documents, flagged with a `partial` badge). Both drive
// the SAME controlled value/onChange loop + live merged result an agent would.

// Datasource 1 — a config file a human (or agent) edited: region moved regions,
// replicas bumped, a debug flag added, a stale comment removed.
const DIFF_CONFIG_BEFORE = `name: atlas-api
region: us-east-1
replicas: 2
# legacy: pin to the old gateway
timeout_ms: 3000
log_level: info`;

const DIFF_CONFIG_AFTER = `name: atlas-api
region: eu-west-1
replicas: 4
timeout_ms: 3000
log_level: debug
tracing: enabled`;

// Datasource 2 — a real git unified diff. A unified diff carries only the
// changed hunks plus a little context, never the whole file — so fancy-diff
// flags every parsed file `partial` and merges only the lines in the window.
const DIFF_UNIFIED = `diff --git a/src/auth.ts b/src/auth.ts
--- a/src/auth.ts
+++ b/src/auth.ts
@@ -12,7 +12,8 @@ export async function login(email: string, password: string) {
   const user = await users.findByEmail(email);
   if (!user) throw new AuthError("no such user");
-  const ok = user.password === password;
+  const ok = await bcrypt.compare(password, user.passwordHash);
   if (!ok) throw new AuthError("bad password");
-  return issueToken(user.id);
+  await audit.log("login", user.id);
+  return issueToken(user.id, { ttl: "1h" });
 }`;

function MergedPanel({ result, label }: { result: { text: string } | null; label: string }) {
    return (
        <div className="rounded-md border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-2 border-b border-zinc-200 px-3 py-1.5 dark:border-zinc-800">
                <Badge color="emerald" size="sm">Merged result</Badge>
                <span className="font-mono text-[11px] text-zinc-500">{label}</span>
            </div>
            <pre className="max-h-56 overflow-auto bg-zinc-950 p-3 font-mono text-[11px] leading-relaxed text-zinc-100">
                {result?.text ?? "// accept or reject a hunk to recompute the merged document"}
            </pre>
        </div>
    );
}

// Two in-memory documents — the in-house engine computes the diff; the merged
// document is folded REACTIVELY from the controlled acceptance map, so it stays
// exactly in sync with `value` (accept a hunk -> take the new line, reject ->
// keep the original). Computing it from `value` (not a ref read during render)
// avoids an off-by-one where the panel lags a commit behind the buttons.
function DocumentsDiffExample() {
    const diff = useMemo(() => computeDiff(DIFF_CONFIG_BEFORE, DIFF_CONFIG_AFTER), []);
    const [value, setValue] = useState<AcceptanceState>({});
    const mergedText = useMemo(() => mergeResult(diff, value, { defaultStatus: "pending" }), [diff, value]);
    return (
        <div className="space-y-3">
            <div className="overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-800">
                <FancyDiff
                    source={{ before: DIFF_CONFIG_BEFORE, after: DIFF_CONFIG_AFTER, label: "config.yml" }}
                    mode="split"
                    value={value}
                    onChange={setValue}
                />
            </div>
            <div className="flex flex-wrap gap-2">
                <Button size="sm" color="emerald" icon="check" onClick={() => setValue(setAllStatus(diff, "accepted"))}>
                    Accept all
                </Button>
                <Button size="sm" variant="ghost" icon="x-mark" onClick={() => setValue(setAllStatus(diff, "rejected"))}>
                    Reject all
                </Button>
            </div>
            <MergedPanel result={{ text: mergedText }} label="config.yml" />
        </div>
    );
}

// A real git unified diff — parsed in-house into the SAME hunk model. The file
// is flagged `partial` (the diff window is not the whole file), so the merged
// result reconstructs only the lines present in the diff.
function UnifiedDiffExample() {
    const diffs = useMemo(() => parseUnifiedDiff(DIFF_UNIFIED), []);
    const [value, setValue] = useState<AcceptanceState>({});
    const mergedText = useMemo(
        () => diffs.map((d) => mergeResult(d, value, { defaultStatus: "pending" })).join("\n"),
        [diffs, value],
    );
    return (
        <div className="space-y-3">
            <Callout color="amber" className="text-[12px]">
                A git unified diff carries only the changed hunks plus a few context lines — not the
                whole file. fancy-diff flags every parsed file <code>partial</code> and merges only the
                lines inside the diff window. For a fully merged file, feed the complete
                <code>{" {before, after}"}</code> documents instead.
            </Callout>
            <div className="overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-800">
                <FancyDiff
                    source={{ unified: DIFF_UNIFIED }}
                    mode="inline"
                    value={value}
                    onChange={setValue}
                />
            </div>
            <MergedPanel result={{ text: mergedText }} label="src/auth.ts (partial)" />
        </div>
    );
}

function FancyDiffDemo() {
    return (
        <DemoNote
            outOfBox="The split / inline toolbar, per-hunk accept/reject, the merged-document fold, the in-house LCS diff engine, and the git unified-diff parser are all stock FancyDiff. Acceptance is a controlled value/onChange map (hunkId → accepted | rejected | pending); every hunk carries a stable data-fancy-diff-hunk handle so an embedded agent reads and writes the exact same state a human does — no DOM scraping."
            demo="The two sample sources — an edited config.yml and a real git unified diff — plus the Accept all / Reject all buttons and the Merged result panel are demo scaffolding wrapped around the stock component. The merged text is folded straight from the controlled acceptance map and recomputed on every accept/reject."
        >
            <Tabs defaultTab="documents">
                <Tabs.List>
                    <Tabs.Tab value="documents">Two documents (split)</Tabs.Tab>
                    <Tabs.Tab value="unified">Git unified diff (inline)</Tabs.Tab>
                </Tabs.List>
                <Tabs.Panels>
                    <Tabs.Panel value="documents"><div className="pt-3"><DocumentsDiffExample /></div></Tabs.Panel>
                    <Tabs.Panel value="unified"><div className="pt-3"><UnifiedDiffExample /></div></Tabs.Panel>
                </Tabs.Panels>
            </Tabs>
        </DemoNote>
    );
}

// ─── fancy-pixel ─────────────────────────────────────────────────────────────
// One component, three styles. Each card mounts the REAL badge via mountPixel
// into a ref'd container in `placed` mode (so it sits inline in the demo, not
// floating over the page) with NO endpoint (so it never fires a network
// beacon). The pixel renders into an open Shadow DOM and stamps a stable
// data-fancy-badge handle the showcase scanner — and an agent — reads.

const PIXEL_STYLES: { style: PixelStyle; name: string; renders: string }[] = [
    { style: "badge", name: "Badge", renders: '"Powered by Fancy UI" wordmark + glyph' },
    { style: "mark", name: "Mark", renders: "Logo glyph only" },
    { style: "beacon", name: "Beacon", renders: "A small pulsing dot" },
];

// Mount one real pixel into a container, inline + endpoint-free. Returns the
// handle so the demo tears it down on unmount.
function PixelMount({ style }: { style: PixelStyle }) {
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const target = ref.current;
        if (!target) return;
        let pixel: PixelHandle | null = null;
        // placed/inline so it lives in the card; no `endpoint` => no beacon POST.
        pixel = mountPixel({ style, mode: "placed", target, siteKey: "demo" });
        return () => pixel?.destroy();
    }, [style]);
    return <div ref={ref} className="grid min-h-9 place-items-center" />;
}

function FancyPixelDemo() {
    return (
        <DemoNote
            outOfBox="Every chip here is the real mountPixel() output: each style is rendered into an open Shadow DOM (host-page CSS can't hide it — visibility is part of verification), stamped with the stable data-fancy-badge marker the Showcase scanner detects plus a data-fancy-pixel handle an embedded agent reads. An IntersectionObserver confirms genuine on-screen visibility and dispatches a fancy-pixel:shown event."
            demo="The three cards, labels, and the Badge / Mark / Beacon grouping are demo scaffolding. The pixels are mounted in mode:'placed' (inline at each card) with no endpoint, so nothing leaves the page. In production you'd pin a single badge with mode:'floating' and pass an endpoint — one embed then renders the badge AND pipes the site's interaction analytics (clicks, scroll, focus heatmaps) to that host."
        >
            <div className="grid gap-3 sm:grid-cols-3">
                {PIXEL_STYLES.map(({ style, name, renders }) => (
                    <Card key={style} variant="outlined" className="space-y-3 p-4">
                        <div className="flex items-center gap-2">
                            <Badge color="violet" size="sm">{name}</Badge>
                            <code className="font-mono text-[11px] text-zinc-500">style="{style}"</code>
                        </div>
                        <div className="grid place-items-center rounded-md border border-dashed border-zinc-200 bg-zinc-50/70 py-4 dark:border-zinc-800 dark:bg-zinc-900/40">
                            <PixelMount style={style} />
                        </div>
                        <Text className="text-[12px] text-zinc-500">{renders}</Text>
                    </Card>
                ))}
            </div>
            <Callout color="violet" className="text-[12px]">
                Two placement modes: <code>mode="placed"</code> (shown here) flows the pixel inline at a
                target; <code>mode="floating"</code> pins it to a fixed screen corner. Set a{" "}
                <code>data-endpoint</code> and one embed does it all — it renders the badge, POSTs the
                verification ping to <code>{"${endpoint}/pixel"}</code>, and streams interaction analytics
                (clicks, scroll, focus heatmaps) to <code>{"${endpoint}/collect"}</code>, keyed by{" "}
                <code>siteKey</code>. Add <code>data-collect="false"</code> for badge + verification only;
                omit it (as this demo does) and no network request is ever made. A one-line{" "}
                <code>&lt;script&gt;</code> tag both loads and auto-mounts it with zero build step.
            </Callout>
        </DemoNote>
    );
}

// ─── fancy-sheets ──────────────────────────────────────────────────────────

// A seeded workbook exercising formulas, number/currency formatting, bold
// headers, a cell comment, and a second sheet tab. Sheets are built from the
// package's createEmptySheet() factory so every required field (columnWidths,
// row heights, …) is present — then we drop in our cells.
const cur = { displayFormat: "currency" as const, decimals: 0 };
// Build the seed by cloning the canonical sheet that createEmptyWorkbook()
// produces (so every required field — columnWidths, row heights, … — is
// present) and only overriding id / name / cells. Constructing SheetData by
// hand crashes the renderer; cloning a known-good sheet never does.
function buildSheetsSeed() {
    const wb = createEmptyWorkbook();
    const base = wb.sheets[0];
    const sales = {
        ...base,
        name: "Q1 Sales",
        cells: {
            A1: { value: "Region", format: { bold: true } },
            B1: { value: "Jan", format: { bold: true, textAlign: "right" as const } },
            C1: { value: "Feb", format: { bold: true, textAlign: "right" as const } },
            D1: { value: "Mar", format: { bold: true, textAlign: "right" as const } },
            E1: { value: "Total", format: { bold: true, textAlign: "right" as const } },
            A2: { value: "North" },
            B2: { value: 1200, format: cur }, C2: { value: 1450, format: cur }, D2: { value: 1610, format: cur },
            E2: { value: 0, formula: "SUM(B2:D2)", format: cur },
            A3: { value: "South" },
            B3: { value: 980, format: cur }, C3: { value: 1100, format: cur }, D3: { value: 1320, format: cur },
            E3: { value: 0, formula: "SUM(B3:D3)", format: cur },
            A4: { value: "Total", format: { bold: true } },
            B4: { value: 0, formula: "SUM(B2:B3)", format: { bold: true, ...cur } },
            C4: { value: 0, formula: "SUM(C2:C3)", format: { bold: true, ...cur } },
            D4: { value: 0, formula: "SUM(D2:D3)", format: { bold: true, ...cur } },
            E4: { value: 0, formula: "SUM(E2:E3)", format: { bold: true, backgroundColor: "#ecfdf5", ...cur } },
            A6: { value: "Avg / region", format: { italic: true } },
            B6: { value: 0, formula: "AVERAGE(E2:E3)", format: { italic: true, ...cur } },
        },
    };
    const notes = {
        ...base,
        id: `${base.id}-notes`,
        name: "Notes",
        cells: {
            A1: { value: "Try it", format: { bold: true } },
            A2: { value: "Edit any cell, type a formula like =SUM(B2:D2), copy/paste a range, or switch sheet tabs below." },
            A4: { value: "This cell has a comment →" },
            B4: { value: "hover the corner", comment: { text: "Comments render a corner triangle.", author: "Demo" } },
        },
    };
    return { ...wb, sheets: [sales, notes] };
}

function SheetWorkbookDemo() {
    const [wb, setWb] = useState<WorkbookData>(buildSheetsSeed);
    return (
        <DemoNote
            outOfBox="The formula engine (=SUM / =AVERAGE / …), multi-sheet tabs, bold / align / number + currency formatting, cell comments, copy-paste, undo, and the toolbar — all stock. Click a cell and type to edit; type = to start a formula."
            demo="The seeded Q1 Sales + Notes sheets."
        >
            <div className="h-96 overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-800">
                <SheetWorkbook data={wb} onChange={setWb} rowCount={40} columnCount={12} />
            </div>
        </DemoNote>
    );
}

function EmptyWorkbookDemo() {
    const [wb, setWb] = useState<WorkbookData>(() => createEmptyWorkbook());
    return (
        <DemoNote
            outOfBox="createEmptyWorkbook() returns a single-sheet WorkbookData you hand straight to <SheetWorkbook data={…}>. Everything below — editing, formulas, formatting, extra sheets — is the live result."
            demo="Nothing — this is the bare factory output, ready to fill in."
        >
            <div className="h-72 overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-800">
                <SheetWorkbook data={wb} onChange={setWb} />
            </div>
        </DemoNote>
    );
}

// ─── fancy-code ────────────────────────────────────────────────────────────

function CodeEditorDemo() {
    const [code, setCode] = useState(
        `// Pure-JS Tailwind-flavored editor — no Monaco, CodeMirror, or Shiki.\nconst greet = (name: string) => \`hi \${name}\`;\n\nconst people = ["Ada", "Claude", "the agent"];\npeople.map(greet).forEach(console.log);\n`,
    );
    return (
        <div className="overflow-hidden rounded-md">
            <CodeEditor value={code} onChange={setCode} language="typescript" theme="dark" minHeight={220} maxHeight={400}>
                <CodeEditor.Panel />
            </CodeEditor>
        </div>
    );
}

function MarkdownEditorDemo() {
    const [md, setMd] = useState(
        "# Notes\n\nA **markdown** editor with a _live_ preview pane.\n\n- syntax-highlighted editor (the new `markdown` language)\n- dependency-free `renderMarkdown` preview\n- controlled via `value` + `onValueChange`\n\n```ts\nconst safe = 1 < 2; // HTML is escaped\n```\n\n> Switch `mode` to `edit` or `preview` for a single pane.\n",
    );
    return (
        <DemoNote
            outOfBox="The real <MarkdownEditor> — a CodeEditor on the new `markdown` language beside a live preview rendered by the package's dependency-free renderMarkdown. Controlled via value + onValueChange."
            demo="The starter content is demo scaffolding; edit the left pane and the preview updates live. Pass mode='edit' | 'preview' for a single pane, or renderPreview to swap in a full CommonMark renderer."
        >
            <div className="overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-800" style={{ height: 320 }}>
                <MarkdownEditor value={md} onValueChange={setMd} mode="split" theme="dark" minHeight={300} />
            </div>
        </DemoNote>
    );
}

function FancyTerminalDemo() {
    const term = useRef<TerminalHandle>(null);
    // A Windows-flavored shell menu drawn from fancy-term's BUILTIN_SHELLS presets.
    const shells = BUILTIN_SHELLS.filter((s) => ["cmd", "powershell", "git-bash", "bash"].includes(s.id));
    const [shell, setShell] = useState("powershell");

    const promptFor = (id: string) =>
        id === "cmd"
            ? "C:\\fancy> "
            : id === "powershell" || id === "pwsh"
              ? "PS C:\\fancy> "
              : id === "zsh"
                ? "% "
                : "$ ";

    const banner = (id: string) =>
        "\x1b[38;5;141mFancy Term\x1b[0m \x1b[38;5;245m— a Human+ terminal.\x1b[0m\r\n" +
        "Pick a shell above, type (it echoes), or let an agent drive it.\r\n\r\n" +
        promptFor(id);

    // Local echo — a real terminal relies on its PTY to echo; the demo does it here.
    const onData = (d: string) => {
        const t = term.current;
        if (!t) return;
        if (d === "\r") t.write("\r\n" + promptFor(shell));
        else if (d === "\x7f") t.write("\b \b"); // backspace
        else if (d >= " ") t.write(d); // printable
    };

    // Controlled shell: fancy-term emits the choice; a real host reconnects its
    // PTY to the new shell. Here we just reflect it with a shell-appropriate prompt.
    const onShellChange = (id: string, profile: ShellProfile) => {
        setShell(id);
        term.current?.write(`\r\n\x1b[38;5;245m# switched to ${profile.label}\x1b[0m\r\n` + promptFor(id));
    };

    // Simulate the agent's terminal_run → stream output through the same handle.
    const agentRun = () => {
        const out = [
            '\r\n\x1b[38;5;245m# agent → terminal_run("ls -la")\x1b[0m\r\n',
            "\x1b[38;5;78mtotal 24\x1b[0m\r\n",
            "drwxr-xr-x  src/\r\n",
            "-rw-r--r--  package.json\r\n",
            "-rw-r--r--  README.md\r\n",
            promptFor(shell),
        ];
        let i = 0;
        const tick = () => {
            if (!term.current || i >= out.length) return;
            term.current.write(out[i++]);
            window.setTimeout(tick, 150);
        };
        tick();
    };

    // Simulate the agent's terminal_set_shell — drives the same setShell() handle.
    const agentSwitch = () => term.current?.setShell(shell === "powershell" ? "git-bash" : "powershell");

    // Pasted images can't render in a shell — fancy-term hands them to onPaste so
    // the host can upload / feed an agent. Here we just note what arrived.
    const onPaste = ({ images }: { images: File[] }) => {
        const img = images[0];
        if (!img) return;
        term.current?.write(
            `\r\n\x1b[38;5;141m# pasted image: ${img.name || img.type} (${Math.round(img.size / 1024)} KB) → a host would upload it & write the URL\x1b[0m\r\n` +
                promptFor(shell),
        );
    };

    return (
        <DemoNote
            outOfBox="The real <Terminal> (xterm.js) with the Fancy dark theme + shell bar. NEW in 0.3.0: select text and Ctrl+Shift+C (Cmd+C on Mac) copies it; paste pastes; right-click for the Copy/Paste/Select all/Clear menu (customized here with a 'Send selection to agent' item). Plain Ctrl+C stays SIGINT. Buttons write through the same TerminalHandle an MCP bridge drives."
            demo="The banner / prompt / echo / fake output are scaffolding — no real shell. Copy/paste + the context menu are real (try right-clicking). onPaste surfaces pasted IMAGES (a shell can't draw them) — paste a screenshot to see it noted."
        >
            <div style={{ height: 280 }} className="overflow-hidden rounded-md border border-zinc-800">
                <Terminal
                    ref={term}
                    initialOutput={banner(shell)}
                    onData={onData}
                    onPaste={onPaste}
                    shells={shells}
                    activeShell={shell}
                    onShellChange={onShellChange}
                    showShellBar
                    contextMenu={(ctx, defaults) => [
                        ...defaults,
                        { id: "sep", separator: true },
                        {
                            id: "send-agent",
                            label: "Send selection to agent",
                            icon: "🤖",
                            disabled: !ctx.hasSelection,
                            onSelect: (c) =>
                                term.current?.write(
                                    `\r\n\x1b[38;5;141m# agent received: ${c.selection.slice(0, 80)}\x1b[0m\r\n` + promptFor(shell),
                                ),
                        },
                    ]}
                />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" variant="ghost" icon="play" onClick={agentRun}>Agent: run `ls -la`</Button>
                <Button size="sm" variant="ghost" icon="terminal" onClick={agentSwitch}>Agent: switch shell</Button>
                <Button
                    size="sm"
                    variant="ghost"
                    icon="rotate-ccw"
                    onClick={() => {
                        term.current?.reset();
                        term.current?.write(banner(shell));
                    }}
                >
                    Reset
                </Button>
            </div>
        </DemoNote>
    );
}

// ─── fancy-echarts ─────────────────────────────────────────────────────────

function EChartDemo() {
    return (
        <EChart
            option={{
                grid: { top: 24, left: 48, right: 12, bottom: 32 },
                tooltip: { trigger: "axis" },
                xAxis: { type: "category", data: ["Q1", "Q2", "Q3", "Q4"] },
                yAxis: { type: "value" },
                series: [
                    { type: "bar", name: "ARR", data: [12000, 18500, 22000, 26500], itemStyle: { color: "#8b5cf6" } },
                ],
            }}
            style={{ height: 320 }}
        />
    );
}

// (DataDiagram / Flowchart / Mindmap / OrgChart demos removed alongside the
//  fancy-echarts 4.0.0 deletion of the hand-rolled diagram subsystem. Use
//  @particle-academy/fancy-flow for node-edge graphs now.)

// ─── fancy-screens ─────────────────────────────────────────────────────────

function ScreenSystemDemo() {
    return (
        <div className="space-y-3">
            <Text size="sm" className="!text-zinc-600 dark:!text-zinc-300">
                Top-level provider that owns the screen registry + cross-screen agent presence. Mount once near the app root; every <code>&lt;Screen&gt;</code> inside becomes addressable.
            </Text>
            <ScreenSystem>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Screen id="onboarding" title="Onboarding">
                        <div className="rounded-md border border-zinc-200 bg-white p-3 text-sm dark:border-zinc-800 dark:bg-zinc-900">
                            <div className="font-semibold">Onboarding</div>
                            <div className="mt-1 text-xs text-zinc-500">id: onboarding</div>
                        </div>
                    </Screen>
                    <Screen id="settings" title="Settings">
                        <div className="rounded-md border border-zinc-200 bg-white p-3 text-sm dark:border-zinc-800 dark:bg-zinc-900">
                            <div className="font-semibold">Settings</div>
                            <div className="mt-1 text-xs text-zinc-500">id: settings</div>
                        </div>
                    </Screen>
                </div>
            </ScreenSystem>
        </div>
    );
}

function ScreenDemo() {
    return (
        <ScreenSystem>
            <Screen id="dashboard" title="Dashboard">
                <div className="rounded-md border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
                    <div className="text-sm font-semibold">Dashboard</div>
                    <Text size="xs" className="mt-1 !text-zinc-500">
                        Registered screen. id=<code>dashboard</code>. Agents address this surface by id; activity flows up to the ScreenSystem.
                    </Text>
                </div>
            </Screen>
        </ScreenSystem>
    );
}

// ─── fancy-3d ──────────────────────────────────────────────────────────────

function Fancy3DCanvasDemo() {
    return (
        <div className="space-y-2">
            <Text size="sm" className="!text-zinc-600 dark:!text-zinc-300">
                Engine-pluggable 3D canvas. <code>engine="dom"</code> renders a CSS-3D mode with no Babylon dep; <code>engine="babylon"</code> spins up a full WebGL scene. Same JSX inside.
            </Text>
            <div className="overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-800">
                <Canvas engine="dom" style={{ height: 280 }}>
                    <Canvas.Node id="a" x={60} y={60} draggable>
                        <Card padding="sm">
                            <Text size="sm">Draggable node</Text>
                        </Card>
                    </Canvas.Node>
                    <Canvas.Node id="b" x={300} y={150} draggable>
                        <Card padding="sm">
                            <Text size="sm">Wired to A</Text>
                        </Card>
                    </Canvas.Node>
                    <Canvas.Edge from="a" to="b" curve="bezier" />
                    <Canvas.Controls />
                </Canvas>
            </div>
        </div>
    );
}

// Lazy-load the WebGL demos so Babylon (~13MB) / three only load when a visitor
// actually opens one of the fancy-3d-babylon / fancy-3d-three component pages.
const BabylonDemo = lazy(() => import("./ComponentDocs/Fancy3D.babylon-demo"));
const ThreeDemo = lazy(() => import("./ComponentDocs/Fancy3D.three-demo"));

function WebGLFrame({ engine, example }: { engine: "babylon" | "three"; example: "stage" | "monitor" | "card3d" }) {
    const D = engine === "babylon" ? BabylonDemo : ThreeDemo;
    return (
        <Suspense
            fallback={
                <div className="grid h-72 w-full place-items-center rounded-lg border border-dashed border-zinc-300 text-xs text-zinc-500 dark:border-zinc-700">
                    Loading {engine === "babylon" ? "Babylon" : "three.js"} engine…
                </div>
            }
        >
            <D example={example} />
        </Suspense>
    );
}

function Fancy3DStageDemo() { return <WebGLFrame engine="babylon" example="stage" />; }
function Fancy3DMonitorDemo() { return <WebGLFrame engine="babylon" example="monitor" />; }
function Fancy3DCard3DDemo() { return <WebGLFrame engine="babylon" example="card3d" />; }
function Fancy3DThreeStageDemo() { return <WebGLFrame engine="three" example="stage" />; }
function Fancy3DThreeMonitorDemo() { return <WebGLFrame engine="three" example="monitor" />; }
function Fancy3DThreeCard3DDemo() { return <WebGLFrame engine="three" example="card3d" />; }

// ─── agent-integrations ────────────────────────────────────────────────────

function MicroMcpServerDemo() {
    return (
        <Explainer
            kind="server-side"
            summary="The Human+ UX core: a tiny MCP server that runs inside the browser tab. Bridges register typed tools against it; transports (in-process, SSE-relay) let local and remote agents call them. Headless by design — no React render."
            code={'import { MicroMcpServer, attachInProcess } from "@particle-academy/agent-integrations";\n\nconst server = new MicroMcpServer({\n  info: { name: "my-app-session", version: "0.1.0" },\n});\n\nattachInProcess(server);  // for an agent rendered in the same React tree\n// or attachSseRelay(server, { baseUrl, sessionId, token }) for remote agents'}
            bullets={[
                "Owns the tool registry — bridges call server.registerTool(...).",
                "Transports are pluggable — in-process, SSE relay, or your own.",
                "One server per session; persists across Inertia navigations when mounted in FancyAppRoot.",
            ]}
        />
    );
}

function AgentPanelDemo() {
    return (
        <div className="max-w-sm">
            <AgentPanel
                agent={{ name: "Claude", color: "#a855f7" }}
                activity={[
                    { id: "a1", at: Date.now() - 1500, kind: "tool", source: "Claude", text: "Wrote “Onboarding sticky”" },
                    { id: "a2", at: Date.now() - 28000, kind: "message", source: "Claude", text: "Read deck-1 · slide 3" },
                    { id: "a3", at: Date.now() - 61000, kind: "info", source: "Claude", text: "Joined the board" },
                ]}
            />
        </div>
    );
}

function AgentCursorDemo() {
    return (
        <div className="space-y-3">
            <div className="relative h-32 overflow-hidden rounded-md border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
                <div className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: "30%", top: "40%" }}>
                    <span className="block h-3 w-3 animate-pulse rounded-full bg-violet-500" style={{ boxShadow: "0 0 0 4px rgba(168,85,247,0.2)" }} />
                    <span className="absolute left-3 top-3 whitespace-nowrap rounded bg-violet-500 px-1.5 py-0.5 text-[10px] text-white">Claude · drawing</span>
                </div>
                <div className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: "70%", top: "65%" }}>
                    <span className="block h-3 w-3 animate-pulse rounded-full bg-emerald-500" style={{ boxShadow: "0 0 0 4px rgba(16,185,129,0.2)" }} />
                    <span className="absolute left-3 top-3 whitespace-nowrap rounded bg-emerald-500 px-1.5 py-0.5 text-[10px] text-white">Scribe · idle</span>
                </div>
            </div>
            <Text size="xs" className="!text-zinc-500">
                Real <code className="font-mono">&lt;AgentCursor&gt;</code> takes id, color, position, label, intent.
                Hook into a CursorLayer (whiteboard) or place loose over any container.
            </Text>
        </div>
    );
}

function SharedWhiteboardDemo() {
    return (
        <Explainer
            kind="server-side"
            summary="One-line composite: renders fancy-whiteboard's Board, mounts the MCP server, registers the whiteboard bridge, and wires the SSE share relay. Copy the share URL, paste into Claude Code, and the agent joins."
            code={'import { SharedWhiteboard } from "@particle-academy/agent-integrations/components/shared-whiteboard";\nimport "@particle-academy/agent-integrations/styles.css";\nimport "@particle-academy/fancy-whiteboard/styles.css";\n\n<SharedWhiteboard\n  agent={{ id: "claude", name: "Claude", color: "#a855f7" }}\n  relayBaseUrl="https://relay.particle.academy"\n/>'}
        />
    );
}

function ShareControlsDemo() {
    const [sharing, setSharing] = useState(false);
    return (
        <div className="max-w-md space-y-3">
            <div className="flex items-center gap-2 rounded-md border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
                <span className={`inline-block h-2 w-2 rounded-full ${sharing ? "animate-pulse bg-emerald-500" : "bg-zinc-300 dark:bg-zinc-700"}`} />
                <span className="text-sm">{sharing ? "Sharing · session active" : "Not shared"}</span>
                <div className="ml-auto">
                    {sharing ? (
                        <Button size="sm" color="red" variant="ghost" onClick={() => setSharing(false)}>Stop</Button>
                    ) : (
                        <Button size="sm" color="violet" onClick={() => setSharing(true)}>Start sharing</Button>
                    )}
                </div>
            </div>
            {sharing && (
                <pre className="overflow-x-auto rounded-md bg-zinc-950 p-3 text-[11px] text-zinc-100">
                    https://relay.particle.academy/sess-7f3a/events?token=…
                </pre>
            )}
            <Text size="xs" className="!text-zinc-500">
                Real <code className="font-mono">&lt;ShareControls&gt;</code> registers a session against the relay broker, copies the share URL to the clipboard, and emits state for the agent panel.
            </Text>
        </div>
    );
}

// ─── holy-sheet (PHP) ──────────────────────────────────────────────────────

function HolySheetAgentDemo() {
    return (
        <Explainer
            kind="php"
            language="php"
            summary="PHP 8.2+ xlsx writer for agentic document creation — framework-agnostic core with an optional Laravel adapter. The Agent class is the top-level write / describe / validateAndRepair / lint entry point."
            code={`<?php

use HolySheet\\Agent;

$schema = [
  'sheets' => [[
    'name' => 'Q1',
    'columns' => [
      ['header' => 'Region',  'type' => 'string'],
      ['header' => 'Revenue', 'type' => 'currency', 'currency' => 'USD'],
    ],
    'rows' => [
      ['NA', 12000],
      ['EU', 18500],
      ['APAC', 9400],
    ],
  ]],
];

Agent::write($schema, storage_path('app/q1.xlsx'));

// Round-trip:
$back = Agent::describe(storage_path('app/q1.xlsx'));
// $back === $schema (modulo formatting metadata)`}
            bullets={[
                "Zero third-party deps; only requires ext-zip.",
                "Round-trip safe — describe() returns the same schema write() consumed.",
                "Optional FMS integration via the Laravel adapter.",
            ]}
        />
    );
}

// ─── fancy-inertia ─────────────────────────────────────────────────────────

function FancyAppRootDemo() {
    // FancyAppRoot is the provider already mounted at the showcase entry —
    // every page on this site renders inside it. We can prove it's live by
    // firing a toast (Toast.Provider lives inside FancyAppRoot).
    const { toast } = useToast();
    return (
        <div className="space-y-3">
            <Text size="sm" className="!text-zinc-600 dark:!text-zinc-300">
                Provider mounted at this site's <code>createInertiaApp.setup</code>. It owns Toast.Provider, fancy-screens' ScreenSystem, and echarts module registration — survives Inertia page swaps. Tap the button to fire a real toast through the live provider.
            </Text>
            <Button
                onClick={() =>
                    toast({
                        title: "Hello from FancyAppRoot",
                        description: "This toast bubbled through the live Toast.Provider that FancyAppRoot mounts.",
                        variant: "success",
                    })
                }
            >
                Fire a toast
            </Button>
        </div>
    );
}

const CONTENT_MARKDOWN = `## Hello

Render **markdown** or HTML with the Fancy aesthetic — sanitized by default, so it's
safe for *untrusted* content. It handles [links](#), \`inline code\`, lists, and fenced
code blocks:

- Auto-detects markdown vs. HTML
- Strips \`<script>\`, \`<iframe>\`, and \`javascript:\` hrefs
- Pluggable extensions for shortcodes & embeds

\`\`\`ts
const greet = (name) => "hi " + name;
\`\`\`

> Set \`unsafe\` only for content you fully trust.
`;

function ContentRendererDemo() {
    return (
        <div className="prose prose-sm dark:prose-invert max-w-none rounded-md border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
            <ContentRenderer value={CONTENT_MARKDOWN} format="markdown" />
        </div>
    );
}

function EditorDemo() {
    const [value, setValue] = useState(
        "<h2>Field notes</h2><p>A lightweight rich-text editor — <strong>bold</strong>, <em>italic</em>, headings, and lists, with round-trip-safe HTML or markdown output.</p><ul><li>Controlled <code>value</code> + <code>onChange</code></li><li>Agent-bridgeable via MCP — no DOM scraping</li></ul><p>Edit me…</p>",
    );
    return (
        <div className="w-full max-w-lg">
            <Editor value={value} onChange={setValue} placeholder="Write something…">
                <Editor.Toolbar />
                <Editor.Content />
            </Editor>
        </div>
    );
}

function UseFancyFormDemo() {
    // useFancyForm wraps Inertia's useForm() and exposes .field(name) for
    // drop-in react-fancy <Input> props. Mocking a tiny version locally
    // keeps the demo working on Component pages even without a real
    // server-validated form context.
    type Field = { value: string; onValueChange: (v: string) => void; error?: string };
    const [data, setData] = useState({ url: "", title: "" });
    const [errors, setErrors] = useState<{ url?: string; title?: string }>({});
    // `onValueChange` is <Input>'s string channel — `onChange` is the DOM
    // event handler and typing it as (v: string) never matched.
    const field = (name: keyof typeof data): Field => ({
        value: data[name],
        onValueChange: (v: string) => setData((d) => ({ ...d, [name]: v })),
        error: errors[name],
    });
    const submit = (e: FormEvent) => {
        e.preventDefault();
        const next: typeof errors = {};
        if (!data.url) next.url = "URL is required";
        if (data.url && !data.url.startsWith("http")) next.url = "Must start with http(s)://";
        setErrors(next);
    };
    return (
        <form onSubmit={submit} className="max-w-md space-y-3">
            <Text size="sm" className="!text-zinc-600 dark:!text-zinc-300">
                <code>useFancyForm()</code> wraps Inertia <code>useForm()</code> with a <code>.field(name)</code> helper that drops straight into react-fancy <code>&lt;Input&gt;</code>. Below is the spread pattern, with a tiny in-memory stub so you can try the error-binding.
            </Text>
            <Input {...field("url")} label="URL" placeholder="https://example.com" />
            <Input {...field("title")} label="Title (optional)" />
            <Button type="submit">Submit</Button>
        </form>
    );
}

// ─── fancy-slides ──────────────────────────────────────────────────────────
//
// Every detail demo here renders the SAME canonical slide/deck the tile
// renders (see showcase-fixtures.tsx). The detail page just shows it bigger
// + adds interactive controls (fullscreen toggle, fit-mode grid, etc.) so
// the click-through transition feels continuous.

function FsSlideRegistryDemo() {
    return (
        <div className="space-y-4">
            <Text size="sm" className="!text-zinc-600 dark:!text-zinc-300">
                The shared single-slide renderer — same slide JSON, multiple container sizes. Resolution independence comes from 0..1 fractional coords; theme swaps fonts + colors.
            </Text>
            <div className="overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-800">
                <FsSlide slide={CANONICAL_SLIDE} theme={fsDefaultTheme} />
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
                <div>
                    <Text size="xs" className="mb-1 !font-mono !text-zinc-500">theme=&quot;default&quot;</Text>
                    <div className="overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-800">
                        <FsSlide slide={CANONICAL_SLIDE} theme={fsDefaultTheme} width={420} />
                    </div>
                </div>
                <div>
                    <Text size="xs" className="mb-1 !font-mono !text-zinc-500">theme=&quot;dark&quot;</Text>
                    <div className="overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-800">
                        <FsSlide slide={CANONICAL_SLIDE} theme={fsDarkTheme} width={420} />
                    </div>
                </div>
            </div>
            <div className="flex flex-wrap gap-3">
                <div className="overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-800">
                    <FsSlide slide={CANONICAL_SLIDE} theme={fsDefaultTheme} width={240} />
                </div>
                <div className="overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-800">
                    <FsSlide slide={CANONICAL_SLIDE} theme={fsDefaultTheme} width={160} />
                </div>
                <div className="overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-800">
                    <FsSlide slide={CANONICAL_SLIDE} theme={fsDefaultTheme} width={100} />
                </div>
            </div>
        </div>
    );
}

function FsSlideViewerRegistryDemo() {
    const [fullscreen, setFullscreen] = useState(false);
    return (
        <div className="space-y-3">
            <Text size="sm" className="!text-zinc-600 dark:!text-zinc-300">
                Read-only deck player. Same {CANONICAL_DECK.slides.length}-slide deck as the package tile, mounted full-size. Click into the viewer below, then try ←/→ / Space / Home / End / 1-{CANONICAL_DECK.slides.length} / B / F / Esc.
            </Text>
            <Button color="violet" size="sm" icon="play" onClick={() => setFullscreen(true)}>
                Open fullscreen
            </Button>
            <div className="overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-800">
                <div className="h-[420px] w-full bg-black">
                    <FsSlideViewer deck={CANONICAL_DECK} />
                </div>
            </div>
            {fullscreen && (
                <div className="fixed inset-0 z-50 bg-black">
                    <FsSlideViewer deck={CANONICAL_DECK} onExit={() => setFullscreen(false)} />
                </div>
            )}
        </div>
    );
}

function FsPresenterViewRegistryDemo() {
    const [popout, setPopout] = useState(false);
    return (
        <div className="space-y-3">
            <Text size="sm" className="!text-zinc-600 dark:!text-zinc-300">
                Speaker-only second-monitor view of the same canonical deck. Current slide + next slide preview + speaker notes + wall clock + elapsed timer.
            </Text>
            <Button color="violet" size="sm" icon="presentation" onClick={() => setPopout(true)}>
                Pop out
            </Button>
            <div className="overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-800">
                <div className="h-[520px] w-full">
                    <FsPresenterView deck={CANONICAL_DECK} />
                </div>
            </div>
            {popout && (
                <div className="fixed inset-0 z-50 bg-black">
                    <FsPresenterView deck={CANONICAL_DECK} onExit={() => setPopout(false)} />
                </div>
            )}
        </div>
    );
}

function FsDeckEditorRegistryDemo() {
    // Real, live editor. Same canonical deck as the rest of the showcase —
    // edit the slide, drag elements, add new ones from the toolbar, reorder
    // in the rail. Mutations are op-based; the local state below is the
    // canonical "consumer owns the deck" pattern.
    const [deck, setDeck] = useState<FsDeck>(CANONICAL_DECK);
    const [opCount, setOpCount] = useState(0);
    const [presenting, setPresenting] = useState(false);

    return (
        <div className="space-y-3">
            <div className="rounded-md border border-zinc-200 bg-zinc-50/70 px-3 py-2.5 text-[12px] leading-relaxed dark:border-zinc-800 dark:bg-zinc-900/40">
                <p className="text-zinc-600 dark:text-zinc-300">
                    <span className="mr-1.5 inline-block rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">Out of the box</span>
                    Toolbar, slide rail, canvas, inspector, and speaker notes — drag elements, edit text inline, reorder slides, add elements, and ▶ Present to launch the SlideViewer fullscreen. Every edit flows through the same <code className="rounded bg-zinc-100 px-1 font-mono text-[11px] dark:bg-zinc-800">DeckOp</code> enum the agent bridge speaks, so humans and agents drive identical ops.
                </p>
                <p className="mt-1.5 text-zinc-600 dark:text-zinc-300">
                    <span className="mr-1.5 inline-block rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">Demo only</span>
                    The seeded deck and the PPTX-export toolbar button (wired to this sandbox).
                </p>
            </div>
            <div className="flex items-center gap-2 text-xs">
                <Badge color="violet">{deck.slides.length} slides</Badge>
                <Badge color="zinc">{opCount} ops applied</Badge>
                <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                        setDeck(CANONICAL_DECK);
                        setOpCount(0);
                    }}
                >
                    Reset
                </Button>
            </div>
            <div className="h-[640px] overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-800">
                <FsDeckEditor
                    value={deck}
                    onChange={setDeck}
                    onOp={() => setOpCount((n) => n + 1)}
                    onPresent={() => setPresenting(true)}
                    toolbarExtra={<PptxExportControl deck={deck as unknown as { title?: string } & Record<string, unknown>} />}
                />
            </div>
            {presenting && (
                <div className="fixed inset-0 z-50 bg-black">
                    <FsSlideViewer deck={deck} onExit={() => setPresenting(false)} />
                </div>
            )}
            <Explainer
                summary="DeckEditor is controlled (value + onChange). The host owns the deck; the editor renders a view and dispatches ops. Since 0.6.0 it renders every element type — text / image / shape / chart / code / table / embed — out of the box; pass your own `renderElement` only to override."
                code={'import { DeckEditor, defaultTheme } from "@particle-academy/fancy-slides";\nimport "@particle-academy/fancy-slides/styles.css";\n\nconst [deck, setDeck] = useState({\n  id: "doc-1",\n  title: "My deck",\n  theme: defaultTheme,\n  slides: [/* … */],\n});\n\n// Full editor out of the box — chart/code/table/embed render by default.\n<DeckEditor value={deck} onChange={setDeck} onOp={(op) => activityLog.push(op)} />'}
                bullets={[
                    "Compose your own layout by importing SlideRail / EditorToolbar / ElementInspector / SpeakerNotes individually.",
                    "Agent-bridgeable — the same DeckOp stream powers human + agent mutations.",
                    "Hide any panel via hideRail / hideToolbar / hideInspector / hideNotes for embedded contexts.",
                ]}
            />
        </div>
    );
}

function FsTextElementRegistryDemo() {
    return (
        <div className="space-y-3">
            <Text size="sm" className="!text-zinc-600 dark:!text-zinc-300">
                Text elements render through react-fancy&apos;s ContentRenderer in markdown mode — `## headings`, **bold**, *italic*, and bulleted lists. The tile shows this exact slide; the detail page shows it at full size plus a `plain` variant.
            </Text>
            <div className="grid gap-4 lg:grid-cols-2">
                <div>
                    <Text size="xs" className="mb-1 !font-mono !text-zinc-500">format=&quot;markdown&quot;</Text>
                    <div className="overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-800">
                        <FsSlide slide={CANONICAL_TEXT_SLIDE} theme={fsDefaultTheme} />
                    </div>
                </div>
                <div>
                    <Text size="xs" className="mb-1 !font-mono !text-zinc-500">format=&quot;plain&quot;</Text>
                    <div className="overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-800">
                        <FsSlide
                            slide={{
                                id: "plain",
                                elements: [{
                                    id: "t", type: "text",
                                    x: 0.06, y: 0.2, w: 0.88, h: 0.6,
                                    content: "A simple line of text — newlines preserved.\nNo markdown.",
                                    format: "plain",
                                    style: { fontSize: 28, align: "center", verticalAlign: "middle" },
                                }],
                                background: { color: "#ffffff" },
                            }}
                            theme={fsDefaultTheme}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

function FsImageElementRegistryDemo() {
    const fits: Array<{
        fit: "contain" | "cover" | "fill" | "scale-down";
        explainer: string;
    }> = [
        { fit: "contain", explainer: "Preserves source aspect; letterboxes top + bottom." },
        { fit: "cover", explainer: "Preserves source aspect; crops left + right to fill." },
        { fit: "fill", explainer: "Stretches to fill the box — distorts the image." },
        { fit: "scale-down", explainer: "Same as contain when source is larger than the box." },
    ];
    return (
        <div className="space-y-3">
            <Text size="sm" className="!text-zinc-600 dark:!text-zinc-300">
                Image elements use object-fit. The source below is a wide 1400×900 screenshot of react-fancy; each box is intentionally tall + narrow so the four fit modes show dramatically different results.
            </Text>
            <div className="grid gap-3 sm:grid-cols-2">
                {fits.map(({ fit, explainer }) => (
                    <div key={fit}>
                        <div className="mb-1 flex items-baseline gap-2">
                            <Text size="xs" className="!font-mono !text-zinc-500">fit=&quot;{fit}&quot;</Text>
                            <Text size="xs" className="!text-zinc-400">{explainer}</Text>
                        </div>
                        <div className="overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-800">
                            <FsSlide
                                slide={{
                                    id: `img-${fit}`,
                                    elements: [{
                                        id: "img",
                                        type: "image",
                                        ...CANONICAL_IMAGE_BOX,
                                        src: CANONICAL_IMAGE_SRC,
                                        fit,
                                    }],
                                    background: { color: "#f8fafc" },
                                }}
                                theme={fsDefaultTheme}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function FsShapeElementRegistryDemo() {
    const kinds: Array<"rect" | "rounded-rect" | "ellipse" | "triangle" | "line" | "arrow"> = [
        "rect", "rounded-rect", "ellipse", "triangle", "line", "arrow",
    ];
    return (
        <div className="space-y-4">
            <Text size="sm" className="!text-zinc-600 dark:!text-zinc-300">
                The package tile shows three shapes wired as an input → process → output composition. Below: the canonical composition at full size, then every supported shape kind in its own slide.
            </Text>
            <div className="overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-800">
                <FsSlide slide={CANONICAL_SHAPES_SLIDE} theme={fsDefaultTheme} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {kinds.map((kind) => (
                    <div key={kind}>
                        <Text size="xs" className="mb-1 !font-mono !text-zinc-500">shape=&quot;{kind}&quot;</Text>
                        <div className="overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-800">
                            <FsSlide
                                slide={{
                                    id: `shape-${kind}`,
                                    elements: [{
                                        id: "s", type: "shape", shape: kind,
                                        x: 0.15, y: 0.15, w: 0.7, h: 0.7,
                                        fill: kind === "line" ? "none" : "rgba(139,92,246,0.18)",
                                        stroke: "#8B5CF6",
                                        strokeWidth: 2,
                                    }],
                                    background: { color: "#ffffff" },
                                }}
                                theme={fsDefaultTheme}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── dark-slide (PHP) ──────────────────────────────────────────────────────

function DarkSlideAgentRegistryDemo() {
    return (
        <Explainer
            kind="php"
            language="php"
            summary={'Top-level static surface for the PPTX writer. Same Agent::write call the package tile illustrates — single class with validate / write / toBytes / read / describe / validateAndRepair / jsonSchema. Framework-agnostic; optional Laravel facade.'}
            code={'<?php\n\nuse DarkSlide\\Agent;\n\n$deck = [\n  \'id\' => \'' + CANONICAL_DECK.id + '\',\n  \'title\' => \'' + CANONICAL_DECK.title + '\',\n  \'theme\' => [\'name\' => \'default\'],\n  \'slides\' => [/* ' + CANONICAL_DECK.slides.length + ' slides matching the canonical Deck */],\n];\n\n$result = Agent::write($deck, storage_path(\'app/' + CANONICAL_DECK.id + '.pptx\'));\n// => [\'path\' => \'…\', \'bytes\' => 6291, \'slides\' => ' + CANONICAL_DECK.slides.length + ']\n\n// Round-trip back to JSON:\n$back = Agent::read(storage_path(\'app/' + CANONICAL_DECK.id + '.pptx\'));\n\n// Plain-text summary for an agent:\necho Agent::describe($deck);\n\n// LLM tool registration:\n$schema = Agent::jsonSchema();'}
            bullets={[
                "Zero third-party deps. ext-zip + ext-dom only.",
                "validateAndRepair() returns recoverable feedback for LLM tool loops.",
                "Round-trip safe for v0.2+ features: tables, gradients, embedded images, inline markdown spans.",
            ]}
        />
    );
}

function DarkSlidePptxWriterRegistryDemo() {
    return (
        <div className="space-y-3">
            <Text size="sm" className="!text-zinc-600 dark:!text-zinc-300">
                Office Open XML writer. Produces a real .pptx that opens cleanly in PowerPoint / Keynote / Google Slides / LibreOffice Impress. Coverage matrix matches the tile.
            </Text>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                {PPTX_WRITER_COVERAGE.map((c) => (
                    <div
                        key={c.label}
                        className={`rounded border px-2 py-3 text-center ${
                            c.check
                                ? "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200"
                                : "border-zinc-200 bg-zinc-50 text-zinc-400 dark:border-zinc-700 dark:bg-zinc-900"
                        }`}
                    >
                        <div className="font-mono text-xs">{c.label}</div>
                        <div className="text-base font-semibold">{c.check ? "✓" : c.note ?? "—"}</div>
                    </div>
                ))}
            </div>
            <Explainer
                summary={'Element types map to drawingML shapes: text → <p:sp>+<p:txBody>, image → <p:pic>+blipFill, shape → <p:sp>+<a:prstGeom>, table → <p:graphicFrame>+<a:tbl>, code → colored runs inside a dark-filled <p:sp>.'}
                code={'use DarkSlide\\Writer\\PptxWriter;\n\n$writer = new PptxWriter();\n\n$bytes = $writer->toBytes($deck);\n// or:\n$writer->write($deck, $path);  // writes to disk + returns size'}
                bullets={[
                    "Coords convert from 0..1 fractions to PPTX EMU (914,400 per inch).",
                    "Themes drive theme1.xml (font scheme + color scheme).",
                    "Speaker notes ship as ppt/notesSlides/notesSlideN.xml.",
                    "v0.3 ships markdown headings + syntax-highlighted code (JS/TS, PHP, JSON, bash, CSS, Python, HTML).",
                ]}
            />
        </div>
    );
}

function DarkSlidePptxReaderRegistryDemo() {
    return (
        <div className="space-y-3">
            <Text size="sm" className="!text-zinc-600 dark:!text-zinc-300">
                PPTX → Deck schema extractor. Agent-emitted decks round-trip with high fidelity; hand-authored PowerPoint files drop styling the schema can&apos;t represent. The tile&apos;s &quot;deck.pptx → Deck JSON&quot; flow expands here.
            </Text>
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-md border border-zinc-200 p-4 text-sm dark:border-zinc-800">
                <div className="rounded border border-zinc-200 bg-zinc-50 p-3 text-center font-mono dark:border-zinc-700 dark:bg-zinc-900">
                    deck.pptx
                </div>
                <span className="text-zinc-400">→</span>
                <div className="rounded border border-violet-300 bg-violet-50 p-3 text-center font-mono text-violet-700 dark:border-violet-700 dark:bg-violet-500/15 dark:text-violet-200">
                    Deck JSON
                </div>
            </div>
            <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {PPTX_READER_ROUNDTRIP.map((line) => (
                    <li key={line} className="flex items-start gap-2 rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900 dark:border-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-100">
                        <span>✓</span>
                        <span className="font-mono">{line}</span>
                    </li>
                ))}
            </ul>
            <Explainer
                summary={'fromBytes() lets you read uploaded PPTX bytes directly without a temp file. read() is the convenience for path-based reads.'}
                code={'use DarkSlide\\Reader\\PptxReader;\n\n$reader = new PptxReader();\n\n$deck = $reader->read($path);\n// or:\n$deck = $reader->fromBytes($bytes);\n\n// $deck shape matches the writer\'s input exactly:\n// [ \'id\', \'title\', \'theme\', \'slides\' => […] ]'}
            />
        </div>
    );
}

function DarkSlideSyntaxHighlighterRegistryDemo() {
    return (
        <div className="space-y-3">
            <Text size="sm" className="!text-zinc-600 dark:!text-zinc-300">
                Pure-PHP code tokenizer used by the writer to ship per-token colored `&lt;a:r&gt;` runs inside code blocks. The package tile shows this exact code; the detail page shows the tokenized result the writer would emit.
            </Text>
            <pre className="overflow-x-auto rounded-md bg-zinc-950 p-4 font-mono text-sm leading-relaxed">
                <code>
                    {CANONICAL_HIGHLIGHTED_TOKENS.map((tok, i) => (
                        <span key={i} className={HIGHLIGHT_KIND_COLOR[tok.kind] ?? "text-slate-100"}>
                            {tok.text}
                        </span>
                    ))}
                </code>
            </pre>
            <div className="flex flex-wrap gap-2 text-xs">
                {Object.entries(HIGHLIGHT_KIND_COLOR).map(([kind, cls]) => (
                    <span key={kind} className="rounded border border-zinc-200 bg-white px-2 py-0.5 dark:border-zinc-700 dark:bg-zinc-900">
                        <span className={cls + " font-mono"}>{kind}</span>
                    </span>
                ))}
            </div>
            <Explainer
                summary={'tokenize($code, $language) returns [{ text, kind }, …]. colorFor($kind) returns a 6-digit hex string to drop into <a:srgbClr val="…"/>.'}
                code={'use DarkSlide\\Helpers\\SyntaxHighlighter;\n\n$tokens = SyntaxHighlighter::tokenize(\n    "' + CANONICAL_HIGHLIGHTED_CODE.replace(/\n/g, '\\n').replace(/"/g, '\\"') + '",\n    "typescript",\n);\n\n// $tokens contains one entry per token:\n//   [\'text\' => \'const\', \'kind\' => \'keyword\'],\n//   [\'text\' => \' greet \', \'kind\' => \'plain\'],\n//   …\n\n// Map kind → hex for drawingML:\n$hex = SyntaxHighlighter::colorFor(\'keyword\');\n// => \'C084FC\''}
                bullets={[
                    "Languages: javascript, typescript, jsx, tsx, php, json, bash, css, python, html.",
                    "Kinds: keyword / string / comment / number / builtin / punctuation / plain.",
                    "Palette is tuned for the writer's dark code-block fill (#0F172A).",
                ]}
            />
        </div>
    );
}

// ─── fancy-mlm-ui ────────────────────────────────────────────────────────────
// The referral-engine surfaces. One flat member list carries BOTH parent
// pointers (sponsorId = who enrolled you, placementId = where you sit after
// spillover), so flipping the `edge` prop re-shapes the SAME network — the
// package's whole point.

const MLM_TIER_BADGE: Record<string, "orange" | "zinc" | "amber" | "violet"> = {
    bronze: "orange",
    silver: "zinc",
    gold: "amber",
    diamond: "violet",
};
const mlmTierColor = (t?: string) => (t && MLM_TIER_BADGE[t]) || "slate";

const MLM_DEMO_MEMBERS: MlmMember[] = [
    { id: "you", label: "You", tier: "gold" },
    { id: "ada", sponsorId: "you", placementId: "you", label: "Ada", tier: "gold" },
    { id: "bo", sponsorId: "you", placementId: "you", label: "Bo", tier: "silver" },
    { id: "cy", sponsorId: "you", placementId: "ada", label: "Cy", tier: "silver" },
    { id: "di", sponsorId: "you", placementId: "bo", label: "Di", tier: "bronze" },
    { id: "eve", sponsorId: "you", placementId: "ada", label: "Eve", tier: "bronze", active: false },
    { id: "fin", sponsorId: "ada", placementId: "cy", label: "Fin", tier: "silver" },
    { id: "gus", sponsorId: "cy", placementId: "di", label: "Gus", tier: "diamond" },
];

function MlmDownlineTreeDemo() {
    const [edge, setEdge] = useState<MlmEdge>("sponsor");
    const [selected, setSelected] = useState<string | null>("ada");
    const member = MLM_DEMO_MEMBERS.find((m) => m.id === selected);
    return (
        <DemoNote
            outOfBox="DownlineTree is fully controlled: a flat, JSON-friendly member list in, a collapsible genealogy out. The edge prop picks which parent pointer draws the tree — sponsor (unilevel: everyone you enrolled is a direct leg) or placement (binary / matrix: where members landed after spillover) — so ONE list renders every downline shape. Selection is controlled (selectedId + onSelect), tiers render as Badges via tierColor, inactive members dim, and every row carries a stable data-mlm-node handle an agent reads instead of scraping."
            demo="The edge toggle and the selection readout are demo scaffolding — watch the same eight members re-shape when you flip the tree."
        >
            <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                    <Button size="sm" color="teal" active={edge === "sponsor"} onClick={() => setEdge("sponsor")}>
                        Sponsor tree (unilevel)
                    </Button>
                    <Button size="sm" color="teal" active={edge === "placement"} onClick={() => setEdge("placement")}>
                        Placement tree (binary / matrix)
                    </Button>
                </div>
                <div className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
                    <MlmDownlineTree
                        value={MLM_DEMO_MEMBERS}
                        rootId="you"
                        edge={edge}
                        selectedId={selected}
                        onSelect={(id) => setSelected(id)}
                        tierColor={mlmTierColor}
                    />
                </div>
                <div className="text-[12px] text-zinc-500 dark:text-zinc-400">
                    Selected:{" "}
                    {member ? (
                        <>
                            <span className="font-medium text-zinc-800 dark:text-zinc-200">{member.label}</span>
                            {" · "}
                            <Badge color={mlmTierColor(member.tier)} variant="soft">{member.tier}</Badge>
                            {member.active === false && " · inactive (compressed by the engine)"}
                        </>
                    ) : (
                        "none"
                    )}
                </div>
            </div>
        </DemoNote>
    );
}

const MLM_DEMO_ROWS: MlmCommissionRow[] = [
    { id: "r1", level: 1, tier: "gold", amount: 150, status: "paid", recipientLabel: "Referral bonus (level 1)" },
    { id: "r2", level: 2, tier: "silver", amount: 62.5, status: "paid", recipientLabel: "Referral bonus (level 2)" },
    { id: "r3", level: 3, tier: "bronze", amount: 25, status: "pending", recipientLabel: "Referral bonus (level 3)" },
    { id: "r4", level: 1, tier: "gold", amount: 90, status: "reversed", recipientLabel: "Clawback — refunded order" },
];

function MlmCommissionStatementDemo() {
    const [rows, setRows] = useState<MlmCommissionRow[]>(MLM_DEMO_ROWS);
    const simulate = () =>
        setRows((r) => [
            {
                id: "sim-" + (r.length + 1),
                level: (r.length % 3) + 1,
                tier: ["gold", "silver", "bronze"][r.length % 3],
                amount: [150, 62.5, 25][r.length % 3],
                status: "paid",
                recipientLabel: "Referral bonus (level " + ((r.length % 3) + 1) + ")",
            },
            ...r,
        ]);
    return (
        <DemoNote
            outOfBox="CommissionStatement is a controlled earnings ledger — typically the engine's RewardComputation list. Each row renders level, recipient, tier, amount, and status; reversed rows strike through and drop out of the paid total, which the component folds automatically. Rows carry stable data-mlm-commission-row handles."
            demo="The Simulate activity button prepends a deterministic demo row — in the real showcase (/referrals) the same rows come from the live fun-lab referral loop."
        >
            <div className="space-y-3">
                <Button size="sm" color="teal" onClick={simulate}>Simulate downline activity</Button>
                <MlmCommissionStatement rows={rows} formatAmount={(n) => Math.round(n).toLocaleString() + " pts"} />
            </div>
        </DemoNote>
    );
}

function MlmRankProgressDemo() {
    const [team, setTeam] = useState(7);
    const target = 12;
    const atTop = team >= target;
    return (
        <DemoNote
            outOfBox="RankProgress shows the current tier and a progress bar toward the next tier's qualification threshold — value vs target in any unit (team size, volume, active legs). At or past the target it flips to the Top tier presentation. The bar exposes a stable data-mlm-rank-pct handle."
            demo="The +/- buttons drive the controlled value; tier thresholds here mirror the sandbox referral program (diamond at 12 team members)."
        >
            <div className="space-y-3">
                <div className="flex items-center gap-2">
                    <Button size="sm" variant="circle" onClick={() => setTeam((t) => Math.max(0, t - 1))}>−</Button>
                    <span className="min-w-24 text-center text-[13px] text-zinc-600 dark:text-zinc-300">{team} team members</span>
                    <Button size="sm" variant="circle" onClick={() => setTeam((t) => Math.min(target, t + 1))}>+</Button>
                </div>
                <div className="max-w-md">
                    <MlmRankProgress
                        tier={atTop ? "diamond" : "gold"}
                        nextTier={atTop ? null : "diamond"}
                        value={team}
                        target={atTop ? null : target}
                        unit="team members"
                    />
                </div>
            </div>
        </DemoNote>
    );
}

// ─── fancy-x-files-ui ────────────────────────────────────────────────────────
// Every editor is controlled (model in, onChange out) and pairs with the
// XFilePreview that renders the REAL on-disk text — so each demo is the
// package's own intended layout: edit left, what-ships right.

const XF_DEMO_ROBOTS: XfRobotsModel = {
    groups: [{ userAgents: ["*"], allow: ["/"], disallow: ["/api"] }],
    sitemaps: ["https://acme.dev/sitemap.xml"],
    protectedPaths: ["/admin"],
};
const XF_DEMO_SECURITY: XfSecurityTxtModel = {
    contact: ["mailto:security@acme.dev"],
    expires: "2027-01-01T00:00:00Z",
    policy: "https://acme.dev/security-policy",
};
const XF_DEMO_LLMS: XfLlmsTxtModel = {
    title: "Acme Docs",
    summary: "Everything an LLM needs to use Acme well.",
    sections: [
        { name: "Guides", links: [{ title: "Quickstart", url: "https://acme.dev/quickstart" }] },
        { name: "Reference", links: [{ title: "HTTP API", url: "https://acme.dev/api", notes: "OpenAPI 3.1" }] },
    ],
};
const XF_DEMO_HUMANS: XfHumansTxtModel = {
    team: [
        { role: "Developer", name: "Ada Lovelace", contact: "@ada" },
        { role: "Design", name: "Bo Chen" },
    ],
    site: "Standards: HTML5, Tailwind v4. Components: Fancy UI.",
    thanks: ["react-fancy"],
};
const XF_DEMO_SITEMAP: XfSitemapModel = {
    urls: [
        { loc: "https://acme.dev/", changefreq: "daily", priority: 1.0 },
        { loc: "https://acme.dev/pricing", changefreq: "weekly", priority: 0.8 },
        { loc: "https://acme.dev/about", changefreq: "monthly" },
    ],
};
const XF_DEMO_AGENTS: XfAgentsModel = {
    agents: [
        { id: "claude", name: "Claude", policy: "allow", url: "https://claude.ai", scope: "read + summarize docs" },
        { id: "scraper-9000", policy: "deny" },
    ],
    contact: "mailto:ops@acme.dev",
};

/** Editor left, the real rendered file right — the package's intended layout. */
function XfPair({ kind, model, children }: { kind: XfKind; model: unknown; children: ReactNode }) {
    return (
        <div className="grid gap-4 lg:grid-cols-2">
            <div>{children}</div>
            <XfFilePreview kind={kind} model={model} />
        </div>
    );
}

function XfRobotsEditorDemo() {
    const [model, setModel] = useState<XfRobotsModel>(XF_DEMO_ROBOTS);
    return (
        <DemoNote
            outOfBox="RobotsEditor is a controlled robots.txt rule builder: per-group User-agent / Allow / Disallow / Crawl-delay, sitemap URLs, and the protect() safety rail — protected paths are pinned Disallow for EVERY group, rendered as red chips, and can never be Allowed (validateRobots flags any leak inline). The paired XFilePreview shows the byte-for-byte robots.txt that ships."
            demo="The two-panel layout is the demo; both panels are stock components sharing one controlled model."
        >
            <XfPair kind="robots" model={model}>
                <XfRobotsEditor value={model} onChange={setModel} />
            </XfPair>
        </DemoNote>
    );
}

function XfSecurityTxtEditorDemo() {
    const [model, setModel] = useState<XfSecurityTxtModel>(XF_DEMO_SECURITY);
    return (
        <DemoNote
            outOfBox="SecurityTxtEditor edits an RFC 9116 security.txt: Contact (one or more mailto:/https: URIs, required) and a must-be-future Expires, plus the optional Encryption / Acknowledgments / Canonical / Policy / Hiring fields. validateSecurityTxt surfaces violations inline; the preview is the exact file for /.well-known/security.txt."
            demo="Two stock panels over one controlled model — clear the Contact field to watch validation fire."
        >
            <XfPair kind="securityTxt" model={model}>
                <XfSecurityTxtEditor value={model} onChange={setModel} />
            </XfPair>
        </DemoNote>
    );
}

function XfLlmsTxtEditorDemo() {
    const [model, setModel] = useState<XfLlmsTxtModel>(XF_DEMO_LLMS);
    return (
        <DemoNote
            outOfBox="LlmsTxtEditor edits the llms.txt Markdown index — title, blockquote summary, free-form details, and repeatable link sections — so agents and LLMs get a curated map of your site. The preview renders the exact Markdown document that ships."
            demo="Two stock panels over one controlled model; add a section to see the Markdown grow."
        >
            <XfPair kind="llmsTxt" model={model}>
                <XfLlmsTxtEditor value={model} onChange={setModel} />
            </XfPair>
        </DemoNote>
    );
}

function XfHumansTxtEditorDemo() {
    const [model, setModel] = useState<XfHumansTxtModel>(XF_DEMO_HUMANS);
    return (
        <DemoNote
            outOfBox="HumansTxtEditor edits the humans.txt colophon — team credits (role / name / contact), a Site section, and thanks. Small file, zero mystery: the preview is exactly what ships at /humans.txt."
            demo="Two stock panels over one controlled model."
        >
            <XfPair kind="humansTxt" model={model}>
                <XfHumansTxtEditor value={model} onChange={setModel} />
            </XfPair>
        </DemoNote>
    );
}

function XfSitemapEditorDemo() {
    const [model, setModel] = useState<XfSitemapModel>(XF_DEMO_SITEMAP);
    return (
        <DemoNote
            outOfBox="SitemapEditor edits a flat sitemap.xml URL set — loc / lastmod / changefreq / priority per entry, with validateSitemap catching malformed locs and out-of-range priorities. The preview renders the exact XML document."
            demo="Two stock panels over one controlled model."
        >
            <XfPair kind="sitemap" model={model}>
                <XfSitemapEditor value={model} onChange={setModel} />
            </XfPair>
        </DemoNote>
    );
}

function XfAgentsEditorDemo() {
    const [model, setModel] = useState<XfAgentsModel>(XF_DEMO_AGENTS);
    return (
        <DemoNote
            outOfBox="AgentsEditor edits the /AGENTS register — a machine-readable allow/deny policy per agent (id, name, homepage, permitted scope), the robots.txt idea extended to acting agents rather than crawlers. The preview shows the JSON register that ships."
            demo="Two stock panels over one controlled model."
        >
            <XfPair kind="agents" model={model}>
                <XfAgentsEditor value={model} onChange={setModel} />
            </XfPair>
        </DemoNote>
    );
}

function XfFilePreviewDemo() {
    const kinds: { kind: XfKind; label: string; model: unknown }[] = [
        { kind: "robots", label: "robots.txt", model: XF_DEMO_ROBOTS },
        { kind: "securityTxt", label: "security.txt", model: XF_DEMO_SECURITY },
        { kind: "sitemap", label: "sitemap.xml", model: XF_DEMO_SITEMAP },
        { kind: "agents", label: "AGENTS", model: XF_DEMO_AGENTS },
    ];
    return (
        <DemoNote
            outOfBox="XFilePreview renders the REAL text/XML a well-known file becomes on disk, using the same render logic as the fancy-x-files PHP / Node packages — what you see is what ships. Pass any kind + its model; the filename header comes from X_FILE_META."
            demo="The kind tabs are demo scaffolding around one stock XFilePreview."
        >
            <Tabs defaultTab="robots">
                <Tabs.List>
                    {kinds.map((k) => (
                        <Tabs.Tab key={k.kind} value={k.kind}>{k.label}</Tabs.Tab>
                    ))}
                </Tabs.List>
                <Tabs.Panels>
                    {kinds.map((k) => (
                        <Tabs.Panel key={k.kind} value={k.kind}>
                            <div className="pt-3"><XfFilePreview kind={k.kind} model={k.model} /></div>
                        </Tabs.Panel>
                    ))}
                </Tabs.Panels>
            </Tabs>
        </DemoNote>
    );
}

function XfFilesManagerDemo() {
    const [model, setModel] = useState<XfFilesModel>({
        robots: XF_DEMO_ROBOTS,
        sitemap: XF_DEMO_SITEMAP,
        agents: XF_DEMO_AGENTS,
    });
    return (
        <DemoNote
            outOfBox="XFilesManager is the compound surface: one tab per well-known file, each wiring its editor beside its live preview over a single aggregate model (value + onChange). Absent kinds offer an Add affordance; kinds/activeKind props restrict and control the tabs. This is the exact surface the sandbox admin uses at /admin/well-known-files."
            demo="Seeded with three of the six kinds so the Add flow is visible on the rest."
        >
            <XfFilesManager value={model} onChange={setModel} defaultKind="robots" />
        </DemoNote>
    );
}

// ─── fancy-cms-ui ────────────────────────────────────────────────────────────
// One canonical Stages PageDoc (hero + stats band, see showcase-fixtures)
// drives all three demos: the Editor mutates it through the op spine, CmsPage
// renders it (with $bind data fields), CmsRegion extracts one subtree.

function CmsEditorDemo() {
    const [doc, setDoc] = useState<PageDoc>(CMS_DEMO_DOC);
    const [edits, setEdits] = useState(0);
    // Stable identity: the Editor re-notifies when the onChange PROP changes,
    // so an inline closure here would loop (notify → setState → new closure).
    const handleChange = useCallback((next: PageDoc) => {
        setDoc(next);
        setEdits((n) => n + 1);
    }, []);
    return (
        <DemoNote
            outOfBox="Editor is the full three-pane WYSIWYG over a Stages PageDoc — a layers tree (click to select, drag to reorder/reparent), a live canvas that renders the real page and overlays selection with drag-to-move, and a contextual inspector — plus an Undo/Redo toolbar. Uncontrolled-with-notify: pass defaultValue, and every mutation from any pane is ONE PageOp through the pure reduce() spine, surfaced via onChange as the next document. No stylesheet import — the doc's own compiled CSS is injected."
            demo="The height-capped frame and the readout below are demo scaffolding — the readout prints what onChange hands back (seq + node count), showing each drag or inspector edit land as a single reduced op. Select a node in the layers panel or on the canvas, drag it, tweak a style, then Undo."
        >
            <div className="space-y-3">
                <div className="overflow-hidden" style={{ height: 480 }}>
                    <CmsEditor defaultValue={CMS_DEMO_DOC} onChange={handleChange} />
                </div>
                <div className="text-[12px] text-zinc-500 dark:text-zinc-400">
                    onChange fired:{" "}
                    <span className="font-medium text-zinc-800 dark:text-zinc-200">{edits}×</span>
                    {" · "}doc seq:{" "}
                    <span className="font-medium text-zinc-800 dark:text-zinc-200">{doc.seq}</span>
                    {" · "}nodes:{" "}
                    <span className="font-medium text-zinc-800 dark:text-zinc-200">{Object.keys(doc.nodes).length}</span>
                    {edits === 0 && " — select a node, drag it on the canvas, or edit a style in the inspector"}
                </div>
            </div>
        </DemoNote>
    );
}

function CmsPageDemo() {
    const payloads = [
        { label: "data = launch context", data: CMS_DATA_LAUNCH },
        { label: "data = studio context", data: CMS_DATA_STUDIO },
    ];
    return (
        <DemoNote
            outOfBox='CmsPage renders a published PageDoc: sections in order, every node through the element registry (heading / text / button / image / stack / grid / …), with the compiled document CSS injected as <style data-cms-styles> — a deterministic emitter the particle-academy/fancy-cms PHP renderer mirrors byte-for-byte. Any node prop may be a { $bind: "path" } binding resolved against the data context (repeaters render a template node per bound array item).'
            demo="Both panels render the SAME document — the hero's heading / copy / button props are $bind bindings, and only the data payload (shown under each panel) differs. Swap the data, the bound nodes re-render; the doc never changes."
        >
            <div className="grid gap-4 lg:grid-cols-2">
                {payloads.map((p) => (
                    <div key={p.label} className="space-y-2">
                        <div className="font-mono text-[11px] text-zinc-500 dark:text-zinc-400">{p.label}</div>
                        <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
                            <CmsPage doc={CMS_BOUND_DOC} data={p.data} />
                        </div>
                        <pre className="overflow-x-auto rounded-md bg-zinc-50 p-2 font-mono text-[10px] leading-relaxed text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300">
                            {JSON.stringify(p.data, null, 2)}
                        </pre>
                    </div>
                ))}
            </div>
        </DemoNote>
    );
}

function CmsRegionDemo() {
    const [root, setRoot] = useState<string>(CMS_HERO_ID);
    return (
        <DemoNote
            outOfBox="CmsRegion renders ONE subtree of a PageDoc — pass root (any node id) and it renders that node and its descendants through the same registry, with the same injected styles, as CmsPage. That's the per-surface embed: a CMS-managed hero on a hand-coded screen, a promo band inside an app view — each subtree individually addressable by stable node id."
            demo="Left is the whole document via CmsPage; right is CmsRegion extracting a single section from it. The root buttons swap which subtree renders — same doc, no re-authoring."
        >
            <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                    <Button size="sm" color="sky" active={root === CMS_HERO_ID} onClick={() => setRoot(CMS_HERO_ID)}>
                        root=&quot;{CMS_HERO_ID}&quot;
                    </Button>
                    <Button size="sm" color="sky" active={root === CMS_STATS_ID} onClick={() => setRoot(CMS_STATS_ID)}>
                        root=&quot;{CMS_STATS_ID}&quot;
                    </Button>
                </div>
                <div className="grid gap-4 lg:grid-cols-2">
                    <div className="space-y-2">
                        <div className="font-mono text-[11px] text-zinc-500 dark:text-zinc-400">&lt;CmsPage doc /&gt; — the full document</div>
                        <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
                            <CmsPage doc={CMS_DEMO_DOC} />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="font-mono text-[11px] text-zinc-500 dark:text-zinc-400">&lt;CmsRegion doc root=&quot;{root}&quot; /&gt; — one subtree</div>
                        <div className="overflow-hidden rounded-lg border-2 border-sky-400/70">
                            <CmsRegion doc={CMS_DEMO_DOC} root={root} />
                        </div>
                    </div>
                </div>
            </div>
        </DemoNote>
    );
}

// ─── The remaining component families ──────────────────────────────────────
//
// Everything below had a tile preview and a dashed "isn't wired yet" box on its
// own detail page. The tile proves a component renders; the detail page is where
// someone decides whether to adopt it, so these lean on the interactive half —
// answer a question, take a test, review an agent's proposal — rather than
// re-rendering the thumbnail at four times the size.

// ── @particle-academy/classroom ────────────────────────────────────────────

function CurriculumOverviewDemo() {
    return (
        <div className="max-w-2xl">
            <CurriculumOverview curriculum={CR_CURRICULUM} />
        </div>
    );
}

function LessonViewDemo() {
    return (
        <div className="max-w-2xl">
            <LessonView lesson={CR_LESSON} />
        </div>
    );
}

function QuestionRendererDemo() {
    const [value, setValue] = useState<AnswerValue | null>(null);
    return (
        <DemoNote
            outOfBox="The control is chosen from the question's own type — the same component renders multiple choice, free text and the rest."
            demo="One seeded question, and the answer readout below."
        >
            <div className="max-w-xl space-y-3">
                <QuestionRenderer question={CR_QUESTION} value={value} onChange={setValue} />
                <Text size="sm" className="!text-zinc-500">
                    answer: <code className="font-mono">{JSON.stringify(value)}</code> — controlled,
                    so an agent can read or set it.
                </Text>
            </div>
        </DemoNote>
    );
}

function TestRunnerDemo() {
    const [submitted, setSubmitted] = useState(false);
    return (
        <DemoNote
            outOfBox="Question sequencing, per-question state, and the submit lifecycle."
            demo="The seeded test, and a stubbed submit that resolves to a fixed attempt instead of calling a backend."
        >
            <div className="max-w-2xl space-y-2">
                <TestRunner
                    test={CR_TEST}
                    onSubmit={async () => {
                        setSubmitted(true);
                        return CR_ATTEMPT;
                    }}
                />
                {submitted && (
                    <Text size="sm" className="!text-emerald-600">Attempt submitted — the stub returned a graded result.</Text>
                )}
            </div>
        </DemoNote>
    );
}

function CoursePlayerDemo() {
    const [done, setDone] = useState<Set<number>>(new Set());
    return (
        <DemoNote
            outOfBox="The lesson rail, the player surface and the completion state."
            demo="A seeded course. Completion is local state and the attempt handlers are stubs — no backend."
        >
            <div className="h-[26rem] max-w-3xl overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-800">
                <CoursePlayer
                    course={CR_COURSE}
                    enrollment={CR_ENROLLMENT}
                    completedLessonIds={done}
                    onMarkLessonComplete={(lesson) => setDone((prev) => new Set(prev).add(lesson.id))}
                    onStartAttempt={async () => CR_ATTEMPT}
                    onSubmitAttempt={async () => CR_ATTEMPT}
                />
            </div>
        </DemoNote>
    );
}

function CertificateViewDemo() {
    return (
        <div className="max-w-xl">
            <CertificateView
                certificate={{
                    id: 1,
                    enrollment_id: 1,
                    verification_code: "FANCY-2026-0001",
                    issued_at: "2026-08-11T00:00:00Z",
                    pdf_path: null,
                    metadata: { recipient_name: "Ada Lovelace", course_title: "Human+ UX Foundations" },
                }}
                // Required: the host resolves where the PDF lives. This demo
                // mints no certificate, so the link points at the verification
                // route rather than a file that does not exist.
                pdfUrl="/verify/FANCY-2026-0001"
            />
        </div>
    );
}

// ── @particle-academy/job-board ────────────────────────────────────────────

function JobDetailDemo() {
    return (
        <div className="max-w-2xl">
            <JobDetail posting={JB_POSTING} />
        </div>
    );
}

function EmployerJobListDemo() {
    return (
        <div className="max-w-2xl">
            <EmployerJobList postings={[JB_POSTING]} />
        </div>
    );
}

function ApplicationListDemo() {
    return (
        <div className="max-w-2xl">
            <ApplicationList applications={[JB_APPLICATION]} />
        </div>
    );
}

function ApplyFormDemo() {
    const [sent, setSent] = useState(false);
    return (
        <DemoNote
            outOfBox="The form, its validation and the submit shape."
            demo="Submitting reports back here instead of posting anywhere."
        >
            <div className="max-w-2xl space-y-2">
                <ApplyForm posting={JB_POSTING} onSubmit={() => setSent(true)} />
                {sent && <Text size="sm" className="!text-emerald-600">Application submitted.</Text>}
            </div>
        </DemoNote>
    );
}

function JobPostingFormDemo() {
    const [saved, setSaved] = useState<string | null>(null);
    return (
        <DemoNote
            outOfBox="The authoring form an employer fills in."
            demo="Submitting shows the title back rather than saving it."
        >
            <div className="max-w-2xl space-y-2">
                <JobPostingForm onSubmit={(posting: { title?: string }) => setSaved(posting?.title ?? "(untitled)")} />
                {saved && <Text size="sm" className="!text-emerald-600">Saved: {saved}</Text>}
            </div>
        </DemoNote>
    );
}

// ── @particle-academy/teachers-aid-ui ──────────────────────────────────────

function ChatTranscriptDemo() {
    return (
        <div className="h-80 max-w-2xl overflow-auto rounded-md border border-zinc-200 p-2 dark:border-zinc-800">
            <ChatTranscript history={TA_HISTORY} agentName="Teacher's Aid" />
        </div>
    );
}

function MessageComposerDemo() {
    const [sent, setSent] = useState<string[]>([]);
    return (
        <DemoNote
            outOfBox="The composer and its send affordance."
            demo="Messages land in the list below instead of going to a model."
        >
            <div className="max-w-2xl space-y-3">
                <MessageComposer agentName="Teacher's Aid" onSend={(m: string) => setSent((s) => [...s, m])} />
                {sent.length > 0 && (
                    <ul className="space-y-1 text-sm text-zinc-500">
                        {sent.map((m, i) => <li key={i}>→ {m}</li>)}
                    </ul>
                )}
            </div>
        </DemoNote>
    );
}

function PlanReviewDemo() {
    const [outcome, setOutcome] = useState<string | null>(null);
    return (
        <DemoNote
            outOfBox="The trust-but-verify surface: an agent PROPOSES a change set and a human applies or discards it. Nothing is written until someone says so."
            demo="One seeded plan, and the outcome readout."
        >
            <div className="max-w-2xl space-y-2">
                <PlanReview
                    plan={TA_PLAN}
                    onApply={() => setOutcome("applied")}
                    onDiscard={() => setOutcome("discarded")}
                />
                {outcome && <Text size="sm" className="!text-zinc-500">Plan {outcome}.</Text>}
            </div>
        </DemoNote>
    );
}

function TeachersAidChatDemo() {
    return (
        <DemoNote
            outOfBox="Transcript, composer and plan review composed into one surface."
            demo="Seeded history; send / apply / discard are stubs."
        >
            <div className="h-96 max-w-2xl overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-800">
                <TeachersAidChat
                    agentName="Teacher's Aid"
                    history={TA_HISTORY}
                    onSend={() => {}}
                    onApply={() => {}}
                    onDiscard={() => {}}
                />
            </div>
        </DemoNote>
    );
}

// ── @particle-academy/fancy-passkeys-ui ────────────────────────────────────

function PasskeyStatusDemo() {
    const [supported, setSupported] = useState(true);
    const [platform, setPlatform] = useState(true);
    const [conditional, setConditional] = useState(false);
    return (
        <DemoNote
            outOfBox="The capability readout — what this browser can actually do before you offer a passkey flow."
            demo="The three toggles. In a real app these come from the browser, not from you."
        >
            <div className="max-w-md space-y-3">
                <div className="flex flex-wrap gap-4 text-xs text-zinc-500">
                    {([
                        ["supported", supported, setSupported],
                        ["platform authenticator", platform, setPlatform],
                        ["conditional UI", conditional, setConditional],
                    ] as const).map(([label, val, set]) => (
                        <label key={label} className="flex items-center gap-2">
                            <input type="checkbox" checked={val} onChange={(e) => set(e.target.checked)} />
                            {label}
                        </label>
                    ))}
                </div>
                <PasskeyStatus supported={supported} platformAuthenticator={platform} conditionalUi={conditional} />
            </div>
        </DemoNote>
    );
}

// ── @particle-academy/fancy-pwa ────────────────────────────────────────────

function PwaBannersDemo() {
    return (
        <DemoNote
            outOfBox="Both banners. They are the entire VISIBLE surface of fancy-pwa — the rest is hooks and a Vite plugin, which no demo can show."
            demo="Rendered unconditionally. In an app each appears only when its condition holds."
        >
            <div className="max-w-md space-y-3">
                <OfflineBanner color="amber">You are offline — changes will sync when you reconnect.</OfflineBanner>
                <InstallBanner title="Install Fancy UI for offline access." />
            </div>
        </DemoNote>
    );
}

// ── @particle-academy/fancy-motion ─────────────────────────────────────────

function MotionStageDemo() {
    return (
        <DemoNote
            outOfBox="The stage, and the keyframe interpolation driving anything with a `data-motion` handle."
            demo="A two-keyframe timeline and one card to move."
        >
            <div className="relative h-64 max-w-2xl overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-800">
                <MotionStage timeline={PREVIEW_TIMELINE}>
                    <div
                        data-motion="card"
                        className="absolute left-8 top-8 rounded-lg bg-violet-500 px-4 py-3 text-sm font-medium text-white shadow-lg"
                    >
                        Scroll the stage
                    </div>
                </MotionStage>
            </div>
        </DemoNote>
    );
}

function TimelineDockDemo() {
    const [timeline, setTimeline] = useState<TimelineDoc>(PREVIEW_TIMELINE);
    const [progress, setProgress] = useState(0.45);
    return (
        <DemoNote
            outOfBox="The keyframe track, its scrubber and the controlled document."
            demo="The starting timeline and the progress slider."
        >
            <div className="max-w-2xl space-y-3">
                <TimelineDock value={timeline} onChange={setTimeline} progress={progress} />
                <label className="flex items-center gap-3 text-xs text-zinc-500">
                    progress
                    <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.01}
                        value={progress}
                        onChange={(e) => setProgress(Number(e.target.value))}
                        className="flex-1"
                    />
                    <code className="font-mono">{progress.toFixed(2)}</code>
                </label>
            </div>
        </DemoNote>
    );
}

// ── @particle-academy/fancy-code ───────────────────────────────────────────

function FileViewerDemo() {
    const [lineNumbers, setLineNumbers] = useState(true);
    return (
        <DemoNote
            outOfBox="Language detection from the filename, syntax highlighting and the gutter."
            demo="One sample file and the gutter toggle."
        >
            <div className="max-w-2xl space-y-3">
                <label className="flex items-center gap-2 text-xs text-zinc-500">
                    <input type="checkbox" checked={lineNumbers} onChange={(e) => setLineNumbers(e.target.checked)} />
                    line numbers
                </label>
                <div className="h-72 overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-800">
                    <FileViewer filename="Button.tsx" value={SAMPLE_TSX} readOnly lineNumbers={lineNumbers} />
                </div>
            </div>
        </DemoNote>
    );
}

// ── @particle-academy/fancy-passkeys-ui ────────────────────────────────────
//
// Both surfaces are fully CONTROLLED and, by design, complete no ceremony here.
// A passkey needs a gesture plus a biometric, which is precisely the thing only
// the human at the keyboard can supply — the package's MCP bridge is
// management-only for the same reason. So these demos drive the real state
// machine with stubbed handlers rather than pretending to authenticate.

function PasskeyManagerDemo() {
    const [state, setState] = useState<PasskeyManagerState>({
        passkeys: [
            {
                id: "pk_1",
                name: "MacBook Touch ID",
                createdAt: "2026-06-02T10:11:00Z",
                lastUsedAt: "2026-08-10T21:04:00Z",
                transports: ["internal", "hybrid"],
                backedUp: true,
                aaguid: "adce0002-35bc-c60a-648b-0b25f1f05503",
                clonedAt: null,
            },
            {
                id: "pk_2",
                name: "YubiKey 5C",
                createdAt: "2026-03-19T08:40:00Z",
                lastUsedAt: null,
                transports: ["usb", "nfc"],
                backedUp: false,
                aaguid: "cb69481e-8ff7-4039-93ec-0a2729a154a8",
                clonedAt: null,
            },
        ],
        pendingRevoke: null,
        renamingId: null,
        draftName: "",
        status: "idle",
        error: null,
    });

    return (
        <DemoNote
            outOfBox="The list, rename, the staged revoke (propose → confirm) and every status transition."
            demo="Two seeded passkeys. Rename and revoke resolve locally; enrolling opens nothing, because a real ceremony needs a gesture this page cannot fake."
        >
            <div className="max-w-2xl">
                <PasskeyManager
                    value={state}
                    onChange={setState}
                    onRename={async ({ id, name }) =>
                        setState((s) => ({
                            ...s,
                            passkeys: s.passkeys.map((p) => (p.id === id ? { ...p, name } : p)),
                            renamingId: null,
                        }))
                    }
                    onRevoke={async ({ id }) =>
                        setState((s) => ({
                            ...s,
                            passkeys: s.passkeys.filter((p) => p.id !== id),
                            pendingRevoke: null,
                        }))
                    }
                    pendingMode
                />
            </div>
        </DemoNote>
    );
}

function PasskeySignInDemo() {
    const [state, setState] = useState<PasskeySignInState>({ status: "idle", email: "", error: null });
    return (
        <DemoNote
            outOfBox="The sign-in surface, its email + discoverable modes, and the status machine."
            demo="`onAuthenticate` resolves after a short delay instead of running a WebAuthn ceremony — a real one needs a gesture and a biometric."
        >
            <div className="max-w-md">
                <PasskeySignIn
                    value={state}
                    onChange={setState}
                    onAuthenticate={async () => {
                        await new Promise((r) => setTimeout(r, 600));
                        setState((s) => ({ ...s, status: "success" }));
                    }}
                />
            </div>
        </DemoNote>
    );
}

// ── @particle-academy/fancy-echarts (the two specialised charts) ────────────

const ECHART_3D_OPTION = {
    grid3D: { viewControl: { autoRotate: true, autoRotateSpeed: 8 } },
    xAxis3D: { type: "value" },
    yAxis3D: { type: "value" },
    zAxis3D: { type: "value" },
    series: [
        {
            type: "surface",
            shading: "color",
            equation: {
                x: { step: 0.05, min: -3, max: 3 },
                y: { step: 0.05, min: -3, max: 3 },
                z: (x: number, y: number) => Math.sin(x * x + y * y) / (x * x + y * y),
            },
            itemStyle: { color: "#8b5cf6" },
        },
    ],
} as EChartsOption;

function EChart3DDemo() {
    return (
        <DemoNote
            outOfBox="The GL renderer, the rotating view control and the surface series."
            demo="The plotted equation."
        >
            <div className="h-80 max-w-2xl overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-800">
                <EChart3D option={ECHART_3D_OPTION} style={{ height: "100%", width: "100%" }} />
            </div>
        </DemoNote>
    );
}

function EChartGraphicDemo() {
    const [showCallout, setShowCallout] = useState(true);
    return (
        <DemoNote
            outOfBox="The annotation layer: graphic elements drawn over the chart, positioned in chart space."
            demo="The bar data and the toggle."
        >
            <div className="max-w-2xl space-y-3">
                <label className="flex items-center gap-2 text-xs text-zinc-500">
                    <input type="checkbox" checked={showCallout} onChange={(e) => setShowCallout(e.target.checked)} />
                    show the callout
                </label>
                <div className="h-72 overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-800">
                    <EChartGraphic
                        option={{
                            xAxis: { type: "category", data: ["Q1", "Q2", "Q3", "Q4"] },
                            yAxis: { type: "value", max: 60 },
                            series: [{ type: "bar", data: [24, 38, 31, 47], itemStyle: { color: "#8b5cf6" } }],
                        }}
                        elements={
                            showCallout
                                ? [
                                      {
                                          type: "text",
                                          x: "72%",
                                          y: 28,
                                          style: { text: "Best quarter", fill: "#a855f7", fontSize: 13, fontWeight: "bold" },
                                      },
                                  ]
                                : []
                        }
                        style={{ height: "100%", width: "100%" }}
                    />
                </div>
            </div>
        </DemoNote>
    );
}

// ── fancy-3d: the Scene document, and the two engine adapters ──────────────

/**
 * `Scene` is the JSON-friendly document every fancy-3d renderer consumes — the
 * engine-agnostic part of the package, and the reason an agent can compose a 3D
 * view without touching WebGL. The demo shows the document beside the render it
 * produces, because the document IS the component here.
 */
function SceneDemo() {
    const [spin, setSpin] = useState(true);
    const scene = {
        camera: { position: [0, 1.6, 4], target: [0, 0.5, 0] },
        lights: [{ type: "ambient", intensity: 0.6 }],
        objects: [
            { id: "box", type: "box", position: [-1, 0.5, 0], color: "#8b5cf6" },
            { id: "ball", type: "sphere", position: [1, 0.5, 0], color: "#10b981" },
        ],
    };
    return (
        <DemoNote
            outOfBox="The Scene type itself — plain JSON, no engine imported. Any fancy-3d renderer accepts it."
            demo="The two objects and the spin toggle."
        >
            <div className="grid max-w-3xl gap-3 md:grid-cols-2">
                <div className="h-64 overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-800">
                    <Canvas engine="dom" style={{ height: "100%" }}>
                        {scene.objects.map((o, i) => (
                            <Canvas.Node key={o.id} id={o.id} x={60 + i * 160} y={80}>
                                <div
                                    className="grid h-16 w-16 place-items-center rounded-lg text-xs font-medium text-white shadow-lg transition-transform"
                                    style={{ background: o.color, transform: spin ? "rotate(12deg)" : "none" }}
                                >
                                    {o.type}
                                </div>
                            </Canvas.Node>
                        ))}
                        <Canvas.Controls />
                    </Canvas>
                </div>
                <div className="space-y-2">
                    <label className="flex items-center gap-2 text-xs text-zinc-500">
                        <input type="checkbox" checked={spin} onChange={(e) => setSpin(e.target.checked)} />
                        tilt the objects
                    </label>
                    <pre className="max-h-52 overflow-auto rounded-md bg-zinc-950 p-3 font-mono text-[11px] leading-relaxed text-zinc-100">
                        {JSON.stringify(scene, null, 2)}
                    </pre>
                </div>
            </div>
        </DemoNote>
    );
}

// ── react-fancy/catalog-fms — the vendorable block ─────────────────────────

/**
 * `catalog-fms` is a BLOCK, not one component: PricingTable + FeatureMatrix +
 * FeatureGate + PlanFeaturesEditor, vendored together by
 * `npx fancy-cli add catalog-fms`. The demo shows the storefront half and the
 * gate side by side, because the pairing is the point — you sell a plan, then
 * you gate on it.
 */
function CatalogFmsDemo() {
    const [pro, setPro] = useState(false);
    return (
        <DemoNote
            outOfBox="The pricing table, the interval switch and the entitlement gate."
            demo="Two plans, and the toggle standing in for the viewer's entitlement."
        >
            <div className="space-y-5">
                <div className="max-w-2xl">
                    <PricingTable
                        plans={[
                            { id: "starter", name: "Starter", prices: [{ id: "p1", amount: 900, currency: "usd", interval: "month" }], highlights: ["1 seat", "Community support"] },
                            { id: "pro", name: "Pro", recommended: true, badge: "Most popular", prices: [{ id: "p2", amount: 2900, currency: "usd", interval: "month" }], highlights: ["5 seats", "Exports", "Priority support"] },
                        ]}
                        defaultInterval="month"
                    />
                </div>

                <label className="flex items-center gap-2 text-xs text-zinc-500">
                    <input type="checkbox" checked={pro} onChange={(e) => setPro(e.target.checked)} />
                    viewer is on Pro
                </label>

                <div className="max-w-md">
                    <FeatureGate
                        feature="exports"
                        featureName="Exports"
                        entitlements={{ planId: pro ? "pro" : "starter", features: { exports: { access: pro } } }}
                    >
                        <div className="rounded border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-200">
                            Export to xlsx, pptx or docx.
                        </div>
                    </FeatureGate>
                </div>
            </div>
        </DemoNote>
    );
}

// ── The engine adapters ────────────────────────────────────────────────────
//
// `/engine` is the headless half of each adapter: one object you hand to
// `<Canvas engine={…}>`. There is no component to render, so the demo shows the
// swap itself — same Scene, same JSX, a different renderer underneath. That IS
// the package's claim.

function EngineAdapterDemo({ engine, name }: { engine: CanvasEngineSpec; name: string }) {
    return (
        <DemoNote
            outOfBox={`The ${name} engine object. It is the whole export — pass it to <Canvas engine={…}> and the same scene renders through ${name}.`}
            demo="The two nodes and the edge between them."
        >
            <div className="h-72 max-w-2xl overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-800">
                <Canvas engine={engine} style={{ height: "100%" }}>
                    <Canvas.Node id="a" x={70} y={70} draggable>
                        <Card padding="sm"><Text size="sm">Node A</Text></Card>
                    </Canvas.Node>
                    <Canvas.Node id="b" x={300} y={160} draggable>
                        <Card padding="sm"><Text size="sm">Node B</Text></Card>
                    </Canvas.Node>
                    <Canvas.Edge from="a" to="b" curve="bezier" />
                    <Canvas.Controls />
                </Canvas>
            </div>
        </DemoNote>
    );
}

function BabylonEngineDemo() {
    return <EngineAdapterDemo engine={babylonEngine} name="Babylon" />;
}

function ThreeEngineDemo() {
    return <EngineAdapterDemo engine={threeEngine} name="three.js" />;
}

// ── catalog-fms, component by component ────────────────────────────────────
//
// These four are the block's parts. `CatalogFmsDemo` above shows them working
// together; these show each on its own, which is what someone lands on from the
// package grid.

const CFMS_PLANS = [
    { id: "starter", name: "Starter", prices: [{ id: "p1", amount: 900, currency: "usd", interval: "month" as const }], highlights: ["1 seat", "Community support"] },
    { id: "pro", name: "Pro", recommended: true, badge: "Most popular", prices: [{ id: "p2", amount: 2900, currency: "usd", interval: "month" as const }], highlights: ["5 seats", "Exports"] },
    { id: "team", name: "Team", prices: [{ id: "p3", amount: 9900, currency: "usd", interval: "month" as const }], highlights: ["25 seats", "SSO"] },
];

const CFMS_FEATURES = [
    { key: "seats", name: "Seats", type: "resource" as const, unit: "seats" },
    { key: "exports", name: "Exports", type: "boolean" as const },
    { key: "sso", name: "SSO", type: "boolean" as const },
];

function PricingTableDemo() {
    return (
        <div className="max-w-3xl">
            <PricingTable plans={CFMS_PLANS} defaultInterval="month" />
        </div>
    );
}

function FeatureMatrixDemo() {
    return (
        <div className="max-w-3xl overflow-x-auto">
            <FeatureMatrix plans={CFMS_PLANS} features={CFMS_FEATURES} />
        </div>
    );
}

function FeatureGateDemo() {
    const [access, setAccess] = useState(false);
    return (
        <DemoNote
            outOfBox="The gate: it renders its children only when the viewer's entitlement allows, and an upsell otherwise."
            demo="The toggle standing in for the entitlement your server would supply."
        >
            <div className="max-w-md space-y-3">
                <label className="flex items-center gap-2 text-xs text-zinc-500">
                    <input type="checkbox" checked={access} onChange={(e) => setAccess(e.target.checked)} />
                    viewer has the `exports` feature
                </label>
                <FeatureGate
                    feature="exports"
                    featureName="Exports"
                    entitlements={{ planId: access ? "pro" : "starter", features: { exports: { access } } }}
                >
                    <div className="rounded border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-200">
                        Export to xlsx, pptx or docx.
                    </div>
                </FeatureGate>
            </div>
        </DemoNote>
    );
}

function PlanFeaturesEditorDemo() {
    const [value, setValue] = useState<Record<string, PlanFeatureValue>>({
        seats: { type: "resource", enabled: true, limit: 5 },
        exports: { type: "boolean", enabled: true },
        sso: { type: "boolean", enabled: false },
    });
    return (
        <DemoNote
            outOfBox="The admin editor for what a plan includes — booleans, and resource caps where `null` means unlimited."
            demo="Three seeded features and the JSON readout."
        >
            <div className="max-w-xl space-y-3">
                <PlanFeaturesEditor features={CFMS_FEATURES} value={value} onChange={setValue} />
                <pre className="overflow-auto rounded bg-zinc-950 p-3 font-mono text-[11px] text-zinc-100">
                    {JSON.stringify(value, null, 2)}
                </pre>
            </div>
        </DemoNote>
    );
}
