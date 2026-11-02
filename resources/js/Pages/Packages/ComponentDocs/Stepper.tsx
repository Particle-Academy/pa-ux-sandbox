import { useState } from "react";
import type { ComponentDoc } from "./types";
import { Button, Stepper, Text } from "@particle-academy/react-fancy";
import type { StepperStep } from "@particle-academy/react-fancy";

const SETUP_STEPS: StepperStep[] = [
    { id: "install", title: "Install", description: "Add the package", content: <Text size="sm">npm install @particle-academy/react-fancy</Text> },
    { id: "configure", title: "Configure", description: "Point Tailwind at the dist", content: <Text size="sm">Add an @source line for the package to app.css.</Text> },
    { id: "ship", title: "Ship", description: "Build and deploy", content: <Text size="sm">Run npm run build and deploy.</Text> },
];

const CHECKOUT_STEPS: StepperStep[] = [
    { id: "cart", title: "Cart" },
    { id: "shipping", title: "Shipping" },
    { id: "payment", title: "Payment", state: "error", description: "Card declined" },
    { id: "review", title: "Review" },
];

function ClickableStepperExample() {
    const [current, setCurrent] = useState(1);

    return (
        <div className="flex w-full flex-col gap-3" data-demo="stepper-clickable">
            <Stepper
                steps={[
                    { id: "account", title: "Account", content: <Text size="sm">Name and email.</Text> },
                    { id: "workspace", title: "Workspace", content: <Text size="sm">Pick a workspace name.</Text> },
                    { id: "invite", title: "Invite", content: <Text size="sm">Invite your team.</Text> },
                    { id: "billing", title: "Billing", disabled: true, content: <Text size="sm">Available after invites.</Text> },
                ]}
                current={current}
                onChange={setCurrent}
                clickable
                showContent="current"
            />
            <div className="flex gap-2">
                <Button size="sm" variant="ghost" onClick={() => setCurrent((i) => Math.max(0, i - 1))} disabled={current === 0}>
                    Back
                </Button>
                {/* Billing is disabled, so Next stops at Invite. */}
                <Button size="sm" onClick={() => setCurrent((i) => Math.min(2, i + 1))} disabled={current >= 2}>
                    Next
                </Button>
            </div>
        </div>
    );
}

export const stepperDoc: ComponentDoc = {
    intro: (
        <p>
            Ordered steps, each <code>upcoming</code>, <code>current</code>, <code>complete</code> or
            <code>error</code>. Pass a JSON-friendly <code>steps</code> array, or compose
            <code>Stepper.Step</code> children; both render the same. It is pure content by default, with
            no buttons at all. <code>clickable</code> turns each step header into a button.
        </p>
    ),
    examples: [
        {
            name: "Vertical (default)",
            description: "Steps before `current` are complete, the one at `current` is current, the rest are upcoming. Every step's content shows.",
            render: () => (
                <div className="w-full" data-demo="stepper-vertical">
                    <Stepper steps={SETUP_STEPS} defaultCurrent={1} />
                </div>
            ),
            code: `const steps = [
    { id: "install", title: "Install", description: "Add the package", content: "npm install @particle-academy/react-fancy" },
    { id: "configure", title: "Configure", description: "Point Tailwind at the dist", content: "Add an @source line to app.css." },
    { id: "ship", title: "Ship", description: "Build and deploy", content: "Run npm run build and deploy." },
];

<Stepper steps={steps} defaultCurrent={1} />`,
        },
        {
            name: "Horizontal, with an error step",
            description: "`orientation=\"horizontal\"` suits short titles. A step's own `state` overrides the derived one, which is how `error` is shown.",
            render: () => (
                <div className="w-full" data-demo="stepper-horizontal">
                    <Stepper steps={CHECKOUT_STEPS} current={2} orientation="horizontal" />
                </div>
            ),
            code: `<Stepper
    orientation="horizontal"
    current={2}
    steps={[
        { id: "cart", title: "Cart" },
        { id: "shipping", title: "Shipping" },
        { id: "payment", title: "Payment", state: "error", description: "Card declined" },
        { id: "review", title: "Review" },
    ]}
/>`,
        },
        {
            name: "Clickable, controlled",
            description: "`clickable` renders each header as a button that calls `onChange`; arrow keys, Home and End move focus between them. A `disabled` step cannot be chosen. `showContent=\"current\"` shows only the current step's body.",
            render: () => <ClickableStepperExample />,
            code: `const [current, setCurrent] = useState(1);

<Stepper
    steps={steps}
    current={current}
    onChange={setCurrent}
    clickable
    showContent="current"
/>`,
        },
        {
            name: "Compound (Stepper.Step)",
            description: "The same component written as children. `stateLabels` translates the screen-reader words for each state.",
            render: () => (
                <div className="w-full" data-demo="stepper-compound">
                    <Stepper defaultCurrent={1} stateLabels={{ complete: "Terminé", current: "En cours", upcoming: "À venir" }}>
                        <Stepper.Step id="draft" title="Draft">Write the first version.</Stepper.Step>
                        <Stepper.Step id="review" title="Review">A teammate reads it.</Stepper.Step>
                        <Stepper.Step id="publish" title="Publish">It goes live.</Stepper.Step>
                    </Stepper>
                </div>
            ),
            code: `<Stepper defaultCurrent={1} stateLabels={{ complete: "Terminé", current: "En cours", upcoming: "À venir" }}>
    <Stepper.Step id="draft" title="Draft">Write the first version.</Stepper.Step>
    <Stepper.Step id="review" title="Review">A teammate reads it.</Stepper.Step>
    <Stepper.Step id="publish" title="Publish">It goes live.</Stepper.Step>
</Stepper>`,
        },
    ],
    props: [
        { name: "steps", type: `StepperStep[]`, default: "—", description: "The steps as data: `id`, `title`, `description`, `content`, `state`, `disabled`. Wins over `children`." },
        { name: "children", type: `ReactNode`, default: "—", description: "`Stepper.Step` elements, read as data. Ignored when `steps` is given." },
        { name: "current", type: `number`, default: "—", description: "Controlled index of the current step. `steps.length` means all complete." },
        { name: "defaultCurrent", type: `number`, default: `0`, description: "Uncontrolled starting index." },
        { name: "onChange", type: `(index: number) => void`, default: "—", description: "Called with the chosen step's index. Only fires when `clickable`." },
        { name: "orientation", type: `"vertical" | "horizontal"`, default: `"vertical"`, description: "Layout direction. Horizontal suits short content." },
        { name: "clickable", type: `boolean`, default: `false`, description: "Render each step header as a button that makes it current." },
        { name: "showContent", type: `"all" | "current"`, default: `"all"`, description: "Show every step's content, or only the current step's." },
        { name: "stateLabels", type: `Partial<Record<StepperStepState, string>>`, default: "English", description: "Screen-reader words for each state." },
    ],
    notes: (
        <p className="text-xs text-zinc-600 dark:text-zinc-300">
            The current step carries <code>aria-current="step"</code>. Each state is in visually hidden text and in
            the indicator's glyph, never colour alone. Handles: <code>data-react-fancy-stepper</code> and
            <code>data-react-fancy-stepper-step</code> with <code>data-state</code>, <code>data-index</code> and
            <code>data-step-id</code>. Step fields: <code>id</code>, <code>title</code>, <code>description</code>,
            <code>content</code>, <code>state</code>, <code>disabled</code>.
        </p>
    ),
};
