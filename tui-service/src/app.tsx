import React, { useEffect, useMemo, useState } from "react";
import { useFocus, useFocusManager, useInput } from "ink";
import {
  Badge,
  Box,
  CodeView,
  FancyTuiProvider,
  KeyHint,
  Panel,
  Row,
  Separator,
  Spacer,
  Text,
  useFancyTui,
} from "@particle-academy/fancy-tui";
import { SHOWCASE_EXAMPLES, type ShowcaseExample } from "@particle-academy/fancy-tui/showcase";
import type { TuiTone } from "@particle-academy/fancy-tui";

/**
 * The Fancy TUI docs — the whole page as ONE live Ink app.
 *
 * There is no navigation model, no MCP, no per-preview session: the app is a
 * single persistent React tree that the service renders and streams. It holds
 * its own selection in `useState`, receives every keystroke through Ink's
 * `useInput`, and — because it is always mounted — every preview is LIVE. A
 * Spinner spins, an ActivityIndicator ticks, and an Input types, all without a
 * request/response round-trip.
 *
 * The design is dogfood: every pane is composed from the real fancy-tui
 * primitives (`Panel`, `Badge`, `KeyHint`, `Separator`, `CodeView`, …). Nothing
 * here hand-draws ANSI or does column math a component/Yoga already does.
 *
 *   ┌ brand bar ──────────────────────────────────────────────┐
 *   │ [F] Fancy TUI · 62 components · live in your terminal    │
 *   ├─ separator ─────────────────────────────────────────────┤
 *   │ Components         │ Badge                    [live]     │
 *   │  LAYOUT            │  LIVE                                │
 *   │  ▸ Hero           │  ┌────────────────────────────────┐  │
 *   │    Screen          │  │ passing  flaky  failed         │  │
 *   │  DISPLAY           │  └────────────────────────────────┘  │
 *   │    Spinner         │  SOURCE                              │
 *   │    …               │  ┌ 1 │ <Row gap="sm"> … ┐           │
 *   ├─ status bar (KeyHints) ─────────────────────────────────┤
 */

/** An action the browser performs; the app never performs it itself. */
export type AppEffect = { type: "quit" } | { type: "open"; url: string };

/** Ink focus id for the list pane. Focus sits here in "browse" mode; moving it
 *  into the preview is what makes keys drive the component. First-come, so the
 *  list — rendered before any preview control — claims focus on mount and the
 *  preview's own auto-focus never steals it. */
const LIST_FOCUS_ID = "docs:list";

/** Shown in the brand bar. Bumped with the installed fancy-tui. */
const FANCY_TUI_VERSION = "fancy-tui v0.8.0";

/** The showcase groups, in first-seen order — Layout / Content / … / Human+. */
export const GROUP_ORDER: string[] = [...new Set(SHOWCASE_EXAMPLES.map((e) => e.group))];

/** A colour accent per group, so the constellation reads at a glance. Cosmetic;
 *  there are more groups than distinct terminal colours, so Human+ reuses one. */
const GROUP_TONE: Record<string, TuiTone> = {
  Layout: "primary",
  Content: "info",
  Display: "success",
  Inputs: "warning",
  Navigation: "agent",
  Data: "danger",
  "Human+": "user",
};

type Kind = "interactive" | "live" | "scrollback" | "static";

/** Components that animate on their own timers (a Spinner interval). */
const ANIMATED = new Set(["spinner", "activity-indicator", "live-region", "tool-call"]);

const KIND_MARK: Record<Kind, string> = { interactive: "◆", live: "◉", scrollback: "≣", static: "·" };
const KIND_LABEL: Record<Kind, string> = { interactive: "interactive", live: "live", scrollback: "scrollback", static: "static" };
const KIND_TONE: Record<Kind, TuiTone> = { interactive: "agent", live: "success", scrollback: "warning", static: "neutral" };

function kindOf(example: ShowcaseExample): Kind {
  if (example.scrollback) return "scrollback";
  if (example.interactive) return "interactive";
  if (ANIMATED.has(example.slug)) return "live";
  return "static";
}

/**
 * The examples visible for a query — every showcase example, or those whose
 * name/slug matches the search. The app's list is EXACTLY this, so a test can
 * assert it against `SHOWCASE_EXAMPLES` directly.
 */
