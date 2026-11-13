import { useState } from "react";
import { Link } from "@inertiajs/react";
import type { ComponentDoc } from "./types";
import { NotificationInbox, Text, type NotificationItem } from "@particle-academy/react-fancy";

/**
 * A fixed `now`, and a fixed `locale`, on every example. Both default to the
 * render's clock and the runtime's locale, which differ between the SSR
 * process and the browser, and a hydration mismatch would follow.
 */
const NOW = Date.parse("2026-11-13T12:00:00Z");

const SEED: NotificationItem[] = [
    { id: "deploy", title: "Deploy finished", body: "px-ui-sandbox is live on production.", time: NOW - 5 * 60_000, read: false, href: "/packages", actionLabel: "Open packages" },
    { id: "mention", title: "Ada mentioned you", body: "Can you review the Security feature page?", time: NOW - 2 * 3_600_000, read: false, href: "/features" },
    { id: "report", title: "Weekly report ready", time: NOW - 26 * 3_600_000, read: true },
];

function ControlledInbox() {
    const [items, setItems] = useState(SEED);
    const [last, setLast] = useState("nothing yet");

    return (
        <div className="w-full max-w-md space-y-2">
            <NotificationInbox
                items={items}
                now={NOW}
                locale="en"
                onMarkRead={(id) => {
                    setItems((xs) => xs.map((x) => (x.id === id ? { ...x, read: true } : x)));
                    setLast(`onMarkRead("${id}")`);
                }}
                onMarkAllRead={() => {
                    setItems((xs) => xs.map((x) => ({ ...x, read: true })));
                    setLast("onMarkAllRead()");
                }}
                onAction={(id) => setLast(`onAction("${id}")`)}
            />
            <Text size="xs">last event: {last}</Text>
        </div>
    );
}

export const notificationInboxDoc: ComponentDoc = {
    intro: (
        <p>
            A controlled list of JSON notifications. Data in, events out: it calls{" "}
            <code>onMarkRead</code>, <code>onMarkAllRead</code> and <code>onAction</code> and never
            changes read state itself, so the host, or an agent, owns it. Times are relative
            (&quot;5 minutes ago&quot;) through <code>Intl.RelativeTimeFormat</code>, inside a{" "}
            <code>&lt;time&gt;</code> carrying the exact instant. Read and unread are said in words on
            every item, never by colour alone.
        </p>
    ),
    examples: [
        {
            name: "Controlled read state",
            description:
                "items is the list, newest first. A per-item \"Mark as read\" appears only when onMarkRead is given, and the header's \"Mark all as read\" only with onMarkAllRead while anything is unread. onAction fires before an item's link is followed.",
            render: () => <ControlledInbox />,
            code: `const [items, setItems] = useState<NotificationItem[]>(initial);

<NotificationInbox
    items={items}
    onMarkRead={(id) => setItems((xs) => xs.map((x) => (x.id === id ? { ...x, read: true } : x)))}
    onMarkAllRead={() => setItems((xs) => xs.map((x) => ({ ...x, read: true })))}
    onAction={(id) => track("notification_open", id)}
/>`,
        },
        {
            name: "Router links, locale and a fixed clock",
            description:
                "linkComponent renders the action links, so an Inertia, React Router or Next Link navigates client-side. locale picks the relative-time language; now is the moment times are measured from. Pass a fixed now for a deterministic render (and SSR), or one you advance on an interval to keep times current.",
            render: () => (
                <div className="w-full max-w-md">
                    <NotificationInbox items={SEED} now={NOW} locale="fr" linkComponent={Link} headingLevel={3} />
                </div>
            ),
            code: `import { Link } from "@inertiajs/react";

<NotificationInbox items={items} linkComponent={Link} locale="fr" now={now} headingLevel={3} />`,
        },
        {
            name: "Translated, and empty",
            description:
                "labels covers heading, unreadCount ({count}), unread, read, markRead, markReadNamed ({title}), markAllRead, action and empty. With no items the inbox shows labels.empty.",
            render: () => (
                <div className="w-full max-w-md">
                    <NotificationInbox
                        items={[]}
                        now={NOW}
                        locale="es"
                        labels={{ heading: "Notificaciones", empty: "No hay notificaciones" }}
                    />
                </div>
            ),
            code: `<NotificationInbox
    items={[]}
    locale="es"
    labels={{
        heading: "Notificaciones",
        unreadCount: "{count} sin leer",
        markRead: "Marcar como leída",
        markReadNamed: "Marcar como leída: {title}",
        markAllRead: "Marcar todas como leídas",
        empty: "No hay notificaciones",
    }}
/>`,
        },
    ],
    props: [
        { name: "items", type: `NotificationItem[]`, default: "—", description: "`{ id, title, body?, time, read, href?, actionLabel? }`, shown in the order given. `time` is epoch ms, a Date or an ISO string.", required: true },
        { name: "onMarkRead", type: `(id: string) => void`, default: "—", description: "Per unread item. Without it, no per-item button." },
        { name: "onMarkAllRead", type: `() => void`, default: "—", description: "The header's button, while anything is unread. Without it, no such button." },
        { name: "onAction", type: `(id: string) => void`, default: "—", description: "An item's action link was followed (called before navigation)." },
        { name: "linkComponent", type: `ElementType`, default: `"a"`, description: "Renders the action links: a router's `Link` for client-side navigation." },
        { name: "locale", type: `string`, default: "the runtime's", description: "BCP 47 locale for relative times." },
        { name: "now", type: `TimeInput`, default: "render time", description: "The moment relative times are measured from." },
        { name: "headingLevel", type: `2 | 3 | 4 | 5 | 6`, default: `2`, description: "The heading's level, to fit the page outline." },
        { name: "labels", type: `NotificationInboxLabels`, default: "English", description: "Every word, for translation." },
    ],
    notes: (
        <p>
            Live updates are the host&apos;s: feed <code>items</code> from a fancy-query query that an
            Echo event invalidates. <code>formatRelativeTime(time, &#123; now, locale &#125;)</code>, the
            inbox&apos;s helper, is exported too. Handles: <code>data-react-fancy-notification-inbox</code>{" "}
            on the root, <code>-item</code> on each item (its value is the item&apos;s <code>id</code>),
            and <code>-mark-read</code>, <code>-mark-all-read</code>, <code>-action</code>,{" "}
            <code>-time</code>, <code>-state</code> and <code>-empty</code>. Text is 7:1 or better
            at the defaults (WCAG AAA); links and buttons are 44px targets under touch density. Also at{" "}
            <code>@particle-academy/react-fancy/notification-inbox</code>.
        </p>
    ),
};
