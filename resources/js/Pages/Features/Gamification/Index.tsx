import { Link } from "@inertiajs/react";
import { Button, Callout, Icon } from "@particle-academy/react-fancy";
import { DemoFrame } from "../shared/DemoFrame";
import { FeatureCta } from "../shared/FeatureCta";
import { FeatureHero } from "../shared/FeatureHero";
import { FeatureShell } from "../shared/FeatureShell";
import { FeatureTour } from "../shared/FeatureTour";
import { HowItFits } from "../shared/HowItFits";
import { InstallSteps } from "../shared/InstallSteps";
import { PackagesGrid } from "../shared/PackagesGrid";
import type { FeaturePageProps } from "../shared/types";
import { ArcadeDemo } from "./ArcadeDemo";

/**
 * /features/gamification: laravel-fun-lab, shown only as it ships today.
 *
 * The demo models the package's XP / level / achievement / leaderboard rules on
 * seeded players with react-fancy's Progress, StatList and Table; the real
 * engine is run over the same seed in GamificationFeatureTest. The site's own
 * /leaderboard is the production example, built on LFL::leaderboard().
 * "More coming" is said generically: the owner's ruling is that nothing
 * unbuilt is named.
 */
export default function GamificationFeature({ feature, versions }: FeaturePageProps) {
    return (
        <FeatureShell feature={feature}>
            <div className="gam-site">
                <FeatureHero
                    feature={feature}
                    eyebrow="Feature · Engagement"
                    lede="XP, levels, achievements, prizes and leaderboards for Laravel apps, recorded as structured activity your app can analyse."
                    languages={feature.languages}
                    actions={
                        <>
                            <Button href="#arcade" color="amber" icon="gamepad-2" className="gam-tap">
                                Play the demo
                            </Button>
                            <Button as={Link} href="/leaderboard" variant="ghost" iconTrailing="arrow-right" className="gam-tap">
                                This site's leaderboard
                            </Button>
                        </>
                    }
                />
            </div>

            <div id="arcade" className="gam-anchor">
                <DemoFrame
                    id="gamification"
                    label="XP, achievements and a leaderboard"
                    status="Live · seeded"
                    caption="Take an action to earn XP. Cross a level threshold and its achievement unlocks itself; watch your rank move."
                >
                    <ArcadeDemo />
                </DemoFrame>
            </div>

            <FeatureTour
                title="What ships today"
                intro="Everything below is in laravel-fun-lab now, behind one facade: LFL."
                items={[
                    {
                        icon: "layers",
                        title: "XP buckets with levels",
                        body: "Each GamedMetric is its own XP bucket with level thresholds, and a profile totals XP across them. MetricLevelGroups combine metrics with weights for a composite level.",
                    },
                    {
                        icon: "award",
                        title: "Achievements that unlock themselves",
                        body: "Attach an achievement to a level and reaching that level grants it, once. Grant any achievement directly with LFL::grant(), with a reason and a source recorded.",
                    },
                    {
                        icon: "gift",
                        title: "Prizes with inventory",
                        body: "Virtual, physical, feature-unlock or custom prizes, granted the same fluent way. Give a prize an inventory and a grant fails once it runs out.",
                    },
                    {
                        icon: "list-ordered",
                        title: "Leaderboards",
                        body: "LFL::leaderboard() ranks by XP, achievements or prizes, all time or daily, weekly or monthly, and leaves out profiles that opted out unless you ask.",
                    },
                    {
                        icon: "chart-line",
                        title: "Engagement analytics",
                        body: "LFL::analytics() queries the award log: counts, totals, active users, achievement completion rate and time series, filtered by type, source or period.",
                    },
                    {
                        icon: "radio",
                        title: "Every award is an event",
                        body: "XpAwarded, AchievementUnlocked and PrizeAwarded are Laravel events you can listen to, and opt-in broadcasting sends them on private channels. You bring the broadcast driver.",
                    },
                ]}
            />

            <section className="feature-section">
                <Callout color="amber" icon={<Icon name="sparkles" size="sm" />} className="gam-soon">
                    Gamification is growing: more is on the way. This page lists only what you can install today.
                </Callout>
            </section>

            <HowItFits
                members={feature.members}
                bridges={feature.bridges}
                intro="The engine is PHP. The surfaces are react-fancy primitives (Progress, Stat, StatList, Table, Avatar), so any React page can render a profile or a board from the facade's data."
            />
            <InstallSteps members={feature.members} versions={versions} />
            <PackagesGrid members={feature.members} versions={versions} />

            <FeatureCta
                title="See it on a real board"
                body="This site's leaderboard ranks its players by XP with LFL::leaderboard(). Then read the package to put XP in your own app."
                primary={{ label: "Open the leaderboard", href: "/leaderboard" }}
                secondary={{ label: "The laravel-fun-lab package", href: "/packages/laravel-fun-lab" }}
            />
        </FeatureShell>
    );
}
