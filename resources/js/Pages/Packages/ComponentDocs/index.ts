import type { ComponentDoc } from "./types";
import { accordionDoc } from "./Accordion";
import { accordionPanelDoc } from "./AccordionPanel";
import { actionDoc } from "./Action";
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
import { colorPickerDoc } from "./ColorPicker";
import { commandDoc } from "./Command";
import { composerDoc } from "./Composer";
import { contentRendererDoc } from "./ContentRenderer";
import { contextMenuDoc } from "./ContextMenu";
import { dropdownDoc } from "./Dropdown";
import { editorDoc } from "./Editor";
import { emojiDoc } from "./Emoji";
import { emojiSelectDoc } from "./EmojiSelect";
import { fileUploadDoc } from "./FileUpload";
import { headingDoc } from "./Heading";
import { iconDoc } from "./Icon";
import { inputTagDoc } from "./InputTag";
import { inputsDoc } from "./Inputs";
import { kanbanDoc } from "./Kanban";
import { magicWandDoc } from "./MagicWand";
import { menuDoc } from "./Menu";
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
import { separatorDoc } from "./Separator";
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
    "react-fancy/accordion": accordionDoc,
    "react-fancy/accordion-panel": accordionPanelDoc,
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
};

export function getComponentDoc(pkg: string, slug: string): ComponentDoc | null {
    return DOCS[`${pkg}/${slug}`] ?? null;
}

export type { ComponentDoc, ComponentDocExample, ComponentDocProp } from "./types";
