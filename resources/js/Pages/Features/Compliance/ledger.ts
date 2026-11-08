import type { ConsentSnapshot, ConsentSource } from "@particle-academy/fancy-compliance-ui";
import { CONSENT_UNDECIDED } from "../../Packages/complianceFunLabFixtures";

/*
 * The consent demo's local state: the snapshot ConsentProvider is fed, and the
 * rows fancy-compliance would append to its ledger for the same decisions.
 *
 * Nothing here is posted. A decision made in a demo is not the visitor's
 * consent to this site, so the demo keeps its own state and the site's real
 * banner (in the root layout) is untouched. The row shape mirrors the
 * package's `fancy_compliance_consents` columns (action, granted, refused,
 * policy_version, source), as its README documents them; no IP address and
 * no user agent, because the package stores neither.
 */

export type LedgerRow = {
    /** 1-based, in the order the rows were appended. */
    n: number;
    action: "decision" | "withdrawal";
    granted: string[];
    refused: string[];
    policyVersion: string;
    source: ConsentSource;
};

export type ConsentDemoState = {
    snapshot: ConsentSnapshot;
    ledger: LedgerRow[];
    /** The policy version counter, so a new version is always new. */
    version: number;
};

const NECESSARY = "necessary";

function optionalKeys(snapshot: ConsentSnapshot): string[] {
    return snapshot.categories.filter((c) => !c.required).map((c) => c.key);
}

function policyName(version: number): string {
    return `demo-${version}`;
}

/** A first visit: nothing decided, the banner shows, nothing is recorded. */
export function initialConsentState(): ConsentDemoState {
    return { snapshot: { ...CONSENT_UNDECIDED, policyVersion: policyName(1) }, ledger: [], version: 1 };
}

function withRecord(state: ConsentDemoState, action: LedgerRow["action"], grantedOptional: string[], source: ConsentSource, decidedAt: string): ConsentDemoState {
    const optional = optionalKeys(state.snapshot);
    const kept = optional.filter((k) => grantedOptional.includes(k));
    const granted = [NECESSARY, ...kept];
    const refused = optional.filter((k) => !kept.includes(k));
    const policyVersion = state.snapshot.policyVersion;

    return {
        ...state,
        snapshot: {
            ...state.snapshot,
            needsConsent: false,
            consent: { granted, refused, policyVersion, decidedAt, source, current: true },
        },
        ledger: [...state.ledger, { n: state.ledger.length + 1, action, granted, refused, policyVersion, source }],
    };
}

/**
 * A decision: the optional categories accepted. Every other optional category
 * is refused, and `necessary` is always granted, as the server records it.
 */
export function decide(state: ConsentDemoState, granted: string[], source: ConsentSource, decidedAt: string): ConsentDemoState {
    return withRecord(state, "decision", granted, source, decidedAt);
}

/**
 * A withdrawal of these categories (every optional one when null). It is a NEW
 * row, never an edit of the old one: the ledger is append-only.
 */
export function withdraw(state: ConsentDemoState, categories: string[] | null, source: ConsentSource, decidedAt: string): ConsentDemoState {
    const before = state.snapshot.consent?.current ? state.snapshot.consent.granted : [];
    const remaining = before.filter((k) => k !== NECESSARY && categories !== null && !categories.includes(k));

    return withRecord(state, "withdrawal", remaining, source, decidedAt);
}

/**
 * A new policy version. Every earlier decision stops being current, so the
 * banner shows again and only `necessary` is allowed until the person decides.
 * The ledger keeps its rows.
 */
export function publishNewPolicy(state: ConsentDemoState): ConsentDemoState {
    const version = state.version + 1;
    const consent = state.snapshot.consent ? { ...state.snapshot.consent, current: false } : null;

    return {
        ...state,
        version,
        snapshot: { ...state.snapshot, policyVersion: policyName(version), consent, needsConsent: true },
    };
}
