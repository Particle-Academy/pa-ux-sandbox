/**
 * One connector as `App\Support\Registry\ConnectorCatalogue` sends it, built
 * from the served connector index. Nothing here is typed by hand.
 */

/** A setup step, exactly as `ConnectorSource::setupFor()` shapes it. */
export type ConnectorSetupStep = {
    title: string;
    detail: string;
    url: string | null;
    actor: "person" | "agent" | null;
    prompt: string | null;
    copy: { label: string; value: string }[] | null;
    fields: string[] | null;
    done: string | null;
};

export type ConnectorPackage = {
    name: string;
    version: string;
    registry: string;
    installFirst: boolean;
    /** The package's page on its registry, at the indexed version where the registry has one. */
    url: string | null;
};

export type ConnectorOperation = {
    kind: string;
    title: string;
    role: "trigger" | "action" | "search";
    /** A trigger's delivery check: `hmac`, `shared-token`, or null (a poll, or an action). */
    verification: string | null;
};

export type ConnectorCredential = {
    key: string;
    label: string;
    secret: boolean;
    optional: boolean;
    help: string | null;
};

export type ConnectorCard = {
    /** The index slug, also the URL segment: `google-sheets`. */
    slug: string;
    /** The underscored service id the node kinds use: `google_sheets`. */
    service: string;
    title: string;
    domain: string;
    summary: string | null;
    status: string | null;
    docs: string | null;
    /** Keyed by registry role: `ui`, `js`, `php`, `py`. */
    packages: Record<string, ConnectorPackage>;
    operations: ConnectorOperation[];
    needsWebhookEndpoint: boolean;
    auth: {
        kind: string | null;
        grant: string | null;
        restrictedScopes: string[] | null;
        authorizeUrl: string | null;
    };
    credentials: ConnectorCredential[];
    /** Null when the connector has no guided steps yet. */
    setup: ConnectorSetupStep[] | null;
    /** `/features/connectors/{slug}/setup`. */
    setupHref: string;
};
