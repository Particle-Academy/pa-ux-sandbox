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
 * /features/git — Phase A stub on the shared kit. Phase B owns this file and
 * replaces every TODO block with the real micro-site (plan:
 * .ai/plans/features-microsites.md). The hero, install steps, packages and
 * bridge already render real registry data.
 */
export default function GitFeature({ feature, versions }: FeaturePageProps) {
    return (
        <FeatureShell feature={feature}>
            <FeatureHero feature={feature} languages={feature.languages} />

            <DemoFrame label="Git surface" status="TODO" id="git">
                <div className="feature-todo">TODO (Phase B): a live fancy-git-ui surface (history, working tree, pull requests).</div>
            </DemoFrame>

            <FeatureTour
                title="What it does"
                items={[
                    { icon: "circle-dashed", title: "TODO (Phase B)", body: "TODO: a real Git capability." },
                    { icon: "circle-dashed", title: "TODO (Phase B)", body: "TODO: a real Git capability." },
                    { icon: "circle-dashed", title: "TODO (Phase B)", body: "TODO: a real Git capability." },
                ]}
            />

            <HowItFits members={feature.members} bridges={feature.bridges} />
            <InstallSteps members={feature.members} versions={versions} />
            <PackagesGrid members={feature.members} versions={versions} />

            <FeatureCta
                title="TODO (Phase B): the Git call to action"
                primary={{ label: "See the packages", href: "/packages" }}
            />
        </FeatureShell>
    );
}
