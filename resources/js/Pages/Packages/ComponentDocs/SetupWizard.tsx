import { useState } from "react";
import type { ComponentDoc } from "./types";
import { SetupWizard, Text } from "@particle-academy/react-fancy";
import type { SetupWizardStep, SetupWizardValue, SetupWizardVerifyResult } from "@particle-academy/react-fancy";

/**
 * A guide for a fictional service, Example Pay, on RFC 2606 hosts only. Every
 * field is plain JSON, which is the point: an agent can write the whole guide.
 */
export const EXAMPLE_PAY_STEPS: SetupWizardStep[] = [
    {
        id: "account",
        title: "Create an Example Pay account",
        detail: "Sign up, then confirm the email Example Pay sends you.",
        url: "https://dashboard.example.com/signup",
        done: "the dashboard greets you by name",
    },
    {
        id: "webhook",
        title: "Add the webhook",
        detail: "In Developers, then Webhooks, add an endpoint with this URL and the payment events.",
        url: "https://dashboard.example.com/developers/webhooks",
        copy: [
            { label: "Webhook URL", value: "{{appUrl}}/webhooks/example-pay" },
            { label: "Events", value: "payment.succeeded, payment.failed" },
        ],
        done: "the endpoint shows as Enabled",
    },
    {
        id: "env",
        title: "Store the keys",
        detail: "Your agent puts the keys in your app's settings, so they never live in code.",
        actor: "agent",
        prompt: "Add EXAMPLE_PAY_KEY and EXAMPLE_PAY_WEBHOOK_SECRET to .env, read them in config/services.php, and verify webhooks posted to {{appUrl}}/webhooks/example-pay with the secret.",
        done: "php artisan config:show services.example_pay lists both keys",
    },
];

export const EXAMPLE_PAY_TOKENS = { appUrl: "https://app.example.com" };

/** Resolves locally after a short pause: no network, so the page works anywhere. */
export function verifyExamplePay(): Promise<SetupWizardVerifyResult> {
    return new Promise((resolve) =>
        setTimeout(
            () =>
                resolve({
                    ok: true,
                    detail: "Connected to Example Pay as acme (test mode).",
                    proves: "Your key can create a payment and your webhook receives it.",
                }),
            600,
        ),
    );
}

function ControlledWizardExample() {
    const [value, setValue] = useState<SetupWizardValue>({ current: 0, done: [] });

    return (
        <div className="flex w-full flex-col gap-3" data-demo="setup-wizard-controlled">
            <SetupWizard
                id="example-pay-setup"
                steps={EXAMPLE_PAY_STEPS}
                value={value}
                onChange={setValue}
                tokens={EXAMPLE_PAY_TOKENS}
                verify={verifyExamplePay}
            />
            <Text size="xs" className="font-mono !text-zinc-500">
                value: {JSON.stringify(value)}
            </Text>
        </div>
    );
}

function FailingCheckExample() {
    const [value, setValue] = useState<SetupWizardValue>({ current: 1, done: [0] });

    return (
        <div className="w-full" data-demo="setup-wizard-failing">
            <SetupWizard
                id="example-pay-failing"
                steps={EXAMPLE_PAY_STEPS.slice(0, 1)}
                value={value}
                onChange={setValue}
                verify={async () => ({ ok: false, detail: "Example Pay answered 401: the key was not accepted." })}
            />
        </div>
    );
}

function TranslatedExample() {
    const [value, setValue] = useState<SetupWizardValue>({ current: 0, done: [] });

    return (
        <div className="w-full" data-demo="setup-wizard-labels">
            <SetupWizard
                id="example-pay-es"
                steps={[
                    {
                        id: "cuenta",
                        title: "Crea una cuenta",
                        detail: "Regístrate y confirma tu correo.",
                        url: "https://dashboard.example.com/signup",
                        done: "el panel te saluda por tu nombre",
                    },
                ]}
                value={value}
                onChange={setValue}
                labels={{
                    person: "Tú",
                    agent: "Tu agente",
                    stepOf: "Paso {current} de {total}",
                    open: "Abrir {host}",
                    doneWhen: "Sabrás que funcionó cuando:",
                    back: "Atrás",
                    finish: "Marcar como hecho",
                }}
            />
        </div>
    );
}

