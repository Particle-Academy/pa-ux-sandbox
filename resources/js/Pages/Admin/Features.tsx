import { Head } from "@inertiajs/react";
import { Badge, Card, Table } from "@particle-academy/react-fancy";
import { adminLayout } from "./AdminLayout";
import { PageHeader, EmptyRow } from "./ui";

type Feature = {
    key: string;
    name: string;
    description: string;
    type: string;
    enabled: boolean;
    remaining: number | null;
};
type Props = { features: Feature[]; pending: number };

function Features({ features }: Props) {
    return (
        <>
            <Head title="Features · Admin" />
            <PageHeader title="Features" sub="Feature-management system (FMS) entitlements." />

            <Card>
                {features.length === 0 ? (
                    <EmptyRow>No features defined.</EmptyRow>
                ) : (
                    <div className="admin-table-wrap">
                        <Table>
                            <Table.Head>
                                <Table.Row>
                                    <Table.Cell header>Feature</Table.Cell>
                                    <Table.Cell header>Type</Table.Cell>
                                    <Table.Cell header>Status</Table.Cell>
                                    <Table.Cell header>Remaining</Table.Cell>
                                </Table.Row>
                            </Table.Head>
                            <Table.Body>
                                {features.map((feature) => (
                                    <Table.Row key={feature.key}>
                                        <Table.Cell>
                                            <div style={{ fontSize: 13.5, fontWeight: 500, color: "var(--fg-1)" }}>{feature.name}</div>
                                            <div style={{ fontFamily: "var(--font-mono)", fontSize: 11.5, color: "var(--fg-4)", marginTop: 2 }}>{feature.key}</div>
                                            {feature.description && (
                                                <div style={{ fontSize: 12, color: "var(--fg-3)", marginTop: 2 }}>{feature.description}</div>
                                            )}
                                        </Table.Cell>
                                        <Table.Cell>
                                            <Badge color={feature.type === "resource" ? "sky" : "zinc"}>{feature.type}</Badge>
                                        </Table.Cell>
                                        <Table.Cell>
                                            <Badge color={feature.enabled ? "emerald" : "zinc"}>{feature.enabled ? "Enabled" : "Disabled"}</Badge>
                                        </Table.Cell>
                                        <Table.Cell>
                                            <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--fg-2)" }}>
                                                {feature.type === "resource" ? (feature.remaining ?? "∞") : "—"}
                                            </span>
                                        </Table.Cell>
                                    </Table.Row>
                                ))}
                            </Table.Body>
                        </Table>
                    </div>
                )}
            </Card>
        </>
    );
}

Features.layout = adminLayout;
export default Features;
