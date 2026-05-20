import type { ComponentDoc } from "./types";
import { MoodMeter } from "@particle-academy/react-fancy";

export const moodMeterDoc: ComponentDoc = {
    intro: (
        <p>
            A 2D slider that captures a <em>value</em> on the x-axis and a <em>confidence</em>
            on the y-axis. Drag the handle anywhere in the pad — handy for forecasts, votes,
            pricing intuition, agent confidence overlays. Supports a "posted" ghost handle to
            show another participant's pick.
        </p>
    ),
    examples: [
        {
            name: "Default",
            description: "0–100 value, 0–1 confidence.",
            render: () => (
                <MoodMeter min={0} max={100} value={62} confidence={0.7} onChange={() => {}} />
            ),
            code: `const [value, setValue] = useState(50);
const [confidence, setConfidence] = useState(0.5);

<MoodMeter
    min={0}
    max={100}
    value={value}
    confidence={confidence}
    onChange={(v, c) => { setValue(v); setConfidence(c); }}
/>`,
        },
        {
            name: "Posted ghost",
            description: "Pass `posted` to show another participant's pick as a dashed handle. Pair with `postedColor`.",
            render: () => (
                <MoodMeter
                    min={0}
                    max={100}
                    value={62}
                    confidence={0.7}
                    onChange={() => {}}
                    posted={{ value: 78, confidence: 0.4 }}
                />
            ),
            code: `<MoodMeter
    min={0}
    max={100}
    value={mine.value}
    confidence={mine.confidence}
    onChange={updateMine}
    posted={{ value: agent.value, confidence: agent.confidence }}
    postedColor="#a855f7"
/>`,
        },
        {
            name: "Custom labels",
            description: "Format the value display with `prefix`, `suffix`, or a `formatValue` function.",
            render: () => (
                <div className="flex flex-wrap gap-6">
                    <MoodMeter min={0} max={500} value={120} confidence={0.6} onChange={() => {}} prefix="$" suffix="k" width={240} height={180} />
                    <MoodMeter
                        min={0}
                        max={100}
                        value={42}
                        confidence={0.5}
                        onChange={() => {}}
                        formatValue={(v) => `${v.toFixed(1)}%`}
                        width={240}
                        height={180}
                    />
                </div>
            ),
            code: `<MoodMeter prefix="$" suffix="k" value={value} confidence={c} onChange={set} />
<MoodMeter
    formatValue={(v) => \`\${v.toFixed(1)}%\`}
    value={value}
    confidence={c}
    onChange={set}
/>`,
        },
    ],
    props: [
        { name: "min", type: `number`, default: "—", description: "X-axis (value) minimum. Required." },
        { name: "max", type: `number`, default: "—", description: "X-axis (value) maximum. Required." },
        { name: "step", type: `number`, default: `(max-min)/100`, description: "Step for value snapping." },
        { name: "value", type: `number`, default: "—", description: "Controlled x-axis value. Required." },
        { name: "confidence", type: `number`, default: "—", description: "Controlled y-axis confidence (0..1). Required." },
        { name: "onChange", type: `(value, confidence) => void`, default: "—", description: "Called as the user drags. Required." },
        { name: "posted", type: `{ value: number; confidence: number }`, default: "—", description: "Render a dashed ghost handle for another participant's pick." },
        { name: "width", type: `number`, default: `320`, description: "Pixel width of the pad." },
        { name: "height", type: `number`, default: `220`, description: "Pixel height of the pad." },
        { name: "showGrid", type: `boolean`, default: `true`, description: "Show the grid + axis labels." },
        { name: "color", type: `string`, default: `"#0ea5e9"`, description: "Color of the user handle." },
        { name: "postedColor", type: `string`, default: `"#a855f7"`, description: "Color of the posted-ghost handle." },
        { name: "prefix", type: `string`, default: "—", description: "Prefix on the value label (e.g. `\"$\"`)." },
        { name: "suffix", type: `string`, default: "—", description: "Suffix on the value label (e.g. `\"%\"`, `\"k\"`)." },
        { name: "formatValue", type: `(v: number) => string`, default: "—", description: "Custom value formatter. Overrides prefix / suffix." },
    ],
};
