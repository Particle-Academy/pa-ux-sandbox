import { useMemo, useState } from "react";
import { Badge, Button, Heading, Text } from "@particle-academy/react-fancy";
import {
    CommissionStatement,
    DownlineTree,
    RankProgress,
    buildDownline,
    type CommissionRow,
    type DownlineEdge,
    type DownlineMember,
    type DownlineNode,
} from "@particle-academy/fancy-mlm-ui";
import seed from "./referrals.json";

/**
 * The referral side of the storefront, on fancy-mlm-ui. The members, orders and
 * rewards are seeded in `referrals.json`; every reward amount there is what
 * fancy-mlm's ReferralEngine computes for that plan, and
 * `EcommerceFeatureTest` re-runs the real engine to prove it.
 */

type SeedMember = DownlineMember & { tier: string };

const MEMBERS = seed.members as SeedMember[];
const TIER_COLOR: Record<string, "orange" | "zinc" | "amber" | "violet"> = {
    bronze: "orange",
    silver: "zinc",
    gold: "amber",
    diamond: "violet",
};

function count(nodes: DownlineNode[]): number {
    return nodes.reduce((total, node) => total + 1 + count(node.children), 0);
}

/** Team size in the sponsor tree: everyone below this member, active or not. */
export function teamSize(memberId: string): number {
    const [root] = buildDownline(MEMBERS, memberId, "sponsor");
    return root ? count(root.children) : 0;
}

/** The rewards one member received, newest order first, as statement rows. */
export function statementFor(memberId: string): CommissionRow[] {
    const rows: CommissionRow[] = [];
    for (const order of [...seed.orders].reverse()) {
        const buyer = MEMBERS.find((m) => m.id === order.memberId)?.label ?? order.memberId;
        for (const reward of order.rewards) {
            if (reward.recipient !== memberId) continue;
            rows.push({
                id: `${order.id}-${reward.recipient}`,
                recipientMemberId: reward.recipient,
                recipientLabel: `${buyer} bought ${order.plan} (${order.points} pts)`,
                level: reward.level,
                tier: reward.tier,
                metric: seed.plan.metric,
                amount: reward.amount,
                status: order.status as CommissionRow["status"],
            });
        }
    }
    return rows;
}

export function ReferralDemo() {
    const [edge, setEdge] = useState<DownlineEdge>("sponsor");
    const [selected, setSelected] = useState("you");

    const member = MEMBERS.find((m) => m.id === selected) ?? MEMBERS[0];
    const rows = useMemo(() => statementFor(member.id), [member.id]);
    const size = teamSize(member.id);
    const rankIndex = seed.ranks.findIndex((rank) => rank.tier === member.tier);
    const next = seed.ranks[rankIndex + 1] ?? null;

    return (
        <div className="ecom-mlm" data-ecom-referrals="">
            <div className="ecom-store__bar">
                <Heading as="h2" size="md" weight="semibold" className="feature-display">
                    Referral network
                </Heading>
                <div className="ecom-toggle" role="group" aria-label="Tree shape">
                    <Button className="ecom-tap" color={edge === "sponsor" ? "emerald" : undefined} active={edge === "sponsor"} aria-pressed={edge === "sponsor"} onClick={() => setEdge("sponsor")}>
                        Sponsor tree
                    </Button>
                    <Button className="ecom-tap" color={edge === "placement" ? "emerald" : undefined} active={edge === "placement"} aria-pressed={edge === "placement"} onClick={() => setEdge("placement")}>
                        Placement tree
                    </Button>
                </div>
            </div>
            <Text as="p" size="sm" color="muted">
                One member list, two shapes: who enrolled whom, or where each member was placed. Pick a member to read their
                statement.
            </Text>

            <div className="ecom-mlm__grid">
                <div className="ecom-mlm__tree">
                    <DownlineTree
                        value={MEMBERS}
                        rootId="you"
                        edge={edge}
                        selectedId={selected}
                        onSelect={(id) => setSelected(id)}
                        tierColor={(tier) => (tier && TIER_COLOR[tier]) || "zinc"}
                    />
                </div>

                <div className="ecom-mlm__side">
                    <div className="ecom-mlm__who">
                        <Heading as="h3" size="sm" weight="semibold">
                            {member.label === "You" ? "Your statement" : `${member.label}'s statement`}
                        </Heading>
                        <Badge color={TIER_COLOR[member.tier] ?? "zinc"} variant="soft">
                            {member.tier}
                        </Badge>
                        {member.active === false && (
                            <Badge color="zinc" variant="outline">
                                inactive: skipped by compression
                            </Badge>
                        )}
                    </div>
                    <RankProgress
                        tier={member.tier}
                        nextTier={next?.tier ?? null}
                        value={size}
                        target={next?.teamSize ?? null}
                        unit="team members"
                    />
                    <div className="ecom-table">
                        <CommissionStatement
                            rows={rows}
                            formatAmount={(amount) => `${amount.toLocaleString("en-US")} pts`}
                            emptyLabel="No referral rewards yet."
                        />
                    </div>
                </div>
            </div>

            <Text as="p" size="sm" color="muted">
                Plan: levels pay {seed.plan.levelFactors.map((f) => `${f * 100}%`).join(", ")}; tier multipliers{" "}
                {Object.entries(seed.plan.tiers)
                    .map(([tier, m]) => `${tier} ×${m}`)
                    .join(", ")}
                ; compression on. fancy-mlm computes each reward and hands it to your RewardSink, which decides what it becomes
                (points here).
            </Text>
        </div>
    );
}
