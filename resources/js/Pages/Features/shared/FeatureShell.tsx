import type { ReactNode } from "react";
import { Link } from "@inertiajs/react";
import { Breadcrumbs } from "@particle-academy/react-fancy";
import { ServerSeo } from "@/lib/ServerSeo";
import { Layout } from "../../Layout";
import { FeatureIdentity } from "./FeatureIdentity";
import type { FeatureNav, FeatureTheme } from "./types";

/**
 * The frame every Feature micro-site sits in: the shared site Layout (header,
 * Features dropdown, footer), the server-resolved head, breadcrumbs back to
 * /features, and the Feature's own identity scoped to the page body.
 *
 * Phase B pages own everything INSIDE this; the shell itself is shared.
 */
export function FeatureShell({
    feature,
    children,
}: {
    feature: FeatureNav & { theme: FeatureTheme };
    children: ReactNode;
}) {
    return (
        <Layout>
            <ServerSeo />
            <FeatureIdentity slug={feature.slug} theme={feature.theme} className="feature-shell">
                <Breadcrumbs className="feature-crumbs">
                    <Breadcrumbs.Item href="/features" as={Link}>
                        Features
                    </Breadcrumbs.Item>
                    <Breadcrumbs.Item active>{feature.name}</Breadcrumbs.Item>
                </Breadcrumbs>
                <div className="feature-body">{children}</div>
            </FeatureIdentity>
        </Layout>
    );
}
