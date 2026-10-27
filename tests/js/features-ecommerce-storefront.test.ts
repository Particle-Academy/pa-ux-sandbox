import { describe, expect, it } from "vitest";
import {
    buildStorefront,
    formatPrice,
    priceFor,
    refusingStripe,
    SEED_PLANS,
} from "../../resources/js/Pages/Features/Ecommerce/storefront";

/*
 * The /features/ecommerce storefront runs the REAL fancy-catalog +
 * fancy-features packages in the browser. These pin what the page claims:
 * plans are authored into the catalog, gating resolves through the catalog
 * feature source, entitlement is not quota, overage is a ceiling, and nothing
 * can reach Stripe.
 */

const row = async (store: Awaited<ReturnType<typeof buildStorefront>>, key: string) =>
    (await store.rows()).find((r) => r.feature.key === key)!;

describe("storefront", () => {
    it("authors every seed plan with a monthly and a yearly recurring price", async () => {
        const store = await buildStorefront();

        expect(store.plans.map((p) => p.product.id)).toEqual(SEED_PLANS.map((p) => p.id));
        for (const plan of store.plans) {
            expect(priceFor(plan, "month")?.unitAmount).toBe(plan.seed.monthly);
            expect(priceFor(plan, "year")?.unitAmount).toBe(plan.seed.yearly);
            expect(priceFor(plan, "month")?.type).toBe("recurring");
        }
        expect(formatPrice(priceFor(store.plans[1], "month")!)).toBe("$29");
    });

    it("resolves gating from the current plan's product features", async () => {
        const store = await buildStorefront("prod_starter");

        expect((await row(store, "pdf-export")).entitled).toBe(false);
        expect((await row(store, "ai-credits")).explain.remaining).toBe(5);

        store.switchPlan("prod_team");
        const pdf = await row(store, "pdf-export");
        expect(pdf.entitled).toBe(true);
        expect(pdf.explain.source).toBe("source:catalog:prod_team");
        expect((await row(store, "ai-credits")).explain.remaining).toBe(20);

        store.switchPlan("prod_studio");
        expect((await row(store, "ai-credits")).explain.remaining).toBeNull();
        expect((await row(store, "custom-domain")).entitled).toBe(true);
    });

    it("keeps entitlement when the quota is spent, and refuses the next unit", async () => {
        const store = await buildStorefront("prod_starter");
        for (let i = 0; i < 5; i++) {
            expect(await store.features.tryConsume("ai-credits", store.subject, 1)).toBe(true);
        }

        expect(await store.features.tryConsume("ai-credits", store.subject, 1)).toBe(false);
        const credits = await row(store, "ai-credits");
        expect(credits.entitled).toBe(true);
        expect(credits.explain.remaining).toBe(0);
    });

    it("lets Team run past its quota up to the overage ceiling, and records it", async () => {
        const store = await buildStorefront("prod_team");
        expect(await store.features.tryConsume("ai-credits", store.subject, 20)).toBe(true);
        expect(store.overage()).toBe(0);

        expect(await store.features.tryConsume("ai-credits", store.subject, 3)).toBe(true);
        expect(store.overage()).toBe(3);
        expect(await store.features.tryConsume("ai-credits", store.subject, 3)).toBe(false);
        expect(await store.features.tryConsume("ai-credits", store.subject, 2)).toBe(true);
        expect(store.overage()).toBe(5);
    });

    it("never reaches Stripe", async () => {
        const store = await buildStorefront();
        const price = priceFor(store.plans[1], "month")!;

        expect(() => (refusingStripe() as unknown as { checkout: unknown }).checkout).toThrow(/no Stripe client/);
        await expect(
            store.catalog.getSubscriptionCheckoutUrl(price, {
                customer: "cus_demo",
                successUrl: "https://example.com/ok",
                cancelUrl: "https://example.com/cancel",
            }),
        ).rejects.toThrow();
        await expect(store.catalog.syncProductAndPrices(store.plans[1].product)).rejects.toThrow();
    });
});
