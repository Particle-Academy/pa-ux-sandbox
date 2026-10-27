import { DemoFrame } from "../shared/DemoFrame";
import { FeatureCta } from "../shared/FeatureCta";
import { FeatureHero } from "../shared/FeatureHero";
import { FeatureShell } from "../shared/FeatureShell";
import { FeatureTour } from "../shared/FeatureTour";
import { HowItFits } from "../shared/HowItFits";
import { InstallSteps } from "../shared/InstallSteps";
import { PackagesGrid } from "../shared/PackagesGrid";
import type { FeaturePageProps } from "../shared/types";

/**
 * /features/3d — Phase A stub on the shared kit. Phase B owns this file and
 * replaces every TODO block with the real micro-site (plan:
 * .ai/plans/features-microsites.md). The hero, install steps, packages and
 * bridge already render real registry data.
 *
 * The directory is `ThreeD` because the slug starts with a digit.
 */
export default function ThreeDFeature({ feature, versions }: FeaturePageProps) {
    return (
        <FeatureShell feature={feature}>
            <FeatureHero feature={feature} languages={feature.languages} />

            <DemoFrame label="3D scene" status="TODO" id="3d">
                <div className="feature-todo">TODO (Phase B): a live fancy-3d scene, switchable between the DOM, Babylon.js and three.js engines.</div>
            </DemoFrame>

            <FeatureTour
                title="What it does"
                items={[
                    { icon: "circle-dashed", title: "TODO (Phase B)", body: "TODO: a real 3D capability." },
                    { icon: "circle-dashed", title: "TODO (Phase B)", body: "TODO: a real 3D capability." },
                    { icon: "circle-dashed", title: "TODO (Phase B)", body: "TODO: a real 3D capability." },
                ]}
            />

            <HowItFits members={feature.members} bridges={feature.bridges} />
            <InstallSteps members={feature.members} versions={versions} />
            <PackagesGrid members={feature.members} versions={versions} />

            <FeatureCta
                title="TODO (Phase B): the 3D call to action"
                primary={{ label: "See the packages", href: "/packages" }}
            />
        </FeatureShell>
    );
}
