import { Head } from "@inertiajs/react";
import { useMemo, useState } from "react";
import { Toast } from "@particle-academy/react-fancy";
import { EditablePage, type NodeTransform } from "@particle-academy/fancy-cms-ui/editor";
import { TimelineDock } from "@particle-academy/fancy-motion/react";
import { sampleTimeline, type TimelineDoc } from "@particle-academy/fancy-motion";
import { Layout } from "./Layout";
import type { PackageRow, CompanionRow } from "./Home";
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
const seedTimeline: TimelineDoc = {
  id: "home-tl",
  axis: "vertical",
  frames: 1,
  keyframes: [
    { id: "k0", at: 0, mode: "snap", snapshot: {} },
    {
      id: "k1",
      at: 1,
      mode: "scroll",
      ease: "ease-out",
      snapshot: { card: { x: 90, scale: 0.92, opacity: 0.15 }, heading: { y: -32 }, lede: { opacity: 0.3 } },
    },
  ],
  scenes: [],
};

export default function CmsHome({ packages, companions, total_components }: CmsHomeProps) {
  const [tl, setTl] = useState<TimelineDoc>(seedTimeline);
  const [kf, setKf] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const registry = useMemo(
    () => makeSandboxRegistry({ packages, companions, total: total_components }),
    [packages, companions, total_components],
  );
  const transforms = useMemo(() => sampleTimeline(tl, progress), [tl, progress]);

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
          pinned={false}
          transforms={transforms}
          onNodeTransform={onNodeTransform}
          timelineDock={
            <TimelineDock
              value={tl}
              onChange={setTl}
              progress={progress}
              onScrub={setProgress}
              selectedKeyframe={kf}
              onSelectKeyframe={selectKeyframe}
            />
          }
        />
      </Layout>
    </Toast.Provider>
  );
}
