import { useRef, type KeyboardEvent } from "react";
import { router } from "@inertiajs/react";
import { Dropdown, Icon } from "@particle-academy/react-fancy";
import { ChevronDown } from "lucide-react";
import type { FeatureNav } from "./types";

/**
 * The header's "Features" dropdown — react-fancy's own `Dropdown`, the same
 * primitive the header's other menus use.
 *
 * Keyboard: the trigger is a real button, so Enter / Space open and close it;
 * Escape closes it through react-fancy's `useEscapeKey` stack, so it closes
 * THIS menu and not whatever is beneath, and focus returns to the trigger.
 *
 * Arrow keys are handled HERE, not by the library. react-fancy 5.64's
 * `DropdownItems` attaches its arrow-key listener in an effect that returns
 * early while its floating ref is still null (the portal mounts a frame later,
 * behind the animation hook) and never re-runs, so ArrowDown does nothing and
 * the items are unreachable by keyboard. Reported against react-fancy; drop
 * `moveFocus` once the fix ships.
 *
 * The list is the shared `features` prop (`App\Support\FeatureSites`), never a
 * second hand-typed copy.
 */
export function FeaturesMenu({ features, active }: { features: FeatureNav[]; active: boolean }) {
    const triggerRef = useRef<HTMLButtonElement>(null);

    const items = () =>
        Array.from(document.querySelectorAll<HTMLElement>('[data-features-menu] [role="menuitem"]:not([aria-disabled="true"])'));

    const moveFocus = (delta: 1 | -1 | "first" | "last") => {
        const list = items();
        if (list.length === 0) return;
        const current = list.indexOf(document.activeElement as HTMLElement);
        const next =
            delta === "first" ? 0
            : delta === "last" ? list.length - 1
            : current === -1 ? (delta === 1 ? 0 : list.length - 1)
            : (current + delta + list.length) % list.length;
        list[next]?.focus();
    };

    const onTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
        if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
        event.preventDefault();
        const target = event.key === "ArrowDown" ? "first" : "last";
        if (items().length > 0) {
            moveFocus(target);
            return;
        }
        // Closed: open it, then wait for the portal to mount (it lands a few
        // frames later, behind the enter animation) before focusing.
        triggerRef.current?.click();
        let frames = 0;
        const focusWhenMounted = () => {
            if (items().length > 0) {
                moveFocus(target);
            } else if (++frames < 30) {
                requestAnimationFrame(focusWhenMounted);
            }
        };
        requestAnimationFrame(focusWhenMounted);
    };

    const onMenuKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
        const keys: Record<string, 1 | -1 | "first" | "last"> = { ArrowDown: 1, ArrowUp: -1, Home: "first", End: "last" };
        if (event.key in keys) {
            event.preventDefault();
            moveFocus(keys[event.key]);
        } else if (event.key === "Escape" || event.key === "Tab") {
            // The library closes the menu; put focus back where it came from.
            requestAnimationFrame(() => triggerRef.current?.focus());
        }
    };

    return (
        <Dropdown placement="bottom-start">
            <Dropdown.Trigger>
                <button
                    ref={triggerRef}
                    type="button"
                    className="nav-link nav-link--menu"
                    data-active={active ? "" : undefined}
                    aria-current={active ? "page" : undefined}
                    data-co-handle="nav-features"
                    onKeyDown={onTriggerKeyDown}
                >
                    Features
                    <ChevronDown size={14} aria-hidden />
                </button>
            </Dropdown.Trigger>
            <Dropdown.Items className="features-menu">
                <div data-features-menu="" onKeyDown={onMenuKeyDown}>
                    {features.map((feature) => (
                        <Dropdown.Item key={feature.slug} onClick={() => router.visit(feature.href)} className="features-menu__item">
                            <span className="features-menu__row" data-feature-item={feature.slug}>
                                <span className="features-menu__icon" aria-hidden>
                                    <Icon name={feature.icon} size="sm" />
                                </span>
                                <span className="features-menu__text">
                                    <span className="features-menu__name">{feature.name}</span>
                                    <span className="features-menu__tagline">{feature.tagline}</span>
                                </span>
                            </span>
                        </Dropdown.Item>
                    ))}
                    <Dropdown.Separator />
                    <Dropdown.Item onClick={() => router.visit("/features")} className="features-menu__item">
                        <span className="features-menu__all">All features</span>
                    </Dropdown.Item>
                </div>
            </Dropdown.Items>
        </Dropdown>
    );
}
