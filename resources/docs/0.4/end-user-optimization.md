**End-User Optimization (EUO)** is the counterpart to SEO. SEO optimizes for what *bots* see when they crawl your pages. EUO optimizes for what your *end users* — humans **and** agents — actually do once they're inside the running app: where they look, what they click, where they stall, and which surfaces an agent drives on a user's behalf.

> SEO is about being **found**. EUO is about what happens **after** the click. In a Human+ app, "end user" is two populations sharing one UI — so EUO measures both, separately and together.

## Why coin a new term?

SEO has a 25-year head start and a clear object: the crawler. But a crawler is not your user. The metrics that actually decide whether your product works — task completion, time-to-first-action, rage-clicks, dead zones, and (increasingly) *agent* success rate — live on the other side of the page load. There was no single name for optimizing that surface. EUO is it.

For Fancy UI the distinction is sharp because our apps are **inhabited by agents**. A conversion funnel that only counts human clicks is blind to half the activity. EUO treats agent interactions as first-class signal, not noise to filter out.

## SEO vs EUO

| | SEO | EUO |
|---|---|---|
| Optimizes for | Crawlers / LLM fetchers | Humans **and** agents in the live app |
| Measures | Crawlability, meta, structured data, rankings | Clicks, focus, scroll, task completion, agent tool-calls |
| Signal source | First-byte HTML | Runtime interaction events |
| When it acts | Before the click | After the click |
| Fancy packages | `fancy-seo`, `fancy-inertia/seo` | `fancy-heuristics`, `fancy-heuristics-js`, `fancy-pixel` |

The two are complementary: SEO gets the right people (and agents) to the page; EUO makes sure the surface earns the visit.

## How Fancy does EUO

- **`@particle-academy/fancy-heuristics-js`** — the browser collector. Batches clicks, scroll depth, time-on-page, and mouse-movement focus heatmaps via `sendBeacon`. It tags each event with whether the actor was a human or an agent, so you can split every metric by population.
- **`particle-academy/fancy-heuristics`** — the Laravel server. Ingests the events, builds focus heatmaps, and rolls them up per session and per actor (human vs agent).
- **`@particle-academy/fancy-pixel`** — an embeddable verification badge + liveness/collection beacon. Drops into any site via a `<script>` tag or `mountPixel()`; Shadow-DOM isolated.

This very showcase dogfoods the stack: it's registered as a site in the [Showcase](/showcase), and the generated Fancy Pixel snippet is pasted into Admin → Settings exactly like any external consumer would — so the analytics you see are collected through the real, public path, not a privileged internal hook.

## What to optimize

1. **Time-to-first-action** — how long before a user (or agent) does the thing the screen is for.
2. **Focus vs intent** — heatmaps reveal where attention actually goes; align the primary affordance with it.
3. **Dead zones & rage signals** — repeated clicks on non-interactive elements are a UI bug report you didn't have to ask for.
4. **Agent success rate** — for each bridged surface, what fraction of agent tool-calls land cleanly. A low rate means the affordance (not the agent) needs work — see the [Human+ UX contract](/docs/human-plus-ux).
5. **Human/agent handoff** — where control passes between the two, and whether it's smooth.

EUO and the [Human+ UX](/docs/human-plus-ux) contract reinforce each other: controlled state and stable handles are *also* what make an interaction measurable. If an agent can drive it, you can measure it.
