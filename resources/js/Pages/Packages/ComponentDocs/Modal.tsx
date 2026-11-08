import type { ComponentDoc } from "./types";
import { useState } from "react";
import { Button, Heading, Input, Modal, Text } from "@particle-academy/react-fancy";

function ModalDemo({ size, label }: { size?: "sm" | "md" | "lg" | "xl" | "full"; label: string }) {
    const [open, setOpen] = useState(false);
    return (
        <>
            <Button onClick={() => setOpen(true)} data-modal-demo={size ?? "md"}>{label}</Button>
            <Modal open={open} onClose={() => setOpen(false)} size={size}>
                <Modal.Header>
                    <Heading size="md">Modal · {size ?? "md"}</Heading>
                </Modal.Header>
                <Modal.Body>
                    <Text size="sm">
                        Modals are controlled — bind <code>open</code> + <code>onClose</code> to your own state.
                        Escape and backdrop click both invoke <code>onClose</code>.
                    </Text>
                </Modal.Body>
                <Modal.Footer>
                    <div className="flex justify-end gap-2">
                        <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                        <Button color="violet" onClick={() => setOpen(false)}>OK</Button>
                    </div>
                </Modal.Footer>
            </Modal>
        </>
    );
}

/** A translated page: the icon-only close button needs a translated name too. */
function LocalisedCloseDemo() {
    const [open, setOpen] = useState(false);
    return (
        <>
            <Button onClick={() => setOpen(true)}>Ouvrir la fenêtre</Button>
            <Modal open={open} onClose={() => setOpen(false)}>
                <Modal.Header closeLabel="Fermer">
                    <Heading size="md">Confirmer</Heading>
                </Modal.Header>
                <Modal.Body>
                    <Text size="sm">Le bouton de fermeture s&apos;annonce « Fermer », pas « Close ».</Text>
                </Modal.Body>
            </Modal>
        </>
    );
}

/** keepMounted: a half-filled form survives closing the modal. */
function KeepMountedDemo() {
    const [open, setOpen] = useState(false);
    return (
        <>
            <Button onClick={() => setOpen(true)}>Open the draft</Button>
            <Modal open={open} onClose={() => setOpen(false)} keepMounted>
                <Modal.Header>
                    <Heading size="md">Draft</Heading>
                </Modal.Header>
                <Modal.Body>
                    <Text size="sm">Type something, close, reopen: it is still here.</Text>
                    <Input className="mt-3" aria-label="Draft" placeholder="Anything" />
                </Modal.Body>
            </Modal>
        </>
    );
}

export const modalDoc: ComponentDoc = {
    intro: (
        <p>
            Centered overlay dialog. Always controlled — bind <code>open</code> and
            <code>onClose</code> to your component state. Compound: <code>Modal.Header</code>,
            <code>Modal.Body</code>, <code>Modal.Footer</code>. Escape, backdrop click, and the
            close button all call <code>onClose</code>.
        </p>
    ),
    examples: [
        {
            name: "Default (md)",
            render: () => <ModalDemo label="Open default modal" />,
            code: `const [open, setOpen] = useState(false);

<Button onClick={() => setOpen(true)}>Open modal</Button>
<Modal open={open} onClose={() => setOpen(false)}>
    <Modal.Header>
        <Heading size="md">Title</Heading>
    </Modal.Header>
    <Modal.Body>
        <Text size="sm">Body content.</Text>
    </Modal.Body>
    <Modal.Footer>
        <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button color="violet" onClick={() => setOpen(false)}>OK</Button>
        </div>
    </Modal.Footer>
</Modal>`,
        },
        {
            name: "Sizes",
            description: "Five preset widths — sm (~24rem), md (~32rem), lg (~48rem), xl (~64rem), full (viewport).",
            render: () => (
                <div className="flex flex-wrap gap-2">
                    <ModalDemo size="sm" label="sm" />
                    <ModalDemo size="md" label="md" />
                    <ModalDemo size="lg" label="lg" />
                    <ModalDemo size="xl" label="xl" />
                    <ModalDemo size="full" label="full" />
                </div>
            ),
            code: `<Modal size="sm" open={open} onClose={onClose}>…</Modal>
<Modal size="md" open={open} onClose={onClose}>…</Modal>
<Modal size="lg" open={open} onClose={onClose}>…</Modal>
<Modal size="xl" open={open} onClose={onClose}>…</Modal>
<Modal size="full" open={open} onClose={onClose}>…</Modal>`,
        },
        {
            name: "Modal.Header — closeLabel",
            description:
                "The close button is an icon, so its accessible name is a string: \"Close\" by default. Pass your locale's word with closeLabel, or a screen reader announces English in the middle of a translated page.",
            render: () => <LocalisedCloseDemo />,
            code: `<Modal open={open} onClose={() => setOpen(false)}>
    <Modal.Header closeLabel="Fermer">
        <Heading size="md">Confirmer</Heading>
    </Modal.Header>
    <Modal.Body>…</Modal.Body>
</Modal>`,
        },
        {
            name: "keepMounted",
            description:
                "By default a Modal unmounts its children when it closes. keepMounted keeps them in the tree, hidden, inert and aria-hidden, so a half-filled form or a playing <audio> survives close and reopen. Focus trap, scroll lock and Escape still apply only while open.",
            render: () => <KeepMountedDemo />,
            code: `<Modal open={open} onClose={() => setOpen(false)} keepMounted>
    <Modal.Header>
        <Heading size="md">Draft</Heading>
    </Modal.Header>
    <Modal.Body>
        <Input aria-label="Draft" />
    </Modal.Body>
</Modal>`,
        },
    ],
    props: [
        { name: "open", type: `boolean`, default: "—", description: "Controlled open state. Required." },
        { name: "onClose", type: `() => void`, default: "—", description: "Called when Escape, the backdrop, or the close button is pressed. Required." },
        { name: "size", type: `"sm" | "md" | "lg" | "xl" | "full"`, default: `"md"`, description: "Modal width preset. `full` fills the viewport (good for app-like flows)." },
        { name: "keepMounted", type: `boolean`, default: `false`, description: "Keep the children mounted while closed (hidden, inert, aria-hidden), so their state and DOM identity survive close and reopen." },
        { name: "children", type: `ReactNode`, default: "—", description: "Compound parts: `Modal.Header`, `Modal.Body`, `Modal.Footer`." },
        { name: "className", type: `string`, default: "—", description: "Extra classes on the modal panel." },
        { name: "Modal.Header — closeLabel", type: `string`, default: `"Close"`, description: "Accessible name of the close button. Pass your locale's word." },
    ],
    notes: (
        <p className="text-xs text-zinc-600 dark:text-zinc-300">
            <strong>Accessibility:</strong> the panel traps focus while open, returns focus to
            the trigger on close, and labels itself via the <code>Modal.Header</code> content.
            Mount only one modal at a time — opening another while one is open will stack.
        </p>
    ),
};
