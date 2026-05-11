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
  /** ISO date the dream was added. */
  dreamedAt?: string;
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
    slug: "veto-ribbon",
    title: "Veto Ribbon",
    blurb:
      "A thin ribbon surfaces a pending agent action with a countdown so humans can approve early, edit the payload, or veto — trust-but-verify without modal interruptions.",
    pkg: "agent-integrations",
    dreamedAt: "2026-05-11",
  },
];
