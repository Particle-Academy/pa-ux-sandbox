import { useRef, useState } from "react";
import { Badge, Button, Heading, Text } from "@particle-academy/react-fancy";
import { ConsentBanner, ConsentProvider } from "@particle-academy/fancy-compliance-ui";
import { createDomNavigationAgent, type DomNavigationAgent } from "@particle-academy/agent-integrations/dom-navigation";
import { decide, initialConsentState, type ConsentDemoState } from "./ledger";

/** The handle the "agent" guesses for the banner's Accept all button. */
export const FENCE_ACCEPT_HANDLE = "cmp-fence-accept-all";
/** An ordinary page button outside the fence, addressed by its id. */
export const FENCE_NEWSLETTER_HANDLE = "cmp-fence-newsletter";

type Attempt = { n: number; ask: string; ok: boolean; detail: string };

/**
 * agent-integrations' real in-page agent (`createDomNavigationAgent`, the
 * walker the navigation bridge drives) acting on this page, next to the real
 * ConsentBanner. The banner carries `data-agent-off-limits="consent"`, so from
 * 0.58.0 the agent is refused there and only there.
 *
 * The agent is never shown a handle inside the fence, so the demo tags the
 * live Accept all button with one first, the way a hostile agent would guess
 * an id. The rule is checked against the live element at action time, so the
 * guessed handle is refused the same way.
 */
export function AgentFenceDemo() {
    const root = useRef<HTMLDivElement>(null);
    const agent = useRef<DomNavigationAgent | null>(null);
    const [state, setState] = useState<ConsentDemoState>(initialConsentState);
    const [subscribed, setSubscribed] = useState(false);
    const [attempts, setAttempts] = useState<Attempt[]>([]);
    const [areas, setAreas] = useState<string[] | null>(null);

    const getAgent = (): DomNavigationAgent => (agent.current ??= createDomNavigationAgent());
    const log = (ask: string, ok: boolean, detail: string) =>
        setAttempts((list) => [{ n: list.length + 1, ask, ok, detail }, ...list].slice(0, 6));

    const tagAcceptButton = (): boolean => {
        const button = root.current?.querySelector('[data-fancy-compliance-action="accept-all"]');
        button?.setAttribute("data-co-handle", FENCE_ACCEPT_HANDLE);
        return button !== null && button !== undefined;
    };

    const describe = () => {
        const snapshot = getAgent().describe();
        const listed = (snapshot.offLimits ?? []).map((a) => (a.purpose ? `${a.purpose} ${a.role}` : a.role));
        setAreas(listed);
        const sees = snapshot.actions.some((a) => a.handle === FENCE_ACCEPT_HANDLE || a.label.trim().toLowerCase() === "accept all");
        log("Describe the page", true, `${snapshot.actions.length} actions listed. Accept all is ${sees ? "listed" : "not among them"}.`);
    };

    const clickAccept = () => {
        if (!tagAcceptButton()) {
            log("Click Accept all", false, "There is no banner to click: reset the demo first.");
            return;
        }
        const result = getAgent().click(FENCE_ACCEPT_HANDLE);
        log("Click Accept all", result.ok, result.ok ? "The click went through." : (result.error ?? "Refused."));
    };

    const clickSubscribe = () => {
        const result = getAgent().click(FENCE_NEWSLETTER_HANDLE);
        log("Click Subscribe", result.ok, result.ok ? "Done: the agent may use the rest of the page." : (result.error ?? "Refused."));
    };

    return (
        <div ref={root} className="cmp-fence" data-cmp-demo="fence">
            <div className="cmp-fence__page">
                <ConsentProvider
                    value={state.snapshot}
                    onDecide={(d) => setState((s) => decide(s, d.granted, d.source, new Date().toISOString()))}
                    onWithdraw={() => undefined}
                >
                    <ConsentBanner variant="corner" className="static! z-auto! shadow-none! max-w-none! sm:max-w-[20rem]!" />
                    {!state.snapshot.needsConsent && (
                        <Text as="p" size="sm" color="muted">
                            You decided, so the banner has gone. The agent never could.
                        </Text>
                    )}
                </ConsentProvider>
                <div className="cmp-fence__newsletter">
                    <Heading as="h3" size="sm" weight="semibold">
                        Newsletter
                    </Heading>
                    <Text as="p" size="sm" color="muted">
                        An ordinary page control, outside the fence.
                    </Text>
                    <Button id={FENCE_NEWSLETTER_HANDLE} icon={subscribed ? "check" : "mail"} onClick={() => setSubscribed((s) => !s)}>
                        {subscribed ? "Subscribed" : "Subscribe"}
                    </Button>
                </div>
            </div>

            <div className="cmp-fence__agent">
                <Heading as="h3" size="sm" weight="semibold">
                    Ask the agent
                </Heading>
                <div className="cmp-fence__asks">
                    <Button icon="scan-eye" onClick={describe}>
                        Describe the page
                    </Button>
                    <Button icon="mouse-pointer-click" onClick={clickAccept}>
                        Click Accept all
                    </Button>
                    <Button icon="mouse-pointer-click" onClick={clickSubscribe}>
                        Click Subscribe
                    </Button>
                    <Button variant="ghost" icon="rotate-ccw" onClick={() => { setState(initialConsentState()); setSubscribed(false); setAttempts([]); setAreas(null); }}>
                        Reset
                    </Button>
                </div>
                {areas !== null && (
                    <Text as="p" size="sm" data-cmp-fence-areas={areas.length}>
                        Off limits to agents on this page: {areas.length === 0 ? "nothing" : areas.join(", ")}.
                    </Text>
                )}
                <ol className="cmp-fence__log" aria-live="polite" data-cmp-fence-log={attempts.length}>
                    {attempts.map((a) => (
                        <li key={a.n} data-cmp-fence-attempt={a.ok ? "ok" : "refused"}>
                            <Badge color={a.ok ? "green" : "red"} variant="soft">
                                {a.ok ? "done" : "refused"}
                            </Badge>
                            <Text as="span" size="sm" weight="semibold">
                                {a.ask}
                            </Text>
                            <Text as="span" size="sm" color="muted">
                                {a.detail}
                            </Text>
                        </li>
                    ))}
                </ol>
            </div>
        </div>
    );
}
