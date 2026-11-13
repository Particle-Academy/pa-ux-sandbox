import { useState } from "react";
import type { ComponentDoc } from "./types";
import { Button, NotificationBell, NotificationInbox, Popover, Text, type NotificationItem } from "@particle-academy/react-fancy";

/** Fixed, so the server render and the hydrated client agree on "5 minutes ago". */
const NOW = Date.parse("2026-11-13T12:00:00Z");

const ITEMS: NotificationItem[] = [
    { id: "n1", title: "Deploy finished", body: "px-ui-sandbox is live.", time: NOW - 5 * 60_000, read: false },
    { id: "n2", title: "Ada mentioned you", body: "Can you review the Security page?", time: NOW - 2 * 3_600_000, read: false },
    { id: "n3", title: "Weekly report ready", time: NOW - 26 * 3_600_000, read: true },
];

function CountingBell() {
    const [count, setCount] = useState(3);
    const [open, setOpen] = useState(false);

    return (
        <div className="flex flex-wrap items-center gap-3">
            <NotificationBell count={count} open={open} onOpenChange={setOpen} />
            <Button size="sm" variant="ghost" onClick={() => setCount((c) => c + 1)}>Add one</Button>
            <Button size="sm" variant="ghost" onClick={() => setCount(0)}>Clear</Button>
            <Text size="xs">open: {String(open)}</Text>
        </div>
    );
}

function BellWithInbox() {
    const [items, setItems] = useState(ITEMS);
    const unread = items.filter((i) => !i.read).length;

    return (
        <Popover placement="bottom-end">
            <Popover.Trigger>
                <NotificationBell count={unread} />
            </Popover.Trigger>
            <Popover.Content className="w-80 p-0">
                <NotificationInbox
                    items={items}
                    now={NOW}
                    locale="en"
                    headingLevel={3}
                    onMarkRead={(id) => setItems((xs) => xs.map((x) => (x.id === id ? { ...x, read: true } : x)))}
                    onMarkAllRead={() => setItems((xs) => xs.map((x) => ({ ...x, read: true })))}
                />
            </Popover.Content>
        </Popover>
    );
}

export const notificationBellDoc: ComponentDoc = {
    intro: (
        <p>
            An icon button with an unread count, built on the kit&apos;s <code>Button</code>. It is
            controlled: <code>count</code> and <code>open</code> are data in, and{" "}
            <code>onOpenChange(!open)</code> is the event out; it never changes either itself. The
            count is drawn in a badge and also said in words, in a polite <code>role=&quot;status&quot;</code>{" "}
            region that describes the button (&quot;3 unread notifications&quot;), so a screen reader
            hears a new notification arrive.
        </p>
    ),
    examples: [
        {
            name: "Controlled count and open state",
            description:
                "count is the unread number; a negative or fractional value is floored at 0. open becomes aria-expanded, and a click calls onOpenChange with the next state.",
            render: () => <CountingBell />,
            code: `const [open, setOpen] = useState(false);

<NotificationBell count={unread} open={open} onOpenChange={setOpen} />`,
        },
        {
            name: "Capped badge",
            description: "Above max (default 99) the badge shows labels.overflow, \"99+\". The words in the status region keep the real number.",
            render: () => (
                <div className="flex items-center gap-3">
                    <NotificationBell count={0} />
                    <NotificationBell count={7} />
                    <NotificationBell count={250} />
                    <NotificationBell count={12} max={9} />
                </div>
            ),
            code: `<NotificationBell count={0} />
<NotificationBell count={250} />          {/* 99+ */}
<NotificationBell count={12} max={9} />   {/* 9+ */}`,
        },
        {
            name: "Opening an inbox",
            description:
                "Leave open unset when a Popover.Trigger or Dropdown.Trigger around the bell owns the state: props and the ref reach the <button>, so the trigger's ARIA and click land on it.",
            render: () => <BellWithInbox />,
            code: `<Popover placement="bottom-end">
    <Popover.Trigger>
        <NotificationBell count={unread} />
    </Popover.Trigger>
    <Popover.Content className="w-80 p-0">
        <NotificationInbox items={items} onMarkRead={markRead} onMarkAllRead={markAllRead} />
    </Popover.Content>
</Popover>`,
        },
        {
            name: "Translated",
            description: "labels: button (its accessible name), unread ({count}), unreadOne, none and overflow ({max}). Each falls back to English on its own.",
            render: () => (
                <NotificationBell
                    count={2}
                    labels={{ button: "Benachrichtigungen", unread: "{count} ungelesene Benachrichtigungen", unreadOne: "1 ungelesene Benachrichtigung", none: "Keine ungelesenen Benachrichtigungen" }}
                />
            ),
            code: `<NotificationBell
    count={2}
    labels={{
        button: "Benachrichtigungen",
        unread: "{count} ungelesene Benachrichtigungen",
        unreadOne: "1 ungelesene Benachrichtigung",
        none: "Keine ungelesenen Benachrichtigungen",
    }}
/>`,
        },
    ],
    props: [
        { name: "count", type: `number`, default: "—", description: "Unread notifications. Floored at 0.", required: true },
        { name: "max", type: `number`, default: `99`, description: "Above this the badge shows `labels.overflow`." },
        { name: "open", type: `boolean`, default: "—", description: "Whether the inbox it opens is open, as `aria-expanded`. Unset: no `aria-expanded`." },
        { name: "onOpenChange", type: `(open: boolean) => void`, default: "—", description: "Called on click with `!open`. It does not change `open` itself." },
        { name: "labels", type: `{ button?, unread?, unreadOne?, none?, overflow? }`, default: "English", description: "Every word, for translation." },
        { name: "…Button props", type: `ButtonProps`, default: "—", description: "Everything else reaches the kit `Button`, except its icon, badge, href and children props." },
    ],
    notes: (
        <p>
            Handles: <code>data-react-fancy-notification-bell</code> (with <code>data-count</code>{" "}
            and <code>data-unread</code>), <code>-count</code> on the badge and <code>-status</code> on
            the live region. The badge is white on red-800, 8:1 or better in both modes. 44 x 44 under
            touch density. Also at <code>@particle-academy/react-fancy/notification-bell</code>.
        </p>
    ),
};
