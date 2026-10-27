import { Badge } from "@particle-academy/react-fancy";
import { FlowShowcase } from "../../Flow/Index";
import { FeatureHero } from "../shared/FeatureHero";
import { FeatureShell } from "../shared/FeatureShell";
import { HowItFits } from "../shared/HowItFits";
import { InstallSteps } from "../shared/InstallSteps";
import { PackagesGrid } from "../shared/PackagesGrid";
import type { FeaturePageProps } from "../shared/types";

/**
 * /features/flow — Phase A: the EXISTING Flow showcase (live editor, trigger
 * cohort demo, highlights) inside the Features shell, so nothing the old /flow
 * page did regresses. Phase B owns this file and redesigns it on the kit
 * (DemoFrame, FeatureTour, FeatureCta).
 */
export default function FlowFeature({ feature, versions }: FeaturePageProps) {
    return (
        <FeatureShell feature={feature}>
            <FeatureHero
                feature={feature}
                lede="A schema-driven workflow editor and runner where humans and agents build on the same canvas. Swimlanes, undo and redo, auto-layout, validated wiring, a zero-React engine, and an MCP bridge so an agent drives the exact surface you see."
                languages={feature.languages}
            >
                <div className="feature-hero__meta">
                    <Badge color="green">MCP ready</Badge>
                    {/* The installed version, from vite.config.js — never typed. */}
                    <Badge color="blue">fancy-flow v{__FANCY_FLOW_VERSION__}</Badge>
                </div>
            </FeatureHero>

            <FlowShowcase />

            <HowItFits members={feature.members} bridges={feature.bridges} />
            <InstallSteps members={feature.members} versions={versions} />
            <PackagesGrid members={feature.members} versions={versions} />
        </FeatureShell>
    );
}
