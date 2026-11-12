import { useState } from "react";
import type { ComponentDoc } from "./types";
import { Button, Field, HotkeyCapture, Text } from "@particle-academy/react-fancy";

function ControlledHotkey() {
    const [combo, setCombo] = useState("ctrl+shift+k");

    return (
        <div className="flex w-full max-w-md flex-col gap-3">
            <Field label="Open the command palette">
                <HotkeyCapture value={combo} onChange={setCombo} label="Command palette shortcut" />
            </Field>
            <div className="flex flex-wrap items-center gap-2">
                <Button size="sm" variant="ghost" onClick={() => setCombo("mod+k")}>Set mod+k from outside</Button>
                <Text size="xs" className="ml-auto">value: "{combo}"</Text>
            </div>
        </div>
    );
}

export const hotkeyCaptureDoc: ComponentDoc = {
    intro: (
        <p>
            Records a keyboard shortcut. Click it (or press Enter or Space), press the keys, and
            the value becomes a normalised string such as <code>"ctrl+shift+k"</code>: modifiers
            in the order ctrl, alt, shift, meta, then one physical key, lower case. A modifier
            alone does not commit; Escape or blur cancels and keeps the previous value. The string
            is JSON-friendly, so an agent can read or set a shortcut without touching the DOM, and
            it is the same string <code>PromptInput</code>'s <code>submitKey</code> accepts.
        </p>
    ),
    examples: [
        {
            name: "Controlled",
            description:
                "value + onChange: the host owns the string. onChange receives the normalised combination on a capture, or \"\" when the clear button is used.",
            render: () => <ControlledHotkey />,
            code: `const [combo, setCombo] = useState("ctrl+shift+k");

<HotkeyCapture value={combo} onChange={setCombo} label="Command palette shortcut" />`,
        },
        {
            name: "Uncontrolled, in a form",
            description:
                "defaultValue starts it; name adds a hidden input so a plain form post carries the value. clearable={false} hides the clear button.",
            render: () => (
                <form className="flex w-full max-w-md flex-col gap-3" onSubmit={(e) => e.preventDefault()}>
                    <HotkeyCapture name="shortcuts[save]" defaultValue="mod+s" clearable={false} label="Save shortcut" />
                    <Button type="submit" size="sm" className="self-start">Save shortcuts</Button>
                </form>
            ),
            code: `<form method="post" action="/settings/shortcuts">
    <HotkeyCapture name="shortcuts[save]" defaultValue="mod+s" clearable={false} />
    <Button type="submit">Save shortcuts</Button>
</form>`,
        },
        {
            name: "Platform, size and disabled",
            description:
                "platform picks the key names shown: on \"apple\" meta reads ⌘ and alt reads Option. Omit it and the platform is detected after mount, which keeps server rendering stable. size sets the keycap size.",
            render: () => (
                <div className="flex w-full max-w-md flex-col gap-3">
                    <HotkeyCapture defaultValue="meta+alt+p" platform="apple" size="md" label="Apple naming" />
                    <HotkeyCapture defaultValue="meta+alt+p" platform="generic" size="xs" label="Generic naming" />
                    <HotkeyCapture defaultValue="ctrl+z" disabled label="Locked shortcut" />
                </div>
            ),
            code: `<HotkeyCapture defaultValue="meta+alt+p" platform="apple" size="md" />
<HotkeyCapture defaultValue="meta+alt+p" platform="generic" size="xs" />
<HotkeyCapture defaultValue="ctrl+z" disabled />`,
        },
        {
            name: "Translated",
            description:
                "labels carries every word it shows or announces, including key cap names, merged over the defaults.",
            render: () => (
                <div className="w-full max-w-md">
                    <HotkeyCapture
                        defaultValue=""
                        labels={{
                            label: "Tastenkürzel",
                            empty: "Nicht gesetzt",
                            prompt: "Tasten drücken…",
                            captured: "Kürzel ist jetzt {combo}",
                            cancelled: "Abgebrochen",
                            cleared: "Kürzel entfernt",
                            clear: "Kürzel entfernen",
                            trigger: "{label}: {combo}",
                            keys: { ctrl: "Strg", shift: "Umschalt", enter: "Eingabe" },
                        }}
                    />
                </div>
            ),
            code: `<HotkeyCapture
    labels={{
        label: "Tastenkürzel",
        empty: "Nicht gesetzt",
        prompt: "Tasten drücken…",
        captured: "Kürzel ist jetzt {combo}",
        keys: { ctrl: "Strg", shift: "Umschalt", enter: "Eingabe" },
    }}
/>`,
        },
    ],
    props: [
        { name: "value", type: `string`, default: "—", description: "The shortcut, normalised (`\"ctrl+shift+k\"`). `\"\"` is unset." },
        { name: "defaultValue", type: `string`, default: "—", description: "Starting value, uncontrolled." },
        { name: "onChange", type: `(value: string) => void`, default: "—", description: "Called with the new string on a capture, or `\"\"` when cleared." },
        { name: "label", type: `string`, default: "labels.label", description: "Accessible name." },
        { name: "clearable", type: `boolean`, default: `true`, description: "Show a clear button while a shortcut is set." },
        { name: "disabled", type: `boolean`, default: `false`, description: "No capture and no clear." },
        { name: "name", type: `string`, default: "—", description: "Form field name; a hidden input carries the value." },
        { name: "platform", type: `"apple" | "generic"`, default: "detected after mount", description: "Which modifier names to show." },
        { name: "size", type: `"xs" | "sm" | "md"`, default: `"sm"`, description: "Keycap size." },
        { name: "labels", type: `HotkeyCaptureLabels`, default: "English", description: "`label`, `empty`, `prompt`, `captured`, `cancelled`, `cleared`, `clear`, `trigger` and `keys`." },
    ],
    notes: (
        <p>
            Handles: <code>data-react-fancy-hotkey-capture</code> on the root, with{" "}
            <code>data-state</code> and <code>data-value</code>, plus <code>-trigger</code>,{" "}
            <code>-clear</code> and <code>-status</code> (the polite live region that announces a
            capture). Helpers <code>parseHotkey</code>, <code>formatHotkey</code> and{" "}
            <code>comboFromEvent</code> convert between the string, a combo object and a keyboard
            event. Also at <code>@particle-academy/react-fancy/hotkey-capture</code>.
        </p>
    ),
};
