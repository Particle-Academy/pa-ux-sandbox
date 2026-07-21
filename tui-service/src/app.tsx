import React from "react";
import {
  FancyTuiProvider,
  Hero,
  Panel,
  Header,
  Text,
  Badge,
  KeyHint,
  Separator,
  Box,
  Stack,
  Row,
  Spacer,
} from "@particle-academy/fancy-tui";
import { findShowcaseExample, type ShowcaseExample } from "@particle-academy/fancy-tui/showcase";
import type { Catalogue, CatalogueComponent, Family } from "./catalogue.js";
import {
  visibleFamilies,
  selectedFamily,
  selectedComponent,
  type DocsState,
} from "./model.js";

/**
 * The docs TUI, as REAL fancy-tui components.
 *
 * Every pane is composed from the same primitives an app author would use —
 * `Hero`, `Panel`, `Badge`, `CodeView`. Nothing here hand-draws ANSI; Ink
 * renders it, which is the whole point of the rebuild. `<DocsApp>` is pure: it
 * takes a catalogue + state and returns a tree, and the server turns that tree
 * into a frame.
 *
 * That extends to the component previews: the detail pane renders fancy-tui's
 * exported showcase example INLINE, in this same Ink tree. It is the real
 * component, laid out by Yoga at the reader's actual terminal size — not a
 * picture of one taken at 68 columns. (`showcase/previews.json` is still read,
 * but only as a fallback for a component the installed fancy-tui captured and
 * has no live example for.)
 */

/**
 * An F, drawn with full blocks against empty cells.
 *
 * The old mark was `▟█▙` inside a box: three adjacent filled glyphs with no
 * internal gap, which at terminal font sizes merge into one grey rectangle and
 * read as a missing-glyph box rather than a logo. Contrast in a terminal comes
 * from empty cells, not from shading — so the negative space IS the design.
 */
const BRAND_MARK = ["█▀▀▀", "█▀▀ ", "█   "];
const ASCII_MARK = ["|===", "|== ", "|   "];

/** Accent for a theme, so the constellation reads at a glance. */
const THEME_TONE: Record<string, "primary" | "agent" | "success" | "warning" | "info" | "neutral"> = {
  terminal: "success",
  core: "primary",
  surfaces: "agent",
  documents: "info",
  commerce: "success",
  platform: "warning",
  tooling: "neutral",
};

/** Heading label for a theme; the hoisted preview group gets a plain-English one. */
const THEME_LABEL: Record<string, string> = {
  terminal: "LIVE IN TERMINAL",
};

function themeTone(group: string) {
  return THEME_TONE[group] ?? "neutral";
}

function themeLabel(group: string) {
  return THEME_LABEL[group] ?? group.toUpperCase();
}

/**
 * A full-width footer.
 *
 * fancy-tui's `StatusBar` hugs its content rather than spanning the screen, so
 * its left/right ends collide at these widths. This lays out left + right
 * across an explicit `width`, which is what a status line actually wants.
 */
function Footer({ left, right, width }: { left: React.ReactNode; right: React.ReactNode; width: number }) {
  return (
    <Box width={width} marginTop={1} borderStyle="single" borderColor="gray" paddingX={1}>
      {left}
      <Spacer />
      {right}
    </Box>
  );
}

/**
 * A vertical window around the selected index, so a long list never overflows
 * the terminal — the row the cursor is on is always shown, with context above
 * and below.
 */
function windowed<T>(items: T[], selected: number, height: number): { slice: T[]; start: number } {
  if (items.length <= height) return { slice: items, start: 0 };
  let start = selected - Math.floor(height / 2);
  start = Math.max(0, Math.min(start, items.length - height));
  return { slice: items.slice(start, start + height), start };
}

/**
 * Window a grouped list by RENDERED rows, not item count.
 *
 * A family costs one row, but the first family of a theme also draws a heading
 * and a blank line above it — three rows, not one. Budgeting one row per family
 * (as a plain `windowed` does) under-counts by two per theme, so with six themes
 * the list overflowed its box by a dozen rows and pushed the hero off the top of
 * the terminal. There is no scrollback to recover it from: the docs TUI repaints
 * a full screen every frame.
 */
