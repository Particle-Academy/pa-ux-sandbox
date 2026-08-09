import { Head } from "@inertiajs/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Toast } from "@particle-academy/react-fancy";
import { EditablePage, type NodeTransform } from "@particle-academy/fancy-cms-ui/editor";
import { TimelineDock } from "@particle-academy/fancy-motion/react";
import { sampleTimeline, type TimelineDoc } from "@particle-academy/fancy-motion";
import { Layout } from "./Layout";
import { langTag, type PackageRow, type CompanionRow } from "./Home";
import { homeDoc } from "../cms/home-seed";
import { makeSandboxRegistry } from "../cms/registry";

type CmsHomeProps = {
  packages: PackageRow[];
  companions: CompanionRow[];
  total_components: number;
};

/**
 * The **whole Home page** rendered from a seeded CMS document — the sandbox is
 * its own CMS demo. The page scrolls normally (pixel-identical to `/`); hold
 * **Ctrl+Shift → Edit** for inline text editing, move/resize (8 handles), an
 * element Inspector, and an add-element palette. Animation is **configured +
 * previewed** on the timeline dock: scrub the playhead or hit **▶ Play** to
 * sweep it. Read-only (in-memory) — nothing persists.
 */
// Blank by default — a fresh page is static until the author adds keyframes. (The
// old seed shipped a baked-in card/heading/lede morph, which made animations
// "already appear" the moment you scrubbed or hit Play.)
// Data source for the de-hardcoded "Explore" section — a CMS repeater binds this
// array and repeats its card template per item ({ $bind: "item.title" } etc.).
const EXPLORE_DATA = [
  { href: "/starter-kits", title: "Starter Kits", body: "Vertical demos — clone, study, adapt.", tag: "templates" },
  { href: "/dreaming", title: "Dreaming", body: "Speculative components you can vote on.", tag: "speculative" },
  { href: "/showcase", title: "Designer Showcase", body: "Sites and repos built with Fancy UI.", tag: "community" },
  { href: "/leaderboard", title: "Leaderboard", body: "Top contributors by merged PRs and votes.", tag: "live" },
];

const seedTimeline: TimelineDoc = {
  id: "home-tl",
  axis: "vertical",
  frames: 1,
  keyframes: [{ id: "k0", at: 0, mode: "snap", snapshot: {} }],
  scenes: [],
};

export default function CmsHome({ packages, companions, total_components }: CmsHomeProps) {
  // The real size of the kit — the UI grid plus every companion package, the
  // same sum `Home`'s Hero takes.
  const packageCount = packages.length + companions.length;
  const [tl, setTl] = useState<TimelineDoc>(seedTimeline);
  const [kf, setKf] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const registry = useMemo(
    () => makeSandboxRegistry({ packages, companions, total: total_components }),
    [packages, companions, total_components],
  );
  const transforms = useMemo(() => sampleTimeline(tl, progress), [tl, progress]);

  // Scroll ↔ playhead, both ways. A "programmatic scroll" flag breaks the
  // feedback loop (scrub → scroll → scroll-listener → scrub …).
  const programmaticScroll = useRef(false);
  const scrollMax = () => Math.max(1, document.documentElement.scrollHeight - window.innerHeight);

  // Scrolling the page moves the timeline tracker.
  useEffect(() => {
    const onScroll = () => {
      if (programmaticScroll.current) {
        programmaticScroll.current = false;
        return;
      }
      setProgress(Math.min(1, Math.max(0, window.scrollY / scrollMax())));
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Scrubbing/clicking the timeline scrolls the page to that position.
  const scrubTo = (p: number) => {
    setProgress(p);
    programmaticScroll.current = true;
    window.scrollTo({ top: p * scrollMax() });
  };

  const selectKeyframe = (id: string | null) => {
    setKf(id);
    const k = id ? tl.keyframes.find((k) => k.id === id) : null;
    if (k) setProgress(k.at);
  };

  // Move/resize captures the element's transform into the active keyframe (the
  // selected one, the nearest one to the playhead, or a fresh one there).
  const onNodeTransform = (nodeId: string, t: NodeTransform) => {
    setTl((prev) => {
      const kfs = [...prev.keyframes];
      let targetId = kf;
      if (!targetId) {
        const near = kfs.find((k) => Math.abs(k.at - progress) < 0.02);
        if (near) {
          targetId = near.id;
        } else {
          targetId = `kf-${kfs.length + 1}-${Math.floor(performance.now())}`;
          kfs.push({ id: targetId, at: progress, mode: "scroll", snapshot: {} });
        }
      }
      return {
        ...prev,
        keyframes: kfs.map((k) => (k.id === targetId ? { ...k, snapshot: { ...k.snapshot, [nodeId]: t } } : k)),
      };
    });
  };

  return (
    <Toast.Provider position="bottom-right">
      <Layout bleed>
        <Head title="Fancy UI · CMS Home (edit demo)" />
        <EditablePage
          doc={homeDoc}
          registry={registry}
          data={{
            // Enriched for the Packages repeater bindings (computed display fields).
            packages: packages.map((p) => ({
              ...p,
              href: `/packages/${p.slug}`,
              verLabel: `${p.components_count} comp${p.components_count === 1 ? "" : "s"}`,
              langLabel: langTag(p.language).label,
            })),
            companions: companions.map((c) => ({
              ...c,
              url: c.npm
                ? `https://www.npmjs.com/package/${c.npm}`
                : `https://packagist.org/packages/${c.composer}`,
            })),
            total_components,
            packagesTitle: `${packages.length} small packages. Lift any one out.`,

            // The hero's facts are BOUND, not written into the seed. They were
            // duplicated there once and immediately went stale: the seed still
            // said "v0.4" after the kit cut to 0.5, and "64 small packages" /
            // "12 UI packages" — the same undercount `Home`'s Hero already
            // carries a comment about fixing. A number typed into a document is
            // a number nothing can keep true.
            heroEyebrow: `<span class="dot"></span><span>v${__KIT_VERSION__} · React · PHP · Node</span>`,
            heroLede:
              `${packageCount} small packages covering the parts every real app needs and nobody wants to write twice ` +
              `— data grids, spreadsheets, workflow engines, xlsx/pptx/docx writers, Stripe catalogs, feature gating. ` +
              `Install one or take the whole stack; every server capability ships for PHP and Node. Agent-friendly ` +
              `throughout, so you can hand the boring half over and stay in flow.`,
            heroMeta:
              `<span class="meta-item">${packageCount} packages</span>` +
              `<span class="meta-item">MIT licensed</span>` +
              `<span class="meta-item"><code>tailwindcss &gt;= 4</code></span>` +
              `<span class="meta-item">React 19 · PHP 8.4</span>`,
            explore: EXPLORE_DATA,
          }}
          pinned={false}
          frames={tl.frames}
          transforms={transforms}
          onNodeTransform={onNodeTransform}
          timelineDock={
            <TimelineDock
              value={tl}
              onChange={setTl}
              progress={progress}
              onScrub={scrubTo}
              selectedKeyframe={kf}
              onSelectKeyframe={selectKeyframe}
            />
          }
        />
      </Layout>
    </Toast.Provider>
  );
}
