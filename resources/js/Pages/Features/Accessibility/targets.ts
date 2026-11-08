/** WCAG 2.5.8 (AA) asks 24 by 24 CSS pixels; 2.5.5 (AAA) asks 44 by 44. */
export const TARGET_AA = 24;
export const TARGET_AAA = 44;

/** Both sides of the rendered box must reach the minimum. */
export function meetsTarget(width: number, height: number, min: number): boolean {
    return width >= min && height >= min;
}
