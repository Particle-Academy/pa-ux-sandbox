import type { ComponentDoc } from "./types";
import { Button, Navbar } from "@particle-academy/react-fancy";

export const navbarDoc: ComponentDoc = {
    intro: (
        <p>
            Top-of-page horizontal navigation. <code>Navbar</code> is a compound component:
            <code>Brand</code> + <code>Items</code> (with <code>Item</code> children) + an
            optional mobile <code>Toggle</code>. Items render as anchors when
            <code>href</code> is passed.
        </p>
    ),
    examples: [
        {
            name: "Default",
            description: "Brand on the left, nav links on the right.",
            render: () => (
                <Navbar className="w-full rounded-md border border-zinc-200 dark:border-zinc-800">
                    <Navbar.Brand>Fancy UI</Navbar.Brand>
                    <Navbar.Items>
                        <Navbar.Item href="#" active>Home</Navbar.Item>
                        <Navbar.Item href="#">Packages</Navbar.Item>
                        <Navbar.Item href="#">Showcase</Navbar.Item>
                        <Navbar.Item href="#">Docs</Navbar.Item>
                    </Navbar.Items>
                </Navbar>
            ),
            code: `<Navbar>
    <Navbar.Brand>Fancy UI</Navbar.Brand>
    <Navbar.Items>
        <Navbar.Item href="/" active>Home</Navbar.Item>
        <Navbar.Item href="/packages">Packages</Navbar.Item>
        <Navbar.Item href="/showcase">Showcase</Navbar.Item>
        <Navbar.Item href="/docs">Docs</Navbar.Item>
    </Navbar.Items>
</Navbar>`,
        },
        {
            name: "With trailing actions",
            description: "Drop any element after `Items` for sign-in buttons, user menu, etc.",
            render: () => (
                <Navbar className="w-full rounded-md border border-zinc-200 dark:border-zinc-800">
                    <Navbar.Brand>Fancy UI</Navbar.Brand>
                    <Navbar.Items>
                        <Navbar.Item href="#" active>Home</Navbar.Item>
                        <Navbar.Item href="#">Pricing</Navbar.Item>
                    </Navbar.Items>
                    <div className="ml-auto flex items-center gap-2">
                        <Button variant="ghost" size="sm">Sign in</Button>
                        <Button color="violet" size="sm">Get started</Button>
                    </div>
                </Navbar>
            ),
            code: `<Navbar>
    <Navbar.Brand>Fancy UI</Navbar.Brand>
    <Navbar.Items>
        <Navbar.Item href="/" active>Home</Navbar.Item>
        <Navbar.Item href="/pricing">Pricing</Navbar.Item>
    </Navbar.Items>
    <div className="ml-auto flex gap-2">
        <Button variant="ghost">Sign in</Button>
        <Button color="violet">Get started</Button>
    </div>
</Navbar>`,
        },
    ],
    props: [
        { name: "children", type: `ReactNode`, default: "—", description: "Compound parts: `Navbar.Brand`, `Navbar.Items` (with `Navbar.Item` children), optionally `Navbar.Toggle`." },
        { name: "className", type: `string`, default: "—", description: "Extra classes on the root nav element." },
    ],
    notes: (
        <p className="text-xs text-zinc-600 dark:text-zinc-300">
            <strong>Mobile:</strong> drop a <code>Navbar.Toggle</code> for the hamburger. It
            flips the navbar's mobile state — combine with a <code>MobileMenu.Flyout</code>
            to render the off-canvas menu.
        </p>
    ),
};
