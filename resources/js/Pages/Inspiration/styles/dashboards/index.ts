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
import Roster from "./roster";
import Helios from "./helios";
import Northstar from "./northstar";
import Meridian from "./meridian";
import Vitals from "./vitals";
import Still from "./still";
import Amplify from "./amplify";

/**
 * The Dashboards collection's style-mounting registry — twenty fictional apps
 * (user-facing + admin), each a dashboard built to demonstrate the Fancy UI Kit
 * (fancy-echarts EChart + Card + Table + Kanban + Timeline + Progress + …).
 * Same rules as the other collections: STATIC imports (Inertia SSR), each page
 * self-contained with its co-located ./{id}.css.
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
    roster: Roster,
    helios: Helios,
    northstar: Northstar,
    meridian: Meridian,
    vitals: Vitals,
    still: Still,
    amplify: Amplify,
};
