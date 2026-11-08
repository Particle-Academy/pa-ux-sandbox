import { useEffect, useState } from "react";
import { Badge, Button, Input, Modal, Text } from "@particle-academy/react-fancy";

/** How the focused element names itself, from the live DOM. */
function describeFocus(el: Element | null): string {
    if (!el || el === document.body) {
        return "the page (nothing focused)";
    }
    const label =
        el.getAttribute("aria-label") ??
        (el instanceof HTMLInputElement ? (el.labels?.[0]?.textContent ?? el.placeholder) : null) ??
        el.textContent;
    const name = (label ?? "").replace(/\s+/g, " ").trim().slice(0, 48);
    const role = el.getAttribute("role") ?? el.tagName.toLowerCase();
    return name ? `${role} "${name}"` : role;
}

/**
 * Real react-fancy Buttons and a Modal. Tab through them: the ring shows on
 * keyboard focus only (:focus-visible). Open the dialog: focus moves in, Tab
 * stays inside, Escape closes, and focus goes back to the button that opened
 * it. The readout is document.activeElement, read on every focus change.
 */
export function FocusDemo() {
    const [open, setOpen] = useState(false);
    const [focused, setFocused] = useState("the page (nothing focused)");
    const [returned, setReturned] = useState<boolean | null>(null);

    useEffect(() => {
        const update = () => setFocused(describeFocus(document.activeElement));
        document.addEventListener("focusin", update);
        document.addEventListener("focusout", update);
        return () => {
            document.removeEventListener("focusin", update);
            document.removeEventListener("focusout", update);
        };
    }, []);

    const close = () => {
        setOpen(false);
        // The trap restores focus once the panel unmounts; check where it landed.
        window.setTimeout(() => setReturned(document.activeElement?.id === "a11y-focus-open"), 400);
    };

    return (
        <div className="a11y-focus" data-a11y-demo="focus">
            <div className="a11y-focus__row">
                <Button icon="bold">Bold</Button>
                <Button icon="italic">Italic</Button>
                <Button id="a11y-focus-open" icon="square-arrow-out-up-right" onClick={() => { setReturned(null); setOpen(true); }}>
                    Open a dialog
                </Button>
            </div>
            <div className="a11y-readout" aria-live="off">
                <Text as="span" size="sm" color="muted">
                    Focus is on
                </Text>
                <Text as="span" size="sm" weight="semibold" data-a11y-focused="">
                    {focused}
                </Text>
                {returned !== null && (
                    <Badge color={returned ? "green" : "red"} variant="soft">
                        {returned ? "focus returned to the trigger" : "focus did not return"}
                    </Badge>
                )}
            </div>

            <Modal open={open} onClose={close} size="sm">
                <Modal.Header>A trapped dialog</Modal.Header>
                <Modal.Body>
                    <Text as="p" size="sm" color="muted">
                        Tab and Shift+Tab stay inside. Escape closes.
                    </Text>
                    <div className="a11y-focus__dialog">
                        <Input label="Name" />
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="ghost" onClick={close}>
                        Cancel
                    </Button>
                    <Button onClick={close}>Save</Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}
