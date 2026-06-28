import { useMemo, useState } from "react";
import { Avatar, Badge, Button, Card, cn, useToast } from "@particle-academy/react-fancy";
import {
  PricingTable,
  FeatureMatrix,
  FeatureGate,
  PlanFeaturesEditor,
} from "@/components/fancy/catalog-fms";
import type {
  Plan,
  FeatureDef,
  Entitlements,
  PlanFeatureValue,
} from "@/components/fancy/catalog-fms";

// ───────────────────────────────────────────────────────────────────────────
// Shop-n-Sub — a "personal Patreon" creator app.
//
// Membership TIERS (catalog plans) + per-tier PERKS (FMS features), a members
// area where perks unlock as you subscribe (FeatureGate), a one-time SHOP, and
// a creator STUDIO to configure tier perks (PlanFeaturesEditor). Fully rigged
// frontend (mock data + live state) — wire the checkout/gating to laravel-catalog
// + laravel-fms (or any backend) to go live.
// ───────────────────────────────────────────────────────────────────────────

const FEATURES: FeatureDef[] = [
  { key: "posts", name: "Members-only posts", type: "boolean", group: "Content" },
  { key: "early", name: "Early access", type: "boolean", group: "Content" },
  { key: "downloads", name: "Asset downloads", type: "resource", group: "Content", unit: "/mo" },
  { key: "discord", name: "Private Discord", type: "boolean", group: "Community" },
  { key: "livestream", name: "Monthly livestream", type: "boolean", group: "Community" },
  { key: "oneonone", name: "1:1 sessions", type: "resource", group: "Perks", unit: "/mo" },
];

const TIERS: Plan[] = [
  {
    id: "free",
    name: "Free",
    description: "Follow along.",
    prices: [
      { id: "free-m", amount: 0, currency: "usd", interval: "month" },
      { id: "free-y", amount: 0, currency: "usd", interval: "year" },
    ],
    highlights: ["Public posts", "Community updates"],
    features: {
      posts: { type: "boolean", enabled: false },
    },
  },
  {
    id: "supporter",
    name: "Supporter",
    description: "Back the work.",
    prices: [
      { id: "sup-m", amount: 500, currency: "usd", interval: "month" },
      { id: "sup-y", amount: 5000, currency: "usd", interval: "year" },
    ],
    highlights: ["Members-only posts", "Early access", "5 downloads / mo"],
    features: {
      posts: { type: "boolean", enabled: true },
      early: { type: "boolean", enabled: true },
      downloads: { type: "resource", enabled: true, limit: 5 },
    },
  },
  {
    id: "insider",
    name: "Insider",
    description: "The full studio.",
    recommended: true,
    badge: "Most popular",
    prices: [
      { id: "ins-m", amount: 1500, currency: "usd", interval: "month" },
      { id: "ins-y", amount: 15000, currency: "usd", interval: "year" },
    ],
    highlights: ["Everything in Supporter", "Private Discord", "Livestreams", "2 × 1:1 / mo", "Unlimited downloads"],
    features: {
      posts: { type: "boolean", enabled: true },
      early: { type: "boolean", enabled: true },
      downloads: { type: "resource", enabled: true, limit: null },
      discord: { type: "boolean", enabled: true },
      livestream: { type: "boolean", enabled: true },
      oneonone: { type: "resource", enabled: true, limit: 2 },
    },
  },
];

const SHOP = [
  { id: "print", name: "Signed art print", price: 3500, emoji: "🖼️" },
  { id: "stickers", name: "Sticker pack", price: 900, emoji: "✨" },
  { id: "zine", name: "Process zine (PDF)", price: 1200, emoji: "📓" },
  { id: "commission", name: "Custom commission slot", price: 25000, emoji: "🎨" },
];

const money = (cents: number) =>
  new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(cents / 100);

/** Derive the viewer's FMS entitlements from the tier they're on. */
function entitlementsForTier(tierId: string): Entitlements {
  const tier = TIERS.find((t) => t.id === tierId);
  const features: Entitlements["features"] = {};
  for (const f of FEATURES) {
    const v = tier?.features?.[f.key];
    if (!v || !v.enabled) {
      features[f.key] = { access: false };
    } else if (v.type === "resource") {
      // Demo a near-exhausted quota on the Supporter downloads perk.
      const used = f.key === "downloads" && tierId === "supporter" ? 5 : 0;
      features[f.key] = { access: true, limit: v.limit, used };
    } else {
      features[f.key] = { access: true };
    }
  }
  return { planId: tierId, features };
}

type View = "tiers" | "members" | "shop" | "studio";