export function docExamples(search = ""): ShowcaseExample[] {
  const q = search.trim().toLowerCase();
  if (!q) return SHOWCASE_EXAMPLES;
  return SHOWCASE_EXAMPLES.filter(
    (e) => e.name.toLowerCase().includes(q) || e.slug.includes(q),
  );
}

/**
 * A window over the grouped list that keeps the selected row on screen and
 * never renders more rows than `height`.
 *
 * A group heading costs a row on top of its first item, so budgeting one row
 * per item under-counts and the list overflows its pane — and there is no
 * scrollback here to recover a row pushed off the top. The cost model prices a
 * group-opening item at 2 (heading + item) and every other at 1, then walks the
 * window start forward until the selection falls inside it.
 */
export function windowByGroup(
  items: ShowcaseExample[],
  selected: number,
  height: number,
): { start: number; end: number } {
  const opens = (i: number) => i === 0 || items[i]?.group !== items[i - 1]?.group;
  const cost = (i: number) => (opens(i) ? 2 : 1);
  const fits = (start: number) => {
    let used = 0;
    let end = start;
    while (end < items.length && used + cost(end) <= height) {
      used += cost(end);
      end++;
    }
    return Math.max(end, start + 1); // always show at least the start row
  };

  let start = 0;
  while (start < items.length && fits(start) <= selected) start++;
  return { start, end: fits(start) };
}

// ── brand bar ────────────────────────────────────────────────────────────────

function BrandBar({ count }: { count: number }) {
  const { width } = useFancyTui();
  const compact = width < 76;
  return (
    <Row>
      <Badge tone="primary">F</Badge>
      <Text tone="primary" bold> Fancy TUI</Text>
      {compact ? (
        <Text tone="muted"> · {count}</Text>
      ) : (
        <Text tone="muted"> · {count} components · live in your terminal</Text>
      )}
      <Spacer />
      <Text tone="muted" wrap="truncate">{FANCY_TUI_VERSION}</Text>
    </Row>
  );
}

function SearchLine({ search, typing, count }: { search: string; typing: boolean; count: number }) {
  return (
    <Row>
      <Text tone="primary">/ </Text>
      <Text wrap="truncate">{search}</Text>
      <Text tone="muted">{typing ? "▌" : ""}</Text>
      <Spacer />
      <Text tone="muted">{count} matches</Text>
    </Row>
  );
}

// ── list ─────────────────────────────────────────────────────────────────────

function ListPane({
  examples,
  selected,
  start,
  end,
  width,
  height,
  focused,
}: {
  examples: ShowcaseExample[];
  selected: number;
  start: number;
  end: number;
  width: number;
  height: number;
  focused: boolean;
}) {
  const slice = examples.slice(start, end);
  return (
    <Panel tone="neutral" focused={focused} width={width} height={height} overflow="hidden">
      <Box flexShrink={0} flexDirection="column">
        <Row>
          <Text tone="primary" bold>Components</Text>
          <Spacer />
          <Text tone="muted">{examples.length}</Text>
        </Row>
        {slice.map((example, i) => {
          const index = start + i;
          const active = index === selected;
          const opensGroup = index === 0 || examples[index - 1]?.group !== example.group;
          const kind = kindOf(example);
          return (
            <Box key={example.slug} flexDirection="column">
              {opensGroup ? (
                <Text tone={GROUP_TONE[example.group] ?? "neutral"} bold wrap="truncate">
                  {example.group.toUpperCase()}
                </Text>
              ) : null}
              <Row>
                <Text tone={active ? "primary" : "text"} bold={active} wrap="truncate">
                  {active ? "▸ " : "  "}
                  {example.name}
                </Text>
                <Spacer />
                <Text tone={KIND_TONE[kind]}>{KIND_MARK[kind]}</Text>
              </Row>
            </Box>
          );
        })}
      </Box>
    </Panel>
  );
}

// ── preview ──────────────────────────────────────────────────────────────────

/** Tallest a live example may claim before it is clipped — Hero/Modal are ~12. */
const LIVE_CAP = 14;

