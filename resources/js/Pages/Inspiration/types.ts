/**
 * One Inspiration Gallery style — mirrors App\Support\GalleryRegistry's entry
 * shape. Shared by the catalog index, the per-style Show shell, and each built
 * style component under ./styles/.
 */
export type Style = {
    id: string;
    num: string;
    name: string;
    note: string;
    mode: "light" | "dark";
    swatch: string;
};