export function ShopNSubKit() {
  const { toast } = useToast();
  const notify = (title: string) => toast({ title, variant: "success" });
  const [view, setView] = useState<View>("tiers");
  const [interval, setInterval] = useState<"month" | "year">("month");
  const [tierId, setTierId] = useState<string>("free");
  const [studioValue, setStudioValue] = useState<Record<string, PlanFeatureValue>>(
    TIERS[2].features ?? {},
  );

  const entitlements = useMemo(() => entitlementsForTier(tierId), [tierId]);
  const currentTier = TIERS.find((t) => t.id === tierId)!;
  const plansWithCurrent = TIERS.map((t) => ({ ...t, current: t.id === tierId }));

  const subscribe = (id: string) => {
    setTierId(id);
    const t = TIERS.find((p) => p.id === id);
    notify(id === "free" ? "Membership cancelled." : `You're now a ${t?.name}! 🎉`);
    setView("members");
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Creator header */}
      <Card>
        <div className="flex flex-wrap items-center gap-4 p-1">
          <Avatar src="https://i.pravatar.cc/96?img=47" alt="Aria Vale" size="xl" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Aria Vale</h2>
              <Badge color="violet" variant="soft">Illustrator · Musician</Badge>
            </div>
            <p className="text-sm text-zinc-500">
              Weekly art drops, process notes, and the occasional song. Powered by your support.
            </p>
          </div>
          <div className="text-right">
            <div className="text-xs uppercase tracking-wide text-zinc-400">Your membership</div>
            <div className="font-semibold text-zinc-800 dark:text-zinc-100">{currentTier.name}</div>
          </div>
        </div>
      </Card>

      {/* Nav */}
      <div className="flex flex-wrap gap-1 rounded-lg border border-zinc-200 bg-zinc-100 p-1 dark:border-zinc-700 dark:bg-zinc-800">
        {([
          ["tiers", "Membership"],
          ["members", "Members area"],
          ["shop", "Shop"],
          ["studio", "Creator studio"],
        ] as [View, string][]).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setView(id)}
            className={cn(
              "rounded-md px-4 py-1.5 text-sm font-medium transition-colors",
              view === id
                ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-950 dark:text-zinc-100"
                : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {view === "tiers" && (
        <div className="flex flex-col gap-8">
          <PricingTable
            plans={plansWithCurrent}
            interval={interval}
            onIntervalChange={(i) => setInterval(i as "month" | "year")}
            intervalLabel={(i) => (i === "year" ? "Yearly · 2 months free" : "Monthly")}
            onSelectPlan={(id) => subscribe(id)}
          />
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-400">
              Compare perks
            </h3>
            <FeatureMatrix plans={TIERS} features={FEATURES} groupOrder={["Content", "Community", "Perks"]} />
          </div>
        </div>
      )}

      {view === "members" && (
        <div className="flex flex-col gap-4">
          <div className="text-sm text-zinc-500">
            You're on <strong className="text-zinc-800 dark:text-zinc-100">{currentTier.name}</strong>. Perks below unlock as you upgrade.
            {tierId === "free" && (
              <Button size="sm" color="violet" className="ml-3" onClick={() => setView("tiers")}>
                See tiers
              </Button>
            )}
          </div>

          <FeatureGate feature="posts" featureName="Members-only posts" entitlements={entitlements} onUpgrade={() => setView("tiers")}>
            <Card>
              <div className="p-1">
                <Badge color="violet" variant="soft" size="sm">New</Badge>
                <h4 className="mt-2 font-semibold">Studio diary #42 — inking the cover</h4>
                <p className="mt-1 text-sm text-zinc-500">A full breakdown of this week's cover, brushes, and the palette I almost shipped.</p>
              </div>
            </Card>
          </FeatureGate>

          <div className="grid gap-4 sm:grid-cols-2">
            <FeatureGate feature="downloads" featureName="Asset downloads" entitlements={entitlements} onUpgrade={() => setView("tiers")}>
              <Card>
                <div className="p-1">
                  <h4 className="font-semibold">Brush + texture pack</h4>
                  <p className="mt-1 text-sm text-zinc-500">This month's downloadable assets.</p>
                  <Button size="sm" className="mt-3" onClick={() => notify("Downloading…")}>Download</Button>
                </div>
              </Card>
            </FeatureGate>

            <FeatureGate feature="discord" featureName="Private Discord" entitlements={entitlements} mode="blur" onUpgrade={() => setView("tiers")}>
              <Card>
                <div className="p-1">
                  <h4 className="font-semibold">#insiders Discord</h4>
                  <p className="mt-1 text-sm text-zinc-500">Behind-the-scenes chat, polls, and WIPs.</p>
                  <Button size="sm" className="mt-3">Open Discord</Button>
                </div>
              </Card>
            </FeatureGate>
          </div>

          <FeatureGate feature="oneonone" featureName="1:1 sessions" entitlements={entitlements} onUpgrade={() => setView("tiers")}>
            <Card>
              <div className="flex items-center justify-between p-1">
                <div>
                  <h4 className="font-semibold">Book a 1:1 portfolio review</h4>
                  <p className="mt-1 text-sm text-zinc-500">30 minutes, screen-share, recorded.</p>
                </div>
                <Button color="violet" onClick={() => notify("Session booked!")}>Book</Button>
              </div>
            </Card>
          </FeatureGate>
        </div>
      )}

      {view === "shop" && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SHOP.map((item) => (
            <Card key={item.id}>
              <div className="flex flex-col gap-3 p-1">
                <div className="text-4xl">{item.emoji}</div>
                <div className="flex-1">
                  <h4 className="font-semibold leading-tight">{item.name}</h4>
                  <div className="mt-1 text-sm font-medium text-zinc-500">{money(item.price)}</div>
                </div>
                <Button size="sm" className="justify-center" onClick={() => notify(`Added ${item.name} to cart`)}>
                  Buy
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {view === "studio" && (
        <div className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              ["Members", "1,284"],
              ["MRR", "$6.4k"],
              ["Insiders", "212"],
            ].map(([label, value]) => (
              <Card key={label}>
                <div className="p-1">
                  <div className="text-xs uppercase tracking-wide text-zinc-400">{label}</div>
                  <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{value}</div>
                </div>
              </Card>
            ))}
          </div>
          <div>
            <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-400">
              Insider tier perks
            </h3>
            <p className="mb-3 text-sm text-zinc-500">
              Toggle perks and set limits. Persist to the laravel-catalog <code>product_feature_configs</code> pivot.
            </p>
            <PlanFeaturesEditor features={FEATURES} value={studioValue} onChange={setStudioValue} />
          </div>
        </div>
      )}
    </div>
  );
}
