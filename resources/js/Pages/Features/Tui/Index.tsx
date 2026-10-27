import { Badge } from "@particle-academy/react-fancy";
import { FancyTuiShowcase } from "../../FancyTui/Index";
import { FeatureHero } from "../shared/FeatureHero";
import { FeatureShell } from "../shared/FeatureShell";
import { HowItFits } from "../shared/HowItFits";
import { InstallSteps } from "../shared/InstallSteps";
import { PackagesGrid } from "../shared/PackagesGrid";
import type { FeaturePageProps } from "../shared/types";

/**
 * /features/tui — Phase A: the EXISTING fancy-tui showcase (HTML workbench,
 * component gallery and the full-screen "View as console" terminal) inside the
 * Features shell, so nothing the old /fancy-tui page did regresses. The
 * console still takes the whole viewport, outside the shell. Phase B owns this
 * file and redesigns it on the kit.
 */
export default function TuiFeature({ feature, versions }: FeaturePageProps) {
    return (
        <FancyTuiShowcase
            frame={(content) => (
                <FeatureShell feature={feature}>
                    <FeatureHero
                        feature={feature}
                        lede="One component vocabulary, browser and terminal. Browse the same layouts, agent workflows and Human+ patterns as semantic HTML or a real ANSI console."
                        languages={feature.languages}
                    >
                        <div className="feature-hero__meta">
                            <Badge color="green">MCP ready</Badge>
                        </div>
                    </FeatureHero>

                    {content}

                    <HowItFits members={feature.members} bridges={feature.bridges} />
                    <InstallSteps members={feature.members} versions={versions} />
                    <PackagesGrid members={feature.members} versions={versions} />
                </FeatureShell>
            )}
        />
    );
}