function windowedGroups(
  families: Family[],
  selected: number,
  height: number,
): { slice: Family[]; start: number } {
  const opensGroup = (i: number) => i === 0 || families[i]!.group !== families[i - 1]!.group;
  const cost = (i: number) => (opensGroup(i) ? 3 : 1);
  // The first visible row skips the blank line above its heading — but only if
  // it HAS a heading. Discounting unconditionally made a window that starts
  // mid-group price its first family at zero rows, so the frame came out one
  // row taller than the terminal exactly when the selection was scrolled down.
  const costFrom = (start: number, i: number) =>
    i === start && opensGroup(i) ? 2 : cost(i);

  const fits = (start: number) => {
    let used = 0;
    let end = start;
    while (end < families.length && used + costFrom(start, end) <= height) {
      used += costFrom(start, end);
      end++;
    }
    return end;
  };

  // Walk the start forward until the selection is inside the window.
  let start = 0;
  while (start < families.length && fits(start) <= selected) start++;
  return { slice: families.slice(start, fits(start)), start };
}

/** The one glyph that answers "does this draw in a terminal?" at a glance. */
function PreviewMark({ component }: { component: CatalogueComponent }) {
  return component.previewable ? (
    <Text tone="success">◉ preview</Text>
  ) : (
    <Text tone="muted">○ web</Text>
  );
}

// ── home ─────────────────────────────────────────────────────────────────────

/** Rows the Hero occupies: border + padding + mark + title + tagline + hints. */
const HERO_ROWS = 12;
/** Rows a slim header occupies when the Hero will not fit. */
const SLIM_HEADER_ROWS = 2;
/** Below this width the companion column is dropped rather than squeezed. */
const TWO_COLUMN_MIN_COLS = 76;

function HomePane({ cat, state, cols, rows }: { cat: Catalogue; state: DocsState; cols: number; rows: number }) {
  const families = visibleFamilies(cat, state);

  // The Hero is the first thing to go when the terminal is short. Losing it is
  // better than letting it push the list off the top — which is what happens
  // when the budget lies, since there is no scrollback to recover from.
  const showHero = rows >= 28;
  const headerRows = showHero ? HERO_ROWS : SLIM_HEADER_ROWS;
  const searchRows = state.searching || state.search ? 2 : 0;
  // Chrome below the header: the blank line above the list, plus the footer's
  // own margin and its three bordered rows.
  const CHROME_ROWS = 5;
  const listHeight = Math.max(4, rows - headerRows - searchRows - CHROME_ROWS);

  const { slice, start } = windowedGroups(families, state.familyIndex, listHeight);

  // A single narrow column on a wide terminal wastes most of the screen, so the
  // selected family's contents fill the space beside it. Purely presentational
  // — it reads `state.familyIndex`, and navigation is unchanged.
  const twoColumn = cols >= TWO_COLUMN_MIN_COLS;
  const listWidth = twoColumn ? Math.max(28, Math.min(38, Math.floor(cols * 0.36))) : cols;
  const current = families[state.familyIndex];

  let lastTheme = start > 0 ? families[start - 1]?.group : undefined;

  return (
    <Stack gap={0}>
      {showHero ? (
        <Hero
          title="Fancy Docs"
          version={`${cat.total} components`}
          tagline="The Fancy UI registry, browsed from a terminal — over the real MCP."
          mark={BRAND_MARK}
          asciiMark={ASCII_MARK}
          hints={[
            { keys: "↑↓", label: "family" },
            { keys: "→", label: "open" },
            { keys: "/", label: "search" },
            { keys: "q", label: "quit" },
          ]}
        />
      ) : (
        <Row gap={1}>
          <Text tone="primary" bold>Fancy Docs</Text>
          <Text tone="muted">{cat.total} components</Text>
          <Spacer />
          <KeyHint keys="↑↓" label="family" />
          <KeyHint keys="→" label="open" />
          <KeyHint keys="/" label="search" />
          <KeyHint keys="q" label="quit" />
        </Row>
      )}

      {state.searching || state.search ? (
        <Box marginTop={1}>
          <Text tone="primary">/ </Text>
          <Text>{state.search}</Text>
          <Text tone="muted">{state.searching ? "▌" : ""}</Text>
          <Spacer />
          <Text tone="muted">{families.length} families</Text>
        </Box>
      ) : null}

      <Row gap={2} marginTop={1}>
        <Box width={listWidth} flexShrink={0} flexDirection="column">
          {slice.map((family, i) => {
            const index = start + i;
            const active = index === state.familyIndex;
            const showThemeHeading = family.group !== lastTheme;
            lastTheme = family.group;
            const previewable = family.components.filter((c) => c.previewable).length;

            return (
              <Box key={family.slug} flexDirection="column">
                {showThemeHeading ? (
                  <Box marginTop={index === start ? 0 : 1}>
                    <Text tone={themeTone(family.group)} bold>
                      {themeLabel(family.group)}
                    </Text>
                  </Box>
                ) : null}
                <Row gap={1}>
                  <Text tone={active ? "primary" : "text"} bold={active}>
                    {active ? "›" : " "} {family.name}
                  </Text>
                  <Text tone="muted">{family.components.length}</Text>
                  {previewable > 0 ? <Text tone="success">◉ {previewable}</Text> : null}
                </Row>
              </Box>
            );
          })}
        </Box>

        {twoColumn && current ? (
          <FamilyPeek family={current} height={listHeight} />
        ) : null}
      </Row>

      <Footer
        width={cols}
        left={<Text tone="muted">{`${cat.families.length} families · ${cat.previewableCount} previewable`}</Text>}
        right={<Text tone="muted">MCP · list-components</Text>}
      />
    </Stack>
  );
}