function PreviewPane({
  example,
  width,
  height,
  focused,
}: {
  example: ShowcaseExample | undefined;
  width: number;
  height: number;
  focused: boolean;
}) {
  // Panel spends 2 rows on its border; the rest is the unshrinkable content
  // column. The column draws its own title so a height clamp can never squeeze
  // the title and the first content row onto the same terminal row.
  const inner = Math.max(3, height - 2);
  // Panel border (2) + paddingX (1 each side) = 4 columns of chrome.
  const innerWidth = Math.max(10, width - 4);
  // Rows left for [live + source] after title (1) + LIVE label (1) + SOURCE
  // label (1) + CodeView border (2) = 5.
  const avail = Math.max(2, inner - 5);
  const liveRows = Math.max(1, Math.min(LIVE_CAP, avail - 3));
  const codeLines = Math.max(1, avail - liveRows);
  const kind = example ? kindOf(example) : "static";

  // Truncate each source line so CodeView never WRAPS a long line into extra
  // rows and blows the fixed budget — the pane has no scrollback to spare.
  const sourceLines = (example?.source ?? "").split("\n");
  const maxLineWidth = Math.max(8, innerWidth - 10); // line-number gutter + border/padding
  const shown = sourceLines
    .slice(0, codeLines)
    .map((line) => (line.length > maxLineWidth ? `${line.slice(0, maxLineWidth - 1)}…` : line));
  if (sourceLines.length > codeLines && shown.length > 0) shown[shown.length - 1] = "…";
  const code = shown.join("\n");

  return (
    <Panel
      tone={focused ? "primary" : "success"}
      focused={focused}
      width={width}
      height={height}
      overflow="hidden"
    >
      <Box flexShrink={0} flexDirection="column">
        <Row>
          <Text tone={example ? GROUP_TONE[example.group] ?? "primary" : "primary"} bold wrap="truncate">
            {example?.name ?? "—"}
          </Text>
          <Spacer />
          <Badge tone={KIND_TONE[kind]}>{KIND_LABEL[kind]}</Badge>
        </Row>

        <Text tone="muted" bold>LIVE</Text>
        <Box width={innerWidth} maxHeight={liveRows} overflow="hidden" flexDirection="column">
          <Box flexShrink={0} flexDirection="column">
            {example?.scrollback ? (
              // A `<Static>` example writes ABOVE the frame and outside the box
              // model — rendering it live would make the frame taller than the
              // terminal. Show the source, and say why the live view is withheld.
              <Text tone="warning" wrap="truncate">
                Writes to terminal scrollback (Ink Static) — shown as source.
              </Text>
            ) : example ? (
              <FancyTuiProvider width={innerWidth} height={liveRows}>{example.node}</FancyTuiProvider>
            ) : null}
          </Box>
        </Box>

        <Text tone="muted" bold>SOURCE</Text>
        <CodeView code={code} language="tsx" lineNumbers />
      </Box>
    </Panel>
  );
}

// ── footer ───────────────────────────────────────────────────────────────────

function Footer({ width, example }: { width: number; example: ShowcaseExample | undefined }) {
  const { theme } = useFancyTui();
  const compact = width < 76;
  const kind = example ? kindOf(example) : "static";
  return (
    <Box
      width={width}
      borderStyle="single"
      borderColor={theme.colors.border}
      paddingX={1}
      flexDirection="row"
    >
      <Row gap={compact ? 1 : 2}>
        <KeyHint keys="↑↓" label="browse" />
        <KeyHint keys="enter" label="interact" />
        <KeyHint keys="esc" label="back" />
        {compact ? null : <KeyHint keys="/" label="search" />}
        <KeyHint keys="q" label="quit" />
      </Row>
      <Spacer />
      {compact ? null : (
        <Text tone="muted" wrap="truncate">
          {example ? `${example.name} · ${kind}` : ""}
        </Text>
      )}
    </Box>
  );
}

// ── root ─────────────────────────────────────────────────────────────────────

export interface DocsAppProps {
  cols: number;
  rows: number;
  /** Slug to select on mount, for deep-links and tests. Ignored if unknown. */
  initialSlug?: string;
  /** Side-effect sink (quit / open a URL). The service forwards these to the
   *  browser; a one-shot render passes nothing. */
  onEffect?: (effect: AppEffect) => void;
}

const FOOTER_ROWS = 3;

