import { router } from "@inertiajs/react";
import { Dropdown, Grid, Icon } from "@particle-academy/react-fancy";
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
 *
 * The panel is wide (`features.css`: up to 1040px, never past the viewport,
 * which the Dropdown's own positioning clamps to) and the items sit in
 * react-fancy's `Grid`: 1 column on small screens, 2 from md, 4 from lg. The
 * grid is layout only, so the items stay plain `menuitem`s in DOM order, read
 * row by row: the arrow keys and Tab walk the same order a reader does. "All
 * features" stays the footer row, after the separator.
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
                <Grid cols={4} gap="sm" responsive={false} className="features-menu__grid" role="none" data-features-grid="">
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
                </Grid>
                <Dropdown.Separator />
                <Dropdown.Item onClick={() => router.visit("/features")} className="features-menu__item features-menu__footer">
                    <span className="features-menu__all">All features</span>
                </Dropdown.Item>
            </Dropdown.Items>
        </Dropdown>
    );
}
