import { useEffect, useRef, useState } from "react";
import { Heading, OtpInput, StatList } from "@particle-academy/react-fancy";

type Readout = { first: string; rest: string };

/**
 * The real OtpInput, then what it rendered, read off the DOM: the named group
 * and each cell's `autocomplete`. The first cell's `one-time-code` is what
 * makes iOS and Android offer the code from a text message.
 */
export function OtpDemo() {
    const root = useRef<HTMLDivElement>(null);
    const [code, setCode] = useState("");
    const [readout, setReadout] = useState<Readout>({ first: "", rest: "" });

    useEffect(() => {
        const el = root.current;
        const group = el?.querySelector('[role="group"]');
        const cells = [...(group?.querySelectorAll("input") ?? [])];
        setReadout({
            first: cells[0]?.getAttribute("autocomplete") ?? "",
            rest: [...new Set(cells.slice(1).map((c) => c.getAttribute("autocomplete") ?? ""))].join(", "),
        });
    }, []);

    return (
        <div ref={root} className="a11y-otp" data-a11y-demo="otp">
            <Heading as="h3" size="sm" weight="semibold" id="a11y-otp-heading">
                Enter the code we sent you
            </Heading>
            <OtpInput length={6} value={code} onChange={setCode} aria-labelledby="a11y-otp-heading" />
            <StatList
                align="left"
                items={[
                    { key: "first", value: readout.first || "none", label: "autocomplete, first cell" },
                    { key: "rest", value: readout.rest || "none", label: "autocomplete, other cells" },
                    { key: "value", value: code || "empty", label: "value" },
                ]}
            />
        </div>
    );
}
