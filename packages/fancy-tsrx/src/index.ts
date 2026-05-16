/**
 * @particle-academy/fancy-tsrx — pilot
 *
 * Single-file `.tsrx` versions of react-fancy components, compiled by
 * `@tsrx/vite-plugin-react`. Same Tailwind classes as the React originals so
 * the visuals match without scoped <style> blocks.
 *
 * This is a small pilot (Action, Badge, Card) to validate the format and
 * tooling. Convert more components incrementally once the pipeline is happy.
 */
// @ts-expect-error -- TS doesn't know about .tsrx files; the Vite plugin
// rewrites these imports at build time. A `tsrx-tsc` step would type-check
// them properly.
export { Action } from "./Action.tsrx";
// @ts-expect-error -- see above
export { Badge } from "./Badge.tsrx";
// @ts-expect-error -- see above
export { Card, CardHeader, CardBody } from "./Card.tsrx";
