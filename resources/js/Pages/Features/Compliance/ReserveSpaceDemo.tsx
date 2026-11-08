import { useEffect, useState } from "react";
import { Button, StatList, Text } from "@particle-academy/react-fancy";
import { CONSENT_BANNER_SPACE_VARS, ConsentBanner, ConsentProvider } from "@particle-academy/fancy-compliance-ui";
import { decide, initialConsentState, type ConsentDemoState } from "./ledger";

/** What the banner has published right now, read off the live document. */
function readSpace(): { variable: string; padding: string } {
    if (typeof document === "undefined") {
        return { variable: "", padding: "" };
    }
    return {
        variable: document.documentElement.style.getPropertyValue(CONSENT_BANNER_SPACE_VARS.bottom).trim(),
        padding: getComputedStyle(document.body).paddingBottom,
    };
}

/**
 * The real ConsentBanner fixed to the bottom of the viewport with
 * `reserveSpace`, in its own provider. While it shows, it publishes its height
 * as `--fancy-consent-banner-h` on `<html>` and pads `<body>` by it; when it
 * goes, both are removed. The readout is measured from the live document.
 */
export function ReserveSpaceDemo() {
    const [shown, setShown] = useState(false);
    const [state, setState] = useState<ConsentDemoState>(initialConsentState);
    // Empty on the server AND on the first client render, so hydration matches;
    // the effect below reads the live document.
    const [space, setSpace] = useState({ variable: "", padding: "" });

    useEffect(() => {
        const update = () => setSpace(readSpace());
        update();
        const observer = new MutationObserver(update);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ["style"] });
        observer.observe(document.body, { attributes: true, attributeFilter: ["style"] });
        return () => observer.disconnect();
    }, []);

    const open = () => {
        setState(initialConsentState());
        setShown(true);
    };

    return (
        <div className="cmp-reserve" data-cmp-demo="reserve">
            <div className="cmp-reserve__actions">
                <Button icon="panel-bottom" onClick={open} disabled={shown && state.snapshot.needsConsent}>
                    Show a fixed bar with reserveSpace
                </Button>
                {shown && (
                    <Button variant="ghost" icon="x" onClick={() => setShown(false)}>
                        Remove it
                    </Button>
                )}
            </div>
            <StatList
                align="left"
                items={[
                    { key: "var", value: space.variable || "not set", label: "--fancy-consent-banner-h on <html>" },
                    { key: "pad", value: space.padding || "not measured yet", label: "padding-bottom of <body>" },
                ]}
            />
            <Text as="p" size="sm" color="muted">
                Scroll to the foot of the page while the bar shows: the footer stays reachable above it. Decide in the bar, or
                remove it, and both values go back.
            </Text>
            {shown && (
                <ConsentProvider
                    value={state.snapshot}
                    onDecide={(d) => setState((s) => decide(s, d.granted, d.source, new Date().toISOString()))}
                    onWithdraw={() => undefined}
                >
                    <ConsentBanner variant="bar" position="bottom" reserveSpace />
                </ConsentProvider>
            )}
        </div>
    );
}
