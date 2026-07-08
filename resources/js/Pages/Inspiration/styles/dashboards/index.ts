import type { StyleComponent } from "../index";
import Pulse from "./pulse";
import Helm from "./helm";
import Ledger from "./ledger";
import Merchant from "./merchant";
import Wrapped from "./wrapped";
import Fleet from "./fleet";
import Hearth from "./hearth";
import Cadence from "./cadence";
import Scholar from "./scholar";
import Griddle from "./griddle";
import Vertex from "./vertex";
import Relay from "./relay";
import Voyage from "./voyage";

/**
 * The Dashboards collection's style-mounting registry — fictional apps
 * (user-facing + admin), each a dashboard built to demonstrate the Fancy UI Kit
 * (fancy-echarts EChart + Card + Table + Kanban + Timeline + Progress + …).
 * Same rules as the other collections: STATIC imports (Inertia SSR), each page
 * self-contained with its co-located ./{id}.css.
 *
 * Dashboards 14–20 (roster, helios, northstar, meridian, vitals, still,
 * amplify) are designed + reviewed and land in the next batch.
 */
export const DASHBOARDS_STYLES: Record<string, StyleComponent> = {
    pulse: Pulse,
    helm: Helm,
    ledger: Ledger,
    merchant: Merchant,
    wrapped: Wrapped,
    fleet: Fleet,
    hearth: Hearth,
    cadence: Cadence,
    scholar: Scholar,
    griddle: Griddle,
    vertex: Vertex,
    relay: Relay,
    voyage: Voyage,
};