export function DocsApp({ cols, rows, initialSlug, onEffect }: DocsAppProps) {
  const initialIndex = Math.max(0, SHOWCASE_EXAMPLES.findIndex((e) => e.slug === initialSlug));
  const [index, setIndex] = useState(initialIndex);
  const [search, setSearch] = useState("");
  const [searching, setSearching] = useState(false);
  // Which pane reads as focused. Drives ONLY the border; key routing follows
  // Ink's real focus (`listFocused`). Defaulting to browse means the very first
  // frame shows the list focused, without the flash you get from reading Ink's
  // focus before its mount effect has claimed it.
  const [divedIn, setDivedIn] = useState(false);

  const { focus, focusNext } = useFocusManager();
  // Ink's real focus on the list sink — the authority for KEY routing.
  const { isFocused: listFocused } = useFocus({ id: LIST_FOCUS_ID, autoFocus: true });

  // Claim focus for the list on mount, deterministically. `autoFocus` alone is
  // not enough: React runs child effects BEFORE the parent's, so a preview whose
  // control auto-focuses (an Input, an Accordion) registers first and would win
  // the initial claim — leaving the list unfocused and arrow keys dead until Tab.
  // This parent mount-effect runs last and takes focus back to the list.
  useEffect(() => {
    focus(LIST_FOCUS_ID);
  }, [focus]);

  // Whenever the sink regains Ink focus (Escape, or a Shift+Tab out of the
  // preview), we are browsing again — keep the border honest.
  useEffect(() => {
    if (listFocused) setDivedIn(false);
  }, [listFocused]);

  const examples = useMemo(() => docExamples(search), [search]);
  const selectedIndex = Math.min(index, Math.max(0, examples.length - 1));
  const selected = examples[selectedIndex];

  useInput((input, key) => {
    // Preview has focus: the component drives itself. The only key we still own
    // is Escape, which hands focus back to the list.
    if (!listFocused) {
      if (key.escape) {
        focus(LIST_FOCUS_ID);
        setDivedIn(false);
      }
      return;
    }

    // Search box: swallow text so typing "q" does not quit mid-query.
    if (searching) {
      if (key.escape) {
        setSearch("");
        setSearching(false);
        setIndex(0);
      } else if (key.return) {
        setSearching(false);
      } else if (key.upArrow) {
        setIndex((i) => Math.max(0, i - 1));
      } else if (key.downArrow) {
        setIndex((i) => Math.min(examples.length - 1, i + 1));
      } else if (key.backspace || key.delete) {
        setSearch((s) => s.slice(0, -1));
        setIndex(0);
      } else if (input && !key.ctrl && !key.meta) {
        setSearch((s) => s + input);
        setIndex(0);
      }
      return;
    }

    // Browse mode.
    if (key.upArrow || input === "k") {
      setIndex((i) => Math.max(0, i - 1));
    } else if (key.downArrow || input === "j") {
      setIndex((i) => Math.min(examples.length - 1, i + 1));
    } else if (key.return) {
      // Dive into an interactive component so keys drive it.
      if (selected?.interactive) {
        focusNext();
        setDivedIn(true);
      }
    } else if (key.tab) {
      // Ink's focus manager already advances focus into the preview on Tab; we
      // only mirror it into the border (no focusNext here — that would advance
      // focus twice).
      if (selected?.interactive) setDivedIn(true);
    } else if (input === "/") {
      setSearching(true);
      setSearch("");
      setIndex(0);
    } else if (input === "q" || key.escape) {
      onEffect?.({ type: "quit" });
    }
  });

  const showSearch = searching || search.length > 0;
  const searchRows = showSearch ? 1 : 0;
  // brand (1) + separator (1) + search + body + footer (3) = rows.
  const bodyRows = Math.max(6, rows - 2 - searchRows - FOOTER_ROWS);
  const listWidth = Math.max(22, Math.min(34, Math.floor(cols * 0.32)));
  const previewWidth = Math.max(20, cols - listWidth - 1);
  const { start, end } = windowByGroup(examples, selectedIndex, Math.max(2, bodyRows - 3));

  return (
    <FancyTuiProvider width={cols} height={rows}>
      <Box width={cols} height={rows} flexDirection="column" overflow="hidden">
        <BrandBar count={SHOWCASE_EXAMPLES.length} />
        <Separator />
        {showSearch ? <SearchLine search={search} typing={searching} count={examples.length} /> : null}
        <Row gap={1} flexGrow={1}>
          <ListPane
            examples={examples}
            selected={selectedIndex}
            start={start}
            end={end}
            width={listWidth}
            height={bodyRows}
            focused={!divedIn}
          />
          <PreviewPane example={selected} width={previewWidth} height={bodyRows} focused={divedIn} />
        </Row>
        <Footer width={cols} example={selected} />
      </Box>
    </FancyTuiProvider>
  );
}
