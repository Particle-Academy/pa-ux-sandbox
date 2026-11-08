import { Icon } from "@particle-academy/react-fancy";
import { RADIO_LABELS } from "./labels";
import { RADIO_PANEL_ID, RADIO_TOGGLE_ID } from "./RadioPanel";
import { useRadio } from "./RadioProvider";

/**
 * The header's radio toggle. It matches its neighbours (the site's own
 * `btn btn-ghost` header controls) and shows a dot while something plays, so
 * a closed drawer still says the radio is on.
 */
export function RadioButton() {
    const radio = useRadio();
    if (!radio) {
        return null;
    }
    const playing = radio.value.playing;

    return (
        <button
            type="button"
            id={RADIO_TOGGLE_ID}
            className="btn btn-ghost radio-toggle"
            onClick={radio.toggle}
            aria-label={radio.open ? RADIO_LABELS.close : RADIO_LABELS.open}
            aria-expanded={radio.open}
            aria-controls={RADIO_PANEL_ID}
            data-radio-toggle=""
            data-radio-playing={playing ? "true" : "false"}
            title={playing ? RADIO_LABELS.playingBadge : RADIO_LABELS.title}
        >
            <Icon name="radio" size="sm" />
            {playing && <span className="radio-toggle__dot" aria-hidden="true" />}
        </button>
    );
}
