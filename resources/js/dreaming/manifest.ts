/**
 * Dreaming manifest. The cron-driven dreaming loop edits this file to
 * register new speculative components — title, slug, blurb. The sidebar
 * + router read from it. Keep one entry per dreamed component.
 *
 * Add new entries by appending to the `DREAMS` array. Each `slug` becomes
 * the route under /dreaming/<slug> and must match a page file at
 * `pages/<PascalCaseOfSlug>Demo.tsx` exporting a named demo component.
 */
export type Dream = {
  /** Route slug. Kebab-case. */
  slug: string;
  /** Display title shown in the sidebar + page header. */
  title: string;
  /** Short blurb shown under the title and in the lobby cards. */
  blurb: string;
  /** Which existing package this dream extends. Free-form, used as a tag. */
  pkg?: string;
  /** Thematic batch this dream belongs to (e.g. "Support Services"). */
  theme?: string;
  /** ISO date the dream was added. */
  dreamedAt?: string;
  /**
   * Marked ACCEPTED once the dream has been promoted into its target
   * package. Acceptance moves the implementation into `packages/<pkg>/`
   * and adds a real sandbox demo under `react-demos/pages/`. The
   * dreaming page stays so the lineage is visible.
   */
  accepted?: boolean;
  /** ISO date the dream was accepted into production. */
  acceptedAt?: string;
};

