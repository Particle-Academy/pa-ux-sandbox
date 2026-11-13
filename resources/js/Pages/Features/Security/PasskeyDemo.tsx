import { useState } from "react";
import { PasskeyManager, PasskeyStatus, type PasskeyManagerState } from "@particle-academy/fancy-passkeys-ui";
import { Text } from "@particle-academy/react-fancy";

/**
 * fancy-passkeys-ui's real PasskeyManager over seeded passkeys. It completes no
 * ceremony here, on purpose: a passkey needs a gesture and a biometric, which
 * only the person at the keyboard can supply. Rename and revoke resolve in
 * local state; a revoke is staged for confirmation first (pendingMode defaults
 * to true), and revoking the last passkey says it locks you out.
 *
 * PasskeyStatus takes plain booleans and runs no detection itself, so this
 * shows a fixed answer rather than probing the visitor's browser.
 */
export function PasskeyDemo() {
    const [state, setState] = useState<PasskeyManagerState>({
        passkeys: [
            {
                id: "pk_1",
                name: "Laptop fingerprint",
                createdAt: "2026-06-02T10:11:00Z",
                lastUsedAt: "2026-11-10T21:04:00Z",
                transports: ["internal", "hybrid"],
                backedUp: true,
                aaguid: "adce0002-35bc-c60a-648b-0b25f1f05503",
                clonedAt: null,
            },
            {
                id: "pk_2",
                name: "Security key",
                createdAt: "2026-03-19T08:40:00Z",
                lastUsedAt: null,
                transports: ["usb", "nfc"],
                backedUp: false,
                aaguid: "cb69481e-8ff7-4039-93ec-0a2729a154a8",
                clonedAt: null,
            },
        ],
        pendingRevoke: null,
        renamingId: null,
        draftName: "",
        status: "idle",
        error: null,
    });

    return (
        <div className="sec-passkeys" data-sec-demo="passkeys">
            <PasskeyStatus supported platformAuthenticator conditionalUi />
            <PasskeyManager
                value={state}
                onChange={setState}
                onRename={async ({ id, name }) =>
                    setState((s) => ({ ...s, passkeys: s.passkeys.map((p) => (p.id === id ? { ...p, name } : p)), renamingId: null }))
                }
                onRevoke={async ({ id }) => setState((s) => ({ ...s, passkeys: s.passkeys.filter((p) => p.id !== id), pendingRevoke: null }))}
                onEnroll={() => undefined}
            />
            <Text as="p" size="xs" color="muted">
                Seeded data. Enrolling opens nothing, because a real ceremony needs a gesture this page cannot fake.
            </Text>
        </div>
    );
}
