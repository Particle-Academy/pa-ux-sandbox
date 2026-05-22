// Components
export { Slide } from "./components/Slide";
export type { SlideProps } from "./components/Slide";

export { SlideViewer } from "./components/SlideViewer";
export type { SlideViewerProps } from "./components/SlideViewer";

export { TextElementRenderer } from "./components/elements/TextElement";
export type { TextElementRendererProps } from "./components/elements/TextElement";

export { ImageElementRenderer } from "./components/elements/ImageElement";
export type { ImageElementRendererProps } from "./components/elements/ImageElement";

export { ShapeElementRenderer } from "./components/elements/ShapeElement";
export type { ShapeElementRendererProps } from "./components/elements/ShapeElement";

// Hooks
export { useSlideKeyboard } from "./hooks/use-slide-keyboard";
export type { SlideKeyboardOptions } from "./hooks/use-slide-keyboard";

// Theme
export { defaultTheme, darkTheme, vividTheme, builtinThemes } from "./theme/default-theme";
export { defineTheme, resolveTheme } from "./theme/theme-utils";

// Utils
export { nextId, slideId, elementId, deckId } from "./utils/ids";

// Types
export type {
    // Core
    Deck,
    Slide as SlideData,
    SlideLayout,
    SlideElement,
    SlideBackground,
    SlideTransition,
    TransitionKind,
    // Elements
    ElementBase,
    TextElement,
    TextStyle,
    ImageElement,
    ChartElement,
    CodeElement,
    TableElement,
    ShapeElement,
    ShapeKind,
    EmbedElement,
    // Theme
    Theme,
    ThemeColors,
    ThemeFonts,
    // Agent / Human+
    DeckActivity,
    DeckOp,
} from "./types";