export const setupWizardDoc: ComponentDoc = {
    intro: (
        <>
            <p>
                A guide for setting up a third-party service, written for someone who has never done
                it. Each step says who does it, what to open, what to copy and how to tell it worked,
                and an optional <code>verify</code> ends the guide with a live check. The guide is
                plain JSON (<code>steps</code>), so an agent can write one, and the wizard is fully
                controlled through <code>value</code> / <code>onChange</code>.
            </p>
            <p>
                <strong>The &ldquo;stupid simple&rdquo; bar.</strong> One step is on screen at a time.
                Every step is marked <strong>You</strong> or <strong>Your agent</strong>, so nobody
                wonders whose job it is. Every value the person needs has its own{" "}
                <strong>Copy</strong> button, and an agent step has one prompt to paste. Every step
                that can be checked ends with &ldquo;You&rsquo;ll know it worked when&rdquo;, so the
                person never moves on hoping.
            </p>
        </>
    ),
    examples: [
        {
            name: "Controlled, with tokens and a check",
            description:
                "A person step with an Open link and copy values, an agent step with a prompt, `done` lines on each, `{{appUrl}}` filled from `tokens`, and a `verify` that resolves locally. The value below the wizard is the whole state.",
            render: () => <ControlledWizardExample />,
            code: `const [value, setValue] = useState({ current: 0, done: [] as number[] });

<SetupWizard
    value={value}
    onChange={setValue}
    tokens={{ appUrl: "https://app.example.com" }}
    steps={[
        {
            id: "account",
            title: "Create an Example Pay account",
            detail: "Sign up, then confirm the email Example Pay sends you.",
            url: "https://dashboard.example.com/signup",
            done: "the dashboard greets you by name",
        },
        {
            id: "webhook",
            title: "Add the webhook",
            detail: "In Developers, then Webhooks, add an endpoint with this URL.",
            url: "https://dashboard.example.com/developers/webhooks",
            copy: [
                { label: "Webhook URL", value: "{{appUrl}}/webhooks/example-pay" },
                { label: "Events", value: "payment.succeeded, payment.failed" },
            ],
            done: "the endpoint shows as Enabled",
        },
        {
            id: "env",
            title: "Store the keys",
            detail: "Your agent puts the keys in your app's settings.",
            actor: "agent",
            prompt: "Add EXAMPLE_PAY_KEY to .env and read it in config/services.php.",
            done: "php artisan config:show services.example_pay lists the key",
        },
    ]}
    verify={async () => {
        const res = await fetch("/setup/example-pay/check");
        return res.json(); // { ok, detail, proves? }
    }}
/>`,
        },
        {
            name: "A failing check",
            description:
                "A `verify` that resolves `ok: false` shows \"It isn't working yet\" with its `detail`, and changes nothing in `value`. One that throws reads \"The check could not run. Try again.\"",
            render: () => <FailingCheckExample />,
            code: `<SetupWizard
    steps={steps}
    value={value}
    onChange={setValue}
    verify={async () => ({ ok: false, detail: "Example Pay answered 401: the key was not accepted." })}
/>`,
        },
        {
            name: "Translated labels",
            description:
                "`labels` overrides any visible string. `{current}`, `{total}` and `{host}` are filled where they appear.",
            render: () => <TranslatedExample />,
            code: `<SetupWizard
    steps={pasos}
    value={value}
    onChange={setValue}
    labels={{
        person: "Tú",
        agent: "Tu agente",
        stepOf: "Paso {current} de {total}",
        open: "Abrir {host}",
        doneWhen: "Sabrás que funcionó cuando:",
        back: "Atrás",
        finish: "Marcar como hecho",
    }}
/>`,
        },
    ],
    props: [
        { name: "steps", type: `SetupWizardStep[]`, default: "—", required: true, description: "The steps, in order. Each is `{ title, detail, id?, url?, actor?, prompt?, copy?, done? }`." },
        { name: "value", type: `{ current: number; done: number[] }`, default: "—", required: true, description: "Controlled state. The wizard never moves on its own; `current` is clamped to the steps that exist." },
        { name: "onChange", type: `(next: SetupWizardValue) => void`, default: "—", required: true, description: "Called on Back, Mark done, a jump from the indicator, and a passing check." },
        { name: "tokens", type: `Record<string, string>`, default: "—", description: "Fills `{{name}}` in `detail`, `prompt` and `copy[].value`. Literal replacement, never HTML or evaluation." },
        { name: "verify", type: `() => Promise<{ ok; detail; proves? }>`, default: "—", description: "Adds a final \"Check it works\" step at index `steps.length`." },
        { name: "labels", type: `Partial<SetupWizardLabels>`, default: "English", description: "Override any visible string, for translation." },
        { name: "id", type: `string`, default: "generated", description: "Root id; every interactive element's id derives from it." },
        { name: "className", type: `string`, default: "—", description: "Classes on the root." },
    ],
    notes: (
        <div className="space-y-2 text-xs text-zinc-600 dark:text-zinc-300">
            <p>
                <strong>Links:</strong> a step's <code>url</code> renders as &ldquo;Open &lt;host&gt;&rdquo;
                in a new tab, and only for absolute <code>http:</code> / <code>https:</code> URLs;{" "}
                <code>javascript:</code>, <code>data:</code> and relative paths render no link.
            </p>
            <p>
                <strong>Copy:</strong> uses <code>navigator.clipboard</code> when it exists; otherwise
                the text is selected so the person can copy it by hand, and the button reads
                &ldquo;Selected&rdquo;. Both are announced through a polite live region.
            </p>
            <p>
                <strong>Stable handles:</strong> <code>[data-setup-wizard]</code> (with{" "}
                <code>data-current</code>, <code>data-total</code>), <code>[data-setup-step]</code>,{" "}
                <code>[data-setup-actor]</code>, <code>[data-setup-open]</code>,{" "}
                <code>[data-setup-copy]</code>, <code>[data-setup-copy-prompt]</code>,{" "}
                <code>[data-setup-done]</code>, <code>[data-setup-next]</code>,{" "}
                <code>[data-setup-verify]</code>. Focus moves to the new step's heading on every
                change after the first render.
            </p>
        </div>
    ),
};