/**
 * What is inside the highlighted family, shown beside the list.
 *
 * The home screen was one ~30-column list on a terminal three times that wide,
 * so this fills the space with the thing you are about to open. It reads
 * `state.familyIndex` and nothing else — navigation is untouched, so `→` still
 * opens the family pane.
 */
function FamilyPeek({ family, height }: { family: Family; height: number }) {
  const previewable = family.components.filter((c) => c.previewable).length;
  // Name, counts, the blank line above the list, and the "… more" line — four
  // rows of chrome this column has to pay for out of the same budget the family
  // list gets, or it is the thing that overflows instead.
  const listRows = Math.max(1, height - 4);
  const shown = family.components.slice(0, listRows);
  const rest = family.components.length - shown.length;

  return (
    <Box flexGrow={1} flexDirection="column">
      <Text tone="primary" bold>{family.name}</Text>
      <Row gap={1}>
        <Text tone="muted">{family.components.length} components</Text>
        {previewable > 0 ? <Text tone="success">◉ {previewable} draw in a terminal</Text> : null}
      </Row>

      <Box marginTop={1} flexDirection="column">
        {shown.map((component) => (
          <Row key={component.name} gap={1}>
            <Text tone={component.previewable ? "success" : "muted"}>
              {component.previewable ? "◉" : "○"}
            </Text>
            <Text tone="text">{component.title ?? component.name}</Text>
          </Row>
        ))}
        {rest > 0 ? <Text tone="muted">  … {rest} more</Text> : null}
      </Box>
    </Box>
  );
}

// ── family ───────────────────────────────────────────────────────────────────

function FamilyPane({ cat, state, cols, rows }: { cat: Catalogue; state: DocsState; cols: number; rows: number }) {
  const family = selectedFamily(cat, state);
  if (!family) return <Text tone="muted">No family selected.</Text>;

  const listHeight = Math.max(4, rows - 8);
  const { slice, start } = windowed(family.components, state.componentIndex, listHeight);
  const previewable = family.components.filter((c) => c.previewable).length;

  return (
    <Stack gap={0}>
      <Header
        title={family.name}
        subtitle={family.group}
        status={
          <Row gap={1}>
            <Badge tone={themeTone(family.group)}>{family.group}</Badge>
            {previewable > 0 ? <Badge tone="success">{previewable} previewable</Badge> : null}
          </Row>
        }
      />
      <Separator />

      <Box flexDirection="column" marginTop={1}>
        {slice.map((component, i) => {
          const index = start + i;
          const active = index === state.componentIndex;
          return (
            <Row key={component.name} gap={1}>
              <Text tone={active ? "primary" : "text"} bold={active}>
                {active ? "›" : " "} {component.title || component.name}
              </Text>
              <Spacer />
              <Text tone="muted">{component.package}</Text>
              <PreviewMark component={component} />
            </Row>
          );
        })}
      </Box>

      <Footer
        width={cols}
        left={
          <Row gap={1}>
            <KeyHint keys="↑↓" label="select" />
            <KeyHint keys="→" label="detail" />
            <KeyHint keys="←" label="back" />
          </Row>
        }
        right={<Text tone="muted">{`${state.componentIndex + 1}/${family.components.length}`}</Text>}
      />
    </Stack>
  );
}

// ── detail ───────────────────────────────────────────────────────────────────

/**
 * Rows the detail pane spends on everything that is not the preview: the header
 * (1), the description block (marginTop + a clipped 2 rows), the blank line
 * above the preview, and the footer (marginTop + 3 bordered rows).
 *
 * Fixed on purpose. A description is arbitrary prose that wraps to an unknown
 * number of rows, so leaving it unbounded makes the preview's budget a guess —
 * and a frame taller than the terminal is unrecoverable here: this TUI repaints
 * a full screen and keeps no scrollback.
 */
