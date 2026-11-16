import { readFileSync } from 'node:fs';

/**
 * Read the kit's display name and tagline from `app/Support/Brand.php`, the one
 * place they are typed. Shared by `vite.config.js` and `vitest.config.ts`.
 *
 * Throws rather than falling back: a build that cannot find the brand would
 * otherwise ship pages titled "undefined".
 *
 * @param {string} file absolute path to Brand.php
 * @returns {{ name: string, tagline: string }}
 */
export function readBrand(file) {
    const src = readFileSync(file, 'utf8');
    const pick = (key) => {
        const m = src.match(new RegExp(`public const ${key} = '([^']+)';`));
        if (!m) {
            throw new Error(`Brand::${key} not found in ${file}; refusing to build without the kit's name.`);
        }
        return m[1];
    };
    return { name: pick('NAME'), tagline: pick('TAGLINE') };
}
