import type { ComponentDoc } from "./types";
import { Progress } from "@particle-academy/react-fancy";

export const progressDoc: ComponentDoc = {
    intro: (
        <p>
            Progress indicators — linear bar or circular ring. Determinate (<code>value</code>/<code>max</code>)
            for known progress, <code>indeterminate</code> for unknown durations.
        </p>
    ),
    examples: [
        {
            name: "Bar",
            description: "Default linear bar. Pass `value` and `max`.",
            render: () => (
                <div className="w-full max-w-sm space-y-3">
                    <Progress value={25} />
                    <Progress value={60} />
                    <Progress value={90} />
                </div>
            ),
            code: `<Progress value={25} />
<Progress value={60} />
<Progress value={90} />`,
        },
        {
            name: "Show value",
            description: "Add `showValue` to overlay the percentage.",
            render: () => (
                <div className="w-full max-w-sm space-y-3">
                    <Progress value={42} showValue />
                    <Progress value={78} showValue color="violet" />
                </div>
            ),
            code: `<Progress value={42} showValue />
<Progress value={78} showValue color="violet" />`,
        },
        {
            name: "Sizes",
            description: "Three preset heights.",
            render: () => (
                <div className="w-full max-w-sm space-y-3">
                    <Progress value={60} size="sm" />
                    <Progress value={60} size="md" />
                    <Progress value={60} size="lg" />
                </div>
            ),
            code: `<Progress value={60} size="sm" />
<Progress value={60} size="md" />
<Progress value={60} size="lg" />`,
        },
        {
            name: "Colors",
            description: "Six color presets matching the Fancy palette.",
            render: () => (
                <div className="w-full max-w-sm space-y-2">
                    <Progress value={60} color="blue" />
                    <Progress value={60} color="green" />
                    <Progress value={60} color="amber" />
                    <Progress value={60} color="red" />
                    <Progress value={60} color="violet" />
                    <Progress value={60} color="zinc" />
                </div>
            ),
            code: `<Progress value={60} color="blue" />
<Progress value={60} color="green" />
<Progress value={60} color="amber" />
<Progress value={60} color="red" />
<Progress value={60} color="violet" />
<Progress value={60} color="zinc" />`,
        },
        {
            name: "Circular",
            description: "`variant=\"circular\"` renders a ring. Useful for compact KPI tiles.",
            render: () => (
                <div className="flex items-center gap-4">
                    <Progress variant="circular" value={25} showValue />
                    <Progress variant="circular" value={60} showValue color="violet" />
                    <Progress variant="circular" value={90} showValue color="green" size="lg" />
                </div>
            ),
            code: `<Progress variant="circular" value={25} showValue />
<Progress variant="circular" value={60} showValue color="violet" />
<Progress variant="circular" value={90} showValue color="green" size="lg" />`,
        },
        {
            name: "Indeterminate",
            description: "When you don't know the total, set `indeterminate` for an animated sweep.",
            render: () => (
                <div className="w-full max-w-sm space-y-3">
                    <Progress indeterminate />
                    <Progress indeterminate variant="circular" />
                </div>
            ),
            code: `<Progress indeterminate />
<Progress indeterminate variant="circular" />`,
        },
    ],
    props: [
        { name: "value", type: `number`, default: `0`, description: "Current progress value. Ignored when `indeterminate` is true." },
        { name: "max", type: `number`, default: `100`, description: "Maximum value. The bar/ring fills to `value / max`." },
        { name: "variant", type: `"bar" | "circular"`, default: `"bar"`, description: "Linear bar or circular ring." },
        { name: "size", type: `"sm" | "md" | "lg"`, default: `"md"`, description: "Visual size — height for bars, diameter for circles." },
        { name: "color", type: `"blue" | "green" | "amber" | "red" | "violet" | "zinc"`, default: `"blue"`, description: "Fill color preset." },
        { name: "indeterminate", type: `boolean`, default: `false`, description: "Animated sweep — for unknown durations." },
        { name: "showValue", type: `boolean`, default: `false`, description: "Overlay the percentage (`value / max * 100`)." },
        { name: "className", type: `string`, default: "—", description: "Extra classes on the root wrapper." },
    ],
};