const DETAIL_CHROME_ROWS = 9;
const DESCRIPTION_ROWS = 2;

function DetailPane({ cat, state, cols, rows }: { cat: Catalogue; state: DocsState; cols: number; rows: number }) {
  const component = selectedComponent(cat, state);
  if (!component) return <Text tone="muted">No component selected.</Text>;

  const found = component.previewSlug ? findShowcaseExample(component.previewSlug) : undefined;
  // An example that commits scrollback through Ink's `Static` (MessageList,
  // StaticList) paints ABOVE the frame and outside every box, so this pane
  // cannot clip it — it would land on top of the header and make the frame
  // taller than the terminal. Those fall back to their capture, which is a
  // picture and therefore clippable.
  const example = found?.scrollback ? undefined : found;
  const bodyHeight = Math.max(5, rows - DETAIL_CHROME_ROWS);

  // Claim the full terminal so the footer sits on the LAST row. A short preview
  // otherwise leaves the status line floating in the middle of the screen with
  // dead space beneath it, which reads as a half-drawn page rather than a pane.
  return (
    <Stack gap={0} height={rows}>
      <Header
        title={component.title || component.name}
        subtitle={component.package}
        status={<PreviewMark component={component} />}
      />
      <Box marginTop={1} height={DESCRIPTION_ROWS} overflow="hidden">
        <Text>{component.description}</Text>
      </Box>

      {example || component.previewFrame ? (
        <PreviewBody
          component={component}
          example={example}
          state={state}
          cols={cols}
          height={bodyHeight}
        />
      ) : (
        <Box marginTop={1} flexDirection="column">
          <Panel title="No terminal preview" tone="neutral">
            <Text tone="muted">
              {component.title || component.name} is a web / React component. It renders in a
              browser, not a terminal — so there is nothing to draw here.
            </Text>
            <Box marginTop={1}>
              <KeyHint keys="o" label="open its docs page" />
            </Box>
          </Panel>
        </Box>
      )}

      <Spacer />

      <Footer
        width={cols}
        left={
          <Row gap={1}>
            <KeyHint keys="↑↓" label="scroll" />
            <KeyHint keys="o" label="web docs" />
            <KeyHint keys="←" label="back" />
          </Row>
        }
        right={<Text tone="muted">{component.family}</Text>}
      />
    </Stack>
  );
}

/**
 * A component's preview: the LIVE component when fancy-tui exports an example
 * for it, otherwise the captured frame.
 *
 * Either way the whole block is a Panel with a `maxHeight` and `overflow`
 * hidden. A live example is arbitrary-height content composed for its own
 * layout — Hero is twelve rows, Modal draws inside a 68-column box — so
 * clipping is not a nicety: without it a tall component would push the footer,
 * and then the header, off a short terminal, with no scrollback to recover
 * them. `maxHeight` rather than `height` so a one-row component (a Badge row)
 * gets a panel that hugs it instead of thirty rows of empty box.
 *
 * The content sits in its own `flexShrink={0}` column INSIDE that panel, and
 * this is load-bearing: a height-constrained Yoga container squeezes its
 * children, and a squeezed Ink text node still writes all of its lines — from a
 * position that no longer matches. The frame comes back with rows painted on
 * top of each other ("LIVE PREVIEWble") rather than merely cut off. So the
 * inner column keeps its natural height and overflows; only the panel clips.
 */
function PreviewBody({
  component,
  example,
  state,
  cols,
  height,
}: {
  component: CatalogueComponent;
  example: ShowcaseExample | undefined;
  state: DocsState;
  cols: number;
  height: number;
}) {
  return (
    <Box marginTop={1} flexDirection="column">
      <Panel tone="success" width={cols} maxHeight={height} overflow="hidden">
        {/*
          The title is drawn INSIDE the unshrinkable column rather than passed
          as Panel's `title`, because a Panel title is a second flex child — and
          the constrained container squeezes whichever child can be squeezed,
          landing the title and the first content row on the same terminal row.
        */}
        <Box flexDirection="column" flexShrink={0}>
          <Text tone="success" bold>{`Preview — ${component.title || component.name}`}</Text>
          {example ? (
            <LivePreview example={example} state={state} cols={cols} height={height} />
          ) : (
            <CapturedPreview component={component} state={state} height={height} />
          )}
        </Box>
      </Panel>
    </Box>
  );
}

/** Rows a live example may claim before it is clipped — the tallest is 12. */
const LIVE_PREVIEW_MAX_ROWS = 14;

