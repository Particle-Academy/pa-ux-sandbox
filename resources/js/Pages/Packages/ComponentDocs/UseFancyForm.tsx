import type { ComponentDoc } from "./types";
import { Text } from "@particle-academy/react-fancy";

export const useFancyFormDoc: ComponentDoc = {
    intro: (
        <p>
            Bridge between Inertia's <code>useForm()</code> and react-fancy's input family.
            Wraps an Inertia form and exposes a <code>field(name)</code> helper that returns
            <code>{`{ value, onChange, error, loading, name }`}</code> — ready to spread into
            any Fancy input (Input, Select, Switch, Textarea, MultiSwitch, …). Same Inertia
            method-calling surface (<code>post</code>, <code>put</code>, <code>patch</code>,{" "}
            <code>delete</code>, <code>submit</code>) is forwarded through.
        </p>
    ),
    examples: [
        {
            name: "Field spread",
            description: "Spread `field(name)` into any input — the bridge handles event-vs-value semantics.",
            render: () => (
                <Text size="sm" className="!text-zinc-500">
                    Inertia's <code>useForm()</code> only speaks native DOM events. <code>useFancyForm()</code> adapts so Select / Switch / MultiSwitch (which emit raw values) work too.
                </Text>
            ),
            code: `import { useFancyForm } from "@particle-academy/fancy-inertia";
import { Input, Select, Switch, Action } from "@particle-academy/react-fancy";

function ProfileForm() {
    const form = useFancyForm({ name: "", email: "", plan: "free", marketing: false });

    return (
        <form onSubmit={(e) => { e.preventDefault(); form.post("/profile"); }}>
            <Input label="Name" {...form.field("name")} required />
            <Input label="Email" type="email" {...form.field("email")} required />
            <Select label="Plan" {...form.field("plan")} list={[
                { value: "free", label: "Free" },
                { value: "pro", label: "Pro" },
            ]} />
            <Switch {...form.field("marketing")} label="Marketing emails" />
            <Action type="submit" loading={form.processing}>Save</Action>
        </form>
    );
}`,
        },
        {
            name: "Server-validation errors",
            description: "Inertia errors flow into `field().error` automatically — no manual mapping.",
            render: () => (
                <Text size="sm" className="!text-zinc-500">
                    Each Fancy input reads <code>error</code> directly, so server-side validation messages render under the right field.
                </Text>
            ),
            code: `// On the server (Laravel):
$request->validate([
    'email' => 'required|email|unique:users,email',
]);

// On the client — no extra wiring needed:
<Input {...form.field("email")} />
// If 'email' fails server-side, form.field("email").error fills automatically.`,
        },
        {
            name: "Reset + clearErrors",
            render: () => (
                <Text size="sm" className="!text-zinc-500">
                    Forwarded from Inertia's useForm. Pair with a Cancel button or a successful submit.
                </Text>
            ),
            code: `<Action variant="ghost" onClick={() => form.reset()}>
    Cancel
</Action>

form.post("/profile", {
    onSuccess: () => form.reset("password"),
});`,
        },
    ],
    props: [
        { name: "useFancyForm(initial)", type: `<T>(initial: T) => FancyFormBridge<T>`, default: "—", description: "Hook signature. Pass the initial form data." },
        { name: "→ data", type: `T`, default: "—", description: "Current form data." },
        { name: "→ setData", type: `<K>(key, value) => void`, default: "—", description: "Direct setter — bypass `field()` when you need to programmatically set a value." },
        { name: "→ errors", type: `Partial<Record<keyof T, string>>`, default: "—", description: "Server-side validation errors keyed by field name." },
        { name: "→ processing", type: `boolean`, default: "—", description: "True while a submit is in flight." },
        { name: "→ field(name)", type: `(name) => FancyFieldBridge`, default: "—", description: "Returns `{ value, onChange, error, loading, name }`. Spread into any Fancy input." },
        { name: "→ post / put / patch / delete / submit", type: `(url, options?) => void`, default: "—", description: "Inertia's request helpers, forwarded through." },
        { name: "→ reset", type: `(...fields) => void`, default: "—", description: "Reset the listed fields (or all when called with no args)." },
        { name: "→ clearErrors", type: `(...fields) => void`, default: "—", description: "Clear errors for the listed fields (or all)." },
    ],
    notes: (
        <p className="text-xs text-zinc-600 dark:text-zinc-300">
            <strong>FancyFieldBridge.onChange:</strong> accepts both a React change event
            (for <code>Input</code>, <code>Textarea</code>) and a raw value (for{" "}
            <code>Select</code>, <code>Switch</code>, <code>MultiSwitch</code>) — the bridge
            sniffs the type and unwraps the event automatically.
        </p>
    ),
};