export const DREAMS: Dream[] = [
  {
    slug: "control-baton",
    title: "Control Baton",
    blurb:
      "A passable write-lock pill: humans and agents request, hold, grant, or yank exclusive control of a surface, with auto-pass on activity and a transfer timeline.",
    pkg: "agent-integrations",
    dreamedAt: "2026-05-11",
  },
  {
    slug: "intent-trail",
    title: "Intent Trail",
    blurb:
      "A fading cross-surface breadcrumb of agent activity — each tool call drops a colored dot on the surface it touched, hover to inspect, watch the shape of where the agent has been.",
    pkg: "agent-integrations",
    dreamedAt: "2026-05-11",
  },
  {
    slug: "time-scrubber",
    title: "Time Scrubber",
    blurb:
      "A scrubbable timeline that rewinds a surface's state to any prior moment — see what the agent did, branch off, or fork a new screen from a past frame.",
    pkg: "fancy-screens",
    dreamedAt: "2026-05-11",
  },
  {
    slug: "margin-chat",
    title: "Margin Chat",
    blurb:
      "A slim chat thread docked beside any screen — messages can @-reference elements on that surface, hover to highlight, click to scroll, so conversation stays anchored to the work.",
    pkg: "agent-integrations",
    dreamedAt: "2026-05-11",
  },
  {
    slug: "agent-roster-dock",
    title: "Agent Roster Dock",
    blurb:
      "A persistent edge dock listing every active agent with live status (thinking, working on X, idle, blocked) — click to summon, mute, pause, or hand off the baton.",
    pkg: "agent-integrations",
    dreamedAt: "2026-05-11",
  },
  {
    slug: "briefing-card",
    title: "Briefing Card",
    blurb:
      "Before a multi-step plan executes, the agent posts a card listing every step — the human can ack the whole plan, edit individual steps, or reject, then watch each step land in turn.",
    pkg: "agent-integrations",
    dreamedAt: "2026-05-11",
  },
  {
    slug: "pulse-beacon",
    title: "Pulse Beacon",
    blurb:
      "Directional attention pulse: when an agent needs the human to look at something off-focus or off-screen, a ripple travels from the element toward the cursor with an inline reason chip.",
    pkg: "agent-integrations",
    dreamedAt: "2026-05-11",
  },
  {
    slug: "surface-ghost",
    title: "Surface Ghost",
    blurb:
      "Translucent in-place preview of an agent's pending writes overlaid on the surface — hover to see who/why, accept individual ghosts, or sweep-accept everything.",
    pkg: "agent-integrations",
    dreamedAt: "2026-05-11",
  },
  {
    slug: "streaming-text",
    title: "StreamingText",
    blurb:
      "A primitive that renders streamed-in agent output with typewriter/chunked-reveal/word-fade variants, inline citations, pause/skip controls, and a finished signal.",
    pkg: "react-fancy",
    dreamedAt: "2026-05-11",
  },
  {
    slug: "suggestion-ghost",
    title: "SuggestionGhost",
    blurb:
      "An input with inline grey ghost-text completion past the caret — Tab to accept, Cmd+→ to accept one word, Esc to dismiss; debounced predictor with manual override.",
    pkg: "react-fancy",
    dreamedAt: "2026-05-11",
  },
  {
    slug: "reason-tag",
    title: "ReasonTag",
    blurb:
      "Wrap any value with a small ? affordance — on hover or click reveals the source, the agent's reasoning, a confidence band, and citations, so explainability is one keystroke away.",
    pkg: "react-fancy",
    dreamedAt: "2026-05-11",
    accepted: true,
    acceptedAt: "2026-05-12",
  },
  {
    slug: "draft-stack",
    title: "DraftStack",
    blurb:
      "Swipeable stack of competing AI-generated drafts with a word-level diff between adjacent drafts, side-by-side compare mode, and a one-click accept that promotes a draft to the live field.",
    pkg: "react-fancy",
    dreamedAt: "2026-05-11",
  },
  {
    slug: "prompt-input",
    title: "PromptInput",
    blurb:
      "Multi-line prompt field with /command autocomplete, @-mention picker, attachment chips, submit-on-⌘Enter, and a token-budget meter — the chat composer every AI app rebuilds from scratch.",
    pkg: "react-fancy",
    dreamedAt: "2026-05-11",
    accepted: true,
    acceptedAt: "2026-05-12",
  },
  {
    slug: "magic-wand",
    title: "MagicWand",
    blurb:
      "Selection-anchored floating toolbar that pops over highlighted text with AI-flavored quick actions (rephrase, shorten, expand, explain, translate) — each invokes a host callback with the selection.",
    pkg: "react-fancy",
    dreamedAt: "2026-05-11",
    accepted: true,
    acceptedAt: "2026-05-12",
  },
  {
    slug: "tracked-textarea",
    title: "TrackedTextarea",
    blurb:
      "A textarea that renders multi-author edits as inline insertions and strike-through deletions colored by author, with per-change accept/reject, an author legend, and a clean export of the resolved text.",
    pkg: "react-fancy",
    dreamedAt: "2026-05-11",
  },
  {
    slug: "evidence-pane",
    title: "EvidencePane",
    blurb:
      "Collapsible drawer docked below an AI answer listing every retrieved snippet, citation, and tool call that produced it — click a snippet to highlight its referencing span in the answer.",
    pkg: "react-fancy",
    dreamedAt: "2026-05-11",
  },
  {
    slug: "progress-beam",
    title: "ProgressBeam",
    blurb:
      "Slim ambient progress bar pinned to a container's top edge that segments by parallel background jobs — each colored slice carries one agent's task, hover for detail, click to expand the roster.",
    pkg: "react-fancy",
    dreamedAt: "2026-05-11",
  },
  {
    slug: "whats-new",
    title: "WhatsNew",
    blurb:
      "A while-you-were-away tray that catalogs every agent-introduced change since the user's last visit, grouped by surface, with jump-to and dismiss-all — the inbox for asynchronous AI work.",
    pkg: "react-fancy",
    dreamedAt: "2026-05-11",
  },
  {
    slug: "smart-list",
    title: "SmartList",
    blurb:
      "A list of AI-generated items where every row exposes hover-revealed regenerate / explain / edit / pin / drop affordances, plus a sweep regenerate for the whole list and a pinned-items pin board.",
    pkg: "react-fancy",
    dreamedAt: "2026-05-11",
  },
  {
    slug: "mood-meter",
    title: "MoodMeter",
    blurb:
      "A 2D value+confidence input on a single pad — x is the value, y is how sure you are, the halo radius shrinks as confidence rises; perfect for AI-suggested numeric settings where uncertainty matters.",
    pkg: "react-fancy",
    dreamedAt: "2026-05-11",
    accepted: true,
    acceptedAt: "2026-05-12",
  },
  {
    slug: "annotated-field",
    title: "AnnotatedField",
    blurb:
      "Wraps any form input with a margin annotation slot that holds a threaded conversation pinned to the field — agents drop 'set X because Y' notes, humans reply, resolve, or convert a note into the next value.",
    pkg: "react-fancy",
    dreamedAt: "2026-05-11",
  },
  {
    slug: "beadcrumb",
    title: "Beadcrumb",
    blurb:
      "Horizontal scrollable session history — every step is a labeled bead with a miniature thumbnail and timestamp; click a bead to rewind, branch off into a side trail, or compare two beads.",
    pkg: "react-fancy",
    dreamedAt: "2026-05-11",
  },
  {
    slug: "hot-zone",
    title: "HotZone",
    blurb:
      "Wraps any element so it pulses once when its content changes — a self-contained 'look here' effect tuned by tone (info/change/risky), intensity, and decay; designed to fade quietly after one breath.",
    pkg: "react-fancy",
    dreamedAt: "2026-05-11",
  },
  {
    slug: "grouped-tray",
    title: "GroupedTray",
    blurb:
      "Edge-docked slide-in tray for any list of items grouped by a key. Per-group collapse, per-item action menu, bulk 'mark group read' — keyboard-navigable. Works for notifications, files-by-folder, tickets-by-source, builds-by-pipeline, anything groupable.",
    pkg: "react-fancy",
    theme: "Notifications",
    dreamedAt: "2026-05-15",
  },
  {
    slug: "milestone-empty",
    title: "MilestoneEmpty",
    blurb:
      "Celebratory empty-state card for any milestone moment — inbox zero, all tests passing, queue drained, onboarding complete. Slot for stat tiles + one primary CTA + gradient hero, fades when the underlying state changes.",
    pkg: "react-fancy",
    theme: "Notifications",
    dreamedAt: "2026-05-15",
  },
  {
    slug: "time-grid",
    title: "TimeGrid",
    blurb:
      "7×24 (or any N×M) boolean-cell painter — drag to paint, click axis labels to toggle whole row/column. Powers quiet hours, working hours, availability matrices, room booking, meeting heatmaps; anywhere a recurring time selection lives.",
    pkg: "react-fancy",
    theme: "Notifications",
    dreamedAt: "2026-05-15",
  },
  {
    slug: "classifier-chip",
    title: "ClassifierChip",
    blurb:
      "Auto-classified badge with hover-revealed reasoning and click-to-override. Sends the override back to the host's classifier so it trains itself. Generic across priority, sentiment, severity, category, risk — anywhere an AI label needs human-correctable trust.",
    pkg: "agent-integrations",
    theme: "Notifications",
    dreamedAt: "2026-05-15",
  },
  {
    slug: "batch-preview",
    title: "BatchPreview",
    blurb:
      "Preview-before-commit list with per-item include toggle, drag-to-reorder, and a 'send/run/apply now' override. Works for digests, scheduled posts, batch operations, AI write queues — anywhere a pending batch deserves a last look.",
    pkg: "react-fancy",
    theme: "Notifications",
    dreamedAt: "2026-05-15",
  },
  {
    slug: "checklist-rail",
    title: "ChecklistRail",
    blurb:
      "Vertical onboarding checklist with collapsible per-step detail, progress ring, and a single 'next' CTA that always points at the user's most-actionable remaining step.",
    pkg: "react-fancy",
    theme: "Onboarding",
    dreamedAt: "2026-05-15",
  },
  {
    slug: "tour-beacon",
    title: "TourBeacon",
    blurb:
      "Pulsing dot that anchors to any selector on the page and pops a coachmark on click — keyboard-navigable across a sequence, auto-scrolls into view, and remembers dismissed steps.",
    pkg: "react-fancy",
    theme: "Onboarding",
    dreamedAt: "2026-05-15",
  },
  {
    slug: "empty-canvas",
    title: "EmptyCanvas",
    blurb:
      "Illustrated empty-state container with a small grid of first-action CTAs — most-tried action floats to the top across sessions so power moves stay one click away.",
    pkg: "react-fancy",
    theme: "Onboarding",
    dreamedAt: "2026-05-15",
  },
  {
    slug: "profile-blanks",
    title: "ProfileBlanks",
    blurb:
      "Slim profile-completion bar that always surfaces the single next missing field as a one-tap inline mini-form — fills, validates, advances, with no detour to a settings page.",
    pkg: "react-fancy",
    theme: "Onboarding",
    dreamedAt: "2026-05-15",
  },
  {
    slug: "sample-data-toggle",
    title: "SampleDataToggle",
    blurb:
      "Persistent strip offering to seed a fresh workspace with sample data, with a single revert button — the 'try-before-you-commit' affordance for empty-state hesitation.",
    pkg: "react-fancy",
    theme: "Onboarding",
    dreamedAt: "2026-05-15",
  },
  {
    slug: "ticket-spine",
    title: "TicketSpine",
    blurb:
      "Vertical lifecycle indicator for a support ticket — open → triaged → in-progress → waiting-customer → resolved, with SLA color states, branch-off escalation rails, and per-stage timestamps revealed on hover.",
    pkg: "react-fancy",
    theme: "Support Services",
    dreamedAt: "2026-05-14",
  },
  {
    slug: "sla-pulse",
    title: "SlaPulse",
    blurb:
      "Live SLA countdown pill bound to a target wall-clock — green while comfortable, amber as the breach window approaches, red-pulse when breached; resilient to tab-sleep with a single rAF heartbeat.",
    pkg: "react-fancy",
    theme: "Support Services",
    dreamedAt: "2026-05-14",
  },
  {
    slug: "canned-composer",
    title: "CannedComposer",
    blurb:
      "Reply composer with one-keystroke macro insertion and {{variable}} placeholders — unresolved variables render as warning chips so reps never accidentally send '{{customer_name}}'.",
    pkg: "react-fancy",
    theme: "Support Services",
    dreamedAt: "2026-05-14",
  },
  {
    slug: "triage-stack",
    title: "TriageStack",
    blurb:
      "Stack of agent-recommended ticket actions (refund, escalate, draft-reply, close), each as a card with confidence + reason — swipe right to accept, left to reject, tap to edit before committing.",
    pkg: "agent-integrations",
    theme: "Support Services",
    dreamedAt: "2026-05-14",
  },
  {
    slug: "assist-overlay",
    title: "AssistOverlay",
    blurb:
      "Floating sidekick that hovers near any focused input and surfaces the agent's top-3 next-actions (quote KB, insert link, escalate) — keyboard-driven, dismissable, never steals the caret.",
    pkg: "agent-integrations",
    theme: "Support Services",
    dreamedAt: "2026-05-14",
  },
  {
    slug: "veto-ribbon",
    title: "Veto Ribbon",
    blurb:
      "A thin ribbon surfaces a pending agent action with a countdown so humans can approve early, edit the payload, or veto — trust-but-verify without modal interruptions.",
    pkg: "agent-integrations",
    dreamedAt: "2026-05-11",
  },
];
