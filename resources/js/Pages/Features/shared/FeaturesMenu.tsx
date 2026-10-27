import { router } from "@inertiajs/react";
import { Dropdown, Icon } from "@particle-academy/react-fancy";
import { ChevronDown } from "lucide-react";
import type { FeatureNav } from "./types";

/**
 * The header's "Features" dropdown — react-fancy's own `Dropdown`, the same
 * primitive the header's other menus use.
 *
 * Keyboard is the library's: the trigger is a real button, so Enter / Space
 * open and close it, ArrowDown opens it on the first item, the arrow keys move
 * through the items and wrap, and Escape closes it through react-fancy's
 * `useEscapeKey` stack (THIS menu, not whatever is beneath) and returns focus
 * to the trigger.
 *
 * The list is the shared `features` prop (`App\Support\FeatureSites`), never a
 * second hand-typed copy.
 */
export function FeaturesMenu({ features, active }: { features: FeatureNav[]; active: boolean }) {
    return (
        <Dropdown placement="bottom-start">
            <Dropdown.Trigger>
                <button
                    type="button"
                    className="nav-link nav-link--menu"
                    data-active={active ? "" : undefined}
                    aria-current={active ? "page" : undefined}
                    data-co-handle="nav-features"
                >
                    Features
                    <ChevronDown size={14} aria-hidden />
                </button>
            </Dropdown.Trigger>
            <Dropdown.Items className="features-menu">
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
            </Dropdown.Items>
        </Dropdown>
    );
}
