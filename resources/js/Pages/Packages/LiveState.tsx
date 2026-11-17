import { Accordion, CodeBlock } from "@particle-academy/react-fancy";

/**
 * A component's controlled state, shown on its docs page.
 *
 * On a /packages page the state IS the point (it is what an agent reads and
 * writes through a bridge), so it is shown, but collapsed by default and as
 * pretty-printed JSON in a code block, never as a wrapped monospace one-liner.
 * Feature micro-sites (/features/*) show no state dumps at all; a test fails if
 * one does.
 */
export function LiveState({
    value,
    label = "Live state",
    demo,
    replacer,
}: {
    value: unknown;
    label?: string;
    /** Stable handle for the panel, as `data-demo`. */
    demo?: string;
    replacer?: (key: string, value: unknown) => unknown;
}) {
    const json = value === undefined ? "undefined" : JSON.stringify(value, replacer, 2);
    return (
        <div data-live-state="" className="w-full">
            <Accordion type="single" defaultValue={null} className="w-full">
                <Accordion.Item value="state">
                    <Accordion.Trigger>{label}</Accordion.Trigger>
                    <Accordion.Content>
                        <div data-demo={demo} data-live-state-json="">
                            <CodeBlock code={json} language="json" />
                        </div>
                    </Accordion.Content>
                </Accordion.Item>
            </Accordion>
        </div>
    );
}
