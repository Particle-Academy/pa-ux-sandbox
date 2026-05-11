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
];
