import type { ComponentDoc } from "./types";
import { Tabs, Text } from "@particle-academy/react-fancy";

export const tabsDoc: ComponentDoc = {
    intro: (
        <p>
            Tabbed panels. Compound: <code>Tabs</code> wraps a <code>Tabs.List</code> (with
            <code>Tabs.Tab</code> children) and a <code>Tabs.Panels</code> (with
            <code>Tabs.Panel</code> children). Tabs are matched to panels by the <code>value</code> prop.
            Three visual variants.
        </p>
    ),
    examples: [
        {
            name: "Uncontrolled (defaultTab)",
            description: "Pick the initial tab; tabs swap on click without writing state.",
            render: () => (
                <Tabs defaultTab="account" className="w-full">
                    <Tabs.List>
                        <Tabs.Tab value="account">Account</Tabs.Tab>
                        <Tabs.Tab value="billing">Billing</Tabs.Tab>
                        <Tabs.Tab value="team">Team</Tabs.Tab>
                    </Tabs.List>
                    <Tabs.Panels>
                        <Tabs.Panel value="account"><Text>Account settings.</Text></Tabs.Panel>
                        <Tabs.Panel value="billing"><Text>Billing details.</Text></Tabs.Panel>
                        <Tabs.Panel value="team"><Text>Team members.</Text></Tabs.Panel>
                    </Tabs.Panels>
                </Tabs>
            ),
            code: `<Tabs defaultTab="account">
    <Tabs.List>
        <Tabs.Tab value="account">Account</Tabs.Tab>
        <Tabs.Tab value="billing">Billing</Tabs.Tab>
        <Tabs.Tab value="team">Team</Tabs.Tab>
    </Tabs.List>
    <Tabs.Panels>
        <Tabs.Panel value="account">Account settings.</Tabs.Panel>
        <Tabs.Panel value="billing">Billing details.</Tabs.Panel>
        <Tabs.Panel value="team">Team members.</Tabs.Panel>
    </Tabs.Panels>
</Tabs>`,
        },
        {
            name: "Controlled (activeTab + onTabChange)",
            description: "Bind to your own state when the active tab is part of your app state (e.g. URL).",
            render: () => (
                <Tabs activeTab="billing" onTabChange={() => {}} className="w-full">
                    <Tabs.List>
                        <Tabs.Tab value="account">Account</Tabs.Tab>
                        <Tabs.Tab value="billing">Billing</Tabs.Tab>
                        <Tabs.Tab value="team">Team</Tabs.Tab>
                    </Tabs.List>
                    <Tabs.Panels>
                        <Tabs.Panel value="billing"><Text>Active tab is controlled by the parent.</Text></Tabs.Panel>
                    </Tabs.Panels>
                </Tabs>
            ),
            code: `const [active, setActive] = useState("billing");

<Tabs activeTab={active} onTabChange={setActive}>
    <Tabs.List>
        <Tabs.Tab value="account">Account</Tabs.Tab>
        <Tabs.Tab value="billing">Billing</Tabs.Tab>
        <Tabs.Tab value="team">Team</Tabs.Tab>
    </Tabs.List>
    …
</Tabs>`,
        },
        {
            name: "Variants",
            description: "underline (default), pills (rounded background), boxed (segmented).",
            render: () => (
                <div className="w-full space-y-3">
                    <Tabs defaultTab="a" variant="underline">
                        <Tabs.List>
                            <Tabs.Tab value="a">underline</Tabs.Tab>
                            <Tabs.Tab value="b">two</Tabs.Tab>
                        </Tabs.List>
                    </Tabs>
                    <Tabs defaultTab="a" variant="pills">
                        <Tabs.List>
                            <Tabs.Tab value="a">pills</Tabs.Tab>
                            <Tabs.Tab value="b">two</Tabs.Tab>
                        </Tabs.List>
                    </Tabs>
                    <Tabs defaultTab="a" variant="boxed">
                        <Tabs.List>
                            <Tabs.Tab value="a">boxed</Tabs.Tab>
                            <Tabs.Tab value="b">two</Tabs.Tab>
                        </Tabs.List>
                    </Tabs>
                </div>
            ),
            code: `<Tabs defaultTab="a" variant="underline">…</Tabs>
<Tabs defaultTab="a" variant="pills">…</Tabs>
<Tabs defaultTab="a" variant="boxed">…</Tabs>`,
        },
        {
            name: "Disabled tab",
            description: "Set `disabled` on a `Tab` — it stays visible but unfocusable.",
            render: () => (
                <Tabs defaultTab="a" className="w-full">
                    <Tabs.List>
                        <Tabs.Tab value="a">Enabled</Tabs.Tab>
                        <Tabs.Tab value="b" disabled>Disabled</Tabs.Tab>
                        <Tabs.Tab value="c">Enabled</Tabs.Tab>
                    </Tabs.List>
                </Tabs>
            ),
            code: `<Tabs defaultTab="a">
    <Tabs.List>
        <Tabs.Tab value="a">Enabled</Tabs.Tab>
        <Tabs.Tab value="b" disabled>Disabled</Tabs.Tab>
        <Tabs.Tab value="c">Enabled</Tabs.Tab>
    </Tabs.List>
</Tabs>`,
        },
    ],
    props: [
        { name: "defaultTab", type: `string`, default: "—", description: "Initial active tab `value`. Uncontrolled — use with no `activeTab`." },
        { name: "activeTab", type: `string`, default: "—", description: "Controlled active tab `value`. Use with `onTabChange`." },
        { name: "onTabChange", type: `(tab: string) => void`, default: "—", description: "Called when the active tab changes." },
        { name: "variant", type: `"underline" | "pills" | "boxed"`, default: `"underline"`, description: "Visual treatment of the tab list." },
        { name: "children", type: `ReactNode`, default: "—", description: "Should contain a `Tabs.List` and a `Tabs.Panels`." },
        { name: "className", type: `string`, default: "—", description: "Extra classes on the root wrapper." },
    ],
    notes: (
        <p className="text-xs text-zinc-600 dark:text-zinc-300">
            <strong>Pairing values:</strong> each <code>Tabs.Tab</code> matches a
            <code>Tabs.Panel</code> by its <code>value</code> prop. Only the active panel is
            rendered to the DOM — keep that in mind if a panel holds expensive state.
        </p>
    ),
};
