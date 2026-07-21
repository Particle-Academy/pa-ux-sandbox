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
 * The one thing it renders that it does NOT compose is a component's captured
 * preview frame — that is itself a real Ink render (from fancy-tui's showcase),
 * embedded line by line so the detail pane shows the component drawing.
 */

const BRAND_MARK = ["╭─────╮", "│ ▟█▙ │", "╰─────╯"];
const ASCII_MARK = ["+-----+", "| FUI |", "+-----+"];

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

function DetailPane({ cat, state, cols, rows }: { cat: Catalogue; state: DocsState; cols: number; rows: number }) {
  const component = selectedComponent(cat, state);
  if (!component) return <Text tone="muted">No component selected.</Text>;

  return (
    <Stack gap={0}>
      <Header
        title={component.title || component.name}
        subtitle={component.package}
        status={<PreviewMark component={component} />}
      />
      <Box marginTop={1}>
        <Text>{component.description}</Text>
      </Box>

      {component.previewable && component.previewFrame ? (
        <PreviewBody component={component} state={state} rows={rows} />
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
 * The captured Ink frame, shown line by line inside a Panel.
 *
 * These lines already carry their own ANSI colour from the showcase capture, so
 * they are printed as-is rather than re-styled — the detail pane shows the
 * component exactly as it draws. Scrolls with the detail offset so a tall
 * preview + its source both stay reachable.
 */
function PreviewBody({
  component,
  state,
  rows,
}: {
  component: CatalogueComponent;
  state: DocsState;
  rows: number;
}) {
  const frameLines = (component.previewFrame ?? "").split("\n");
  const sourceLines = (component.previewSource ?? "").split("\n");
  const body = [
    { kind: "label" as const, text: "LIVE PREVIEW" },
    ...frameLines.map((text) => ({ kind: "frame" as const, text })),
    { kind: "gap" as const, text: "" },
    { kind: "label" as const, text: "SOURCE" },
    ...sourceLines.map((text) => ({ kind: "source" as const, text })),
  ];

  const height = Math.max(6, rows - 10);
  const start = Math.min(state.detailOffset, Math.max(0, body.length - height));
  const slice = body.slice(start, start + height);
  const more = start + height < body.length;

  return (
    <Box marginTop={1} flexDirection="column">
      <Panel title={`Preview — ${component.title || component.name}`} tone="success">
        {slice.map((line, i) => {
          if (line.kind === "label") return <Text key={i} tone="muted" bold>{line.text}</Text>;
          if (line.kind === "gap") return <Text key={i}> </Text>;
          if (line.kind === "source") return <Text key={i} tone="agent">{line.text}</Text>;
          // A pre-coloured frame line: print verbatim.
          return <Text key={i}>{line.text}</Text>;
        })}
        {more ? <Text tone="muted">↓ more</Text> : null}
      </Panel>
    </Box>
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