/**
 * The real component, rendered here, now.
 *
 * Two clamps make it safe to drop arbitrary content into a pane:
 *
 *  - a fixed-height `overflow: hidden` box, so a tall example is cut off rather
 *    than allowed to grow the frame past the terminal;
 *  - a nested `FancyTuiProvider` carrying the PANE's size, because components
 *    that measure the terminal (`Separator` rules to full width, `Hero` folds
 *    below 60, `Responsive` switches at a breakpoint) would otherwise size
 *    themselves to the whole screen and be clipped at the panel border.
 */
function LivePreview({
  example,
  state,
  cols,
  height,
}: {
  example: ShowcaseExample;
  state: DocsState;
  cols: number;
  height: number;
}) {
  // Panel spends 2 columns on its border and 2 on its horizontal padding.
  const innerWidth = Math.max(10, cols - 4);
  // …and 2 rows on its border plus 1 on its title.
  const contentRows = Math.max(3, height - 3);
  // The three label rows this block draws around the two sections.
  const previewRows = Math.max(3, Math.min(LIVE_PREVIEW_MAX_ROWS, contentRows - 4));
  const sourceRows = Math.max(1, contentRows - previewRows - 3);

  const sourceLines = example.source.split("\n");
  const start = Math.min(state.detailOffset, Math.max(0, sourceLines.length - sourceRows));
  const slice = sourceLines.slice(start, start + sourceRows);
  const more = start + sourceRows < sourceLines.length;

  return (
    <>
      <Text tone="muted" bold>LIVE PREVIEW</Text>
      <Box width={innerWidth} maxHeight={previewRows} overflow="hidden" flexDirection="column">
        <Box flexDirection="column" flexShrink={0}>
          <FancyTuiProvider width={innerWidth} height={previewRows}>
            {example.node}
          </FancyTuiProvider>
        </Box>
      </Box>
      <Text tone="muted" bold>SOURCE</Text>
      {slice.map((line, i) => (
        <Text key={i} tone="agent">{line}</Text>
      ))}
      {more ? <Text tone="muted">↓ more</Text> : null}
    </>
  );
}

/**
 * The captured frame, line by line — the fallback when the installed fancy-tui
 * has a capture for a component but no live example for it.
 *
 * These lines already carry their own ANSI colour, so they are printed as-is
 * rather than re-styled. Scrolls with the detail offset so a tall capture and
 * its source both stay reachable.
 */
function CapturedPreview({
  component,
  state,
  height,
}: {
  component: CatalogueComponent;
  state: DocsState;
  height: number;
}) {
  const frameLines = (component.previewFrame ?? "").split("\n");
  const sourceLines = (component.previewSource ?? "").split("\n");
  const body = [
    { kind: "label" as const, text: "CAPTURED PREVIEW" },
    ...frameLines.map((text) => ({ kind: "frame" as const, text })),
    { kind: "gap" as const, text: "" },
    { kind: "label" as const, text: "SOURCE" },
    ...sourceLines.map((text) => ({ kind: "source" as const, text })),
  ];

  const rows = Math.max(1, height - 4);
  const start = Math.min(state.detailOffset, Math.max(0, body.length - rows));
  const slice = body.slice(start, start + rows);
  const more = start + rows < body.length;

  return (
    <>
      {slice.map((line, i) => {
        if (line.kind === "label") return <Text key={i} tone="muted" bold>{line.text}</Text>;
        if (line.kind === "gap") return <Text key={i}> </Text>;
        if (line.kind === "source") return <Text key={i} tone="agent">{line.text}</Text>;
        // A pre-coloured frame line: print verbatim.
        return <Text key={i}>{line.text}</Text>;
      })}
      {more ? <Text tone="muted">↓ more</Text> : null}
    </>
  );
}

// ── root ─────────────────────────────────────────────────────────────────────

export function DocsApp({
  catalogue,
  state,
  cols,
  rows,
}: {
  catalogue: Catalogue;
  state: DocsState;
  cols: number;
  rows: number;
}) {
  const pane =
    state.pane === "home" ? (
      <HomePane cat={catalogue} state={state} cols={cols} rows={rows} />
    ) : state.pane === "family" ? (
      <FamilyPane cat={catalogue} state={state} cols={cols} rows={rows} />
    ) : (
      <DetailPane cat={catalogue} state={state} cols={cols} rows={rows} />
    );

  // Provider width MUST match the Ink stdout columns the renderer sets, or the
  // components' own width logic (Hero's compact fold, Separator) disagrees with
  // the flexbox layout.
  return (
    <FancyTuiProvider width={cols} height={rows}>
      <Box width={cols} flexDirection="column">
        {pane}
      </Box>
    </FancyTuiProvider>
  );
}
