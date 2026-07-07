/**
 * Inspiration Gallery shared types — mirror App\Support\GalleryRegistry's
 * entry shapes. Shared by the landing index, the per-collection catalog, the
 * per-style Show shell, and each built style component under ./styles/.
 */

/** One gallery style card. `cuisine` + `surface` are mom-n-pops-only chips. */
export type Style = {
    id: string;
    num: string;
    name: string;
    note: string;
    mode: "light" | "dark";
    swatch: string;
    collection: string;
    thumb: string;
    cuisine?: string;
    surface?: string;
};

/** One collection's meta (styles travel separately or under `styles`). */
export type Collection = {
    id: string;
    name: string;
    kicker: string;
    title: string;
    subject: string;
    blurb: string;
    framing: string;
    range: string;
    count: number;
};
