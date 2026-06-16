import type { ComponentDoc } from "./types";
import { ShareControls } from "@particle-academy/agent-integrations";
import { useState } from "react";

function ShareControlsDemo() {
    const [session, setSession] = useState<{ id: string; token: string } | null>(null);
    return (
        <ShareControls
            session={session}
            onStart={() => setSession({ id: "demo-session-abc", token: "tok_xyz" })}
            onStop={() => setSession(null)}
            status={session ? "connected" : undefined}
            shareBaseUrl="https://fancy.app/agent-relay"
        />
    );
}

export const shareControlsDoc: ComponentDoc = {
    intro: (
        <p>
            Start / stop relay sessions and surface the share URL + JSON payload + curl
            recipe for the agent to connect with. Controlled — your code owns the session
            lifecycle; this component just renders the affordances.
        </p>
    ),
    examples: [
        {
            name: "Default",
            description: "Click Start to spin up a session, Stop to tear it down.",
            render: () => <ShareControlsDemo />,
            code: `const [session, setSession] = useState<SessionDescriptor | null>(null);

<ShareControls
    session={session}
    onStart={async () => {
        const descriptor = await startSession();
        setSession(descriptor);
    }}
    onStop={() => {
        stopSession();
        setSession(null);
    }}
    status={isConnected ? "connected" : "waiting"}
    shareBaseUrl="https://my-app.test/agent-relay"
/>`,
        },
        {
            name: "Custom share base URL",
            description: "Use this when the relay lives behind a different domain than the app shell.",
            render: () => (
                <ShareControls
                    session={{ id: "demo", token: "t" } as any}
                    onStart={() => {}}
                    onStop={() => {}}
                    shareBaseUrl="https://relay.example.com/agents"
                />
            ),
            code: `<ShareControls
    session={session}
    onStart={onStart}
    onStop={onStop}
    shareBaseUrl="https://relay.example.com/agents"
/>`,
        },
    ],
    props: [
        { name: "session", type: `SessionDescriptor | null`, default: "—", description: "The active session, or null when not sharing. Required." },
        { name: "onStart", type: `() => void`, default: "—", description: "Called when the user clicks Start. Required." },
        { name: "onStop", type: `() => void`, default: "—", description: "Called when the user clicks Stop. Required." },
        { name: "status", type: `string`, default: "—", description: "Optional connection-state badge text." },
        { name: "shareBaseUrl", type: `string`, default: "—", description: "Override the URL base used in the share URL." },
        { name: "className", type: `string`, default: "—", description: "Extra classes on the wrapper." },
        { name: "style", type: `CSSProperties`, default: "—", description: "Inline styles on the wrapper." },
    ],
};
