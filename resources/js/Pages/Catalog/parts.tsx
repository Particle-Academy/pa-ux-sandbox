import { formatMoney } from "../../components/fancy/catalog-fms/format";

/** A laravel-catalog price, normalized by ProductController. */
export type CatalogPrice = {
    id: number;
    amount: number;
    currency: string;
    recurring: boolean;
    interval: string | null;
    intervalCount: number;
    /** False until the price exists in Stripe — checkout would fail without it. */
    purchasable: boolean;
};

export type CatalogProduct = {
    id: number;
    name: string;
    description: string | null;
    image: string | null;
    prices: CatalogPrice[];
};

/** "$29.00 / month", "$29.00 / 3 months", or "$99.00" for a one-time price. */
export function priceLabel(price: CatalogPrice): string {
    const money = formatMoney(price.amount, price.currency);
    if (!price.recurring || !price.interval) return money;

    const every = price.intervalCount > 1 ? `${price.intervalCount} ${price.interval}s` : price.interval;

    return `${money} / ${every}`;
}

/** One price, as a line of text. Shared by the storefront grid and the detail page. */
export function PriceLine({ price }: { price: CatalogPrice }) {
    return (
        <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{priceLabel(price)}</div>
    );
}
