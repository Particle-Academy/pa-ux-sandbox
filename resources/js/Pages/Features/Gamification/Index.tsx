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
 * /features/gamification — Phase A stub on the shared kit. Phase B owns this
 * file and replaces every TODO block with the real micro-site (plan:
 * .ai/plans/features-microsites.md). Only what ships today may be shown; the
 * owner's "expanding soon" is said generically, never as named packages.
 */
export default function GamificationFeature({ feature, versions }: FeaturePageProps) {
    return (
        <FeatureShell feature={feature}>
            <FeatureHero feature={feature} languages={feature.languages} />

            <DemoFrame label="Progress surface" status="TODO" id="gamification">
                <div className="feature-todo">TODO (Phase B): a live XP / level / leaderboard surface.</div>
            </DemoFrame>

            <FeatureTour
                title="What it does"
                items={[
                    { icon: "circle-dashed", title: "TODO (Phase B)", body: "TODO: a real Gamification capability." },
                    { icon: "circle-dashed", title: "TODO (Phase B)", body: "TODO: a real Gamification capability." },
                    { icon: "circle-dashed", title: "TODO (Phase B)", body: "TODO: a real Gamification capability." },
                ]}
            />

            <HowItFits members={feature.members} bridges={feature.bridges} />
            <InstallSteps members={feature.members} versions={versions} />
            <PackagesGrid members={feature.members} versions={versions} />

            <FeatureCta
                title="TODO (Phase B): the Gamification call to action"
                primary={{ label: "See the leaderboard", href: "/leaderboard" }}
            />
        </FeatureShell>
    );
}
