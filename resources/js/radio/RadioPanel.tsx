import { useEffect, useRef } from "react";
import { Badge, Button, Card, Heading, Icon, StreamingAudio, Text } from "@particle-academy/react-fancy";
import { fill, RADIO_LABELS, RADIO_PLAYER_LABELS } from "./labels";
import { useRadio } from "./RadioProvider";
import { findStation, RADIO_STATIONS, type RadioStation } from "./stations";

/** The header button's id: focus goes back to it when the panel closes. */
export const RADIO_TOGGLE_ID = "site-radio-toggle";
export const RADIO_PANEL_ID = "site-radio";

/** One station's artwork: webp at 1x / 2x, jpg fallback at 1x / 2x. */
export function StationCover({ station, size }: { station: RadioStation; size: number }) {
    return (
        <picture className="radio-cover" data-radio-cover={station.id}>
            <source type="image/webp" srcSet={`${station.cover.webp} 1x, ${station.cover.webp2x} 2x`} />
            <img
                src={station.cover.jpg}
                srcSet={`${station.cover.jpg} 1x, ${station.cover.jpg2x} 2x`}
                width={size}
                height={size}
                alt=""
                loading="lazy"
                decoding="async"
            />
        </picture>
    );
}

/**
 * The drawer under the site header. Always mounted (so the player inside it
 * keeps its <audio> element); closed, it is hidden, inert and out of the tab
 * order. Escape closes it and focus returns to the header button.
 */
export function RadioPanel() {
    const radio = useRadio();
    const panel = useRef<HTMLDivElement>(null);
    const heading = useRef<HTMLHeadingElement>(null);
    const wasOpen = useRef(false);
    const open = radio?.open ?? false;

    // Sit directly under the header, whatever its height on this page.
    useEffect(() => {
        if (!open || !panel.current) {
            return;
        }
        const header = document.querySelector("header.nav");
        const place = () => panel.current?.style.setProperty("--radio-top", `${Math.round(header?.getBoundingClientRect().bottom ?? 0)}px`);
        place();
        window.addEventListener("resize", place);
        window.addEventListener("scroll", place, { passive: true });
        return () => {
            window.removeEventListener("resize", place);
            window.removeEventListener("scroll", place);
        };
    }, [open]);

    useEffect(() => {
        if (open) {
            heading.current?.focus();
        } else if (wasOpen.current) {
            document.getElementById(RADIO_TOGGLE_ID)?.focus();
        }
        wasOpen.current = open;
    }, [open]);

    useEffect(() => {
        if (!open) {
            return;
        }
        const onKey = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                radio?.setOpen(false);
            }
        };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [open, radio]);

    if (!radio) {
        return null;
    }

    const { value, setValue, nowPlaying } = radio;
    const station = findStation(value.stationId);
    const live = station?.kind === "live";

    return (
        <div
            ref={panel}
            id={RADIO_PANEL_ID}
            className="radio-panel"
            data-radio-panel=""
            data-open={open ? "true" : "false"}
            role="region"
            aria-label={RADIO_LABELS.title}
            aria-hidden={open ? undefined : true}
            inert={!open}
        >
            <Card variant="outlined" className="radio-panel__card">
                <Card.Body className="radio-panel__body">
                    <div className="radio-panel__head">
                        <Heading as="h2" size="md" weight="semibold" ref={heading} tabIndex={-1}>
                            {RADIO_LABELS.title}
                        </Heading>
                        <Button variant="ghost" icon="x" aria-label={RADIO_LABELS.close} onClick={() => radio.setOpen(false)} className="radio-tap" />
                    </div>

                    <StreamingAudio
                        stations={RADIO_STATIONS}
                        value={value}
                        onChange={setValue}
                        nowPlaying={live ? nowPlaying : undefined}
                        labels={RADIO_PLAYER_LABELS}
                        id="site-radio-player"
                    />

                    {station && (
                        <div className="radio-panel__meta" data-radio-now={live ? "live" : "track"}>
                            {live ? (
                                <>
                                    <Badge color="red" variant="soft" dot>
                                        {RADIO_LABELS.live}
                                    </Badge>
                                    <Text as="span" size="sm" weight="semibold">
                                        {RADIO_LABELS.nowPlaying}
                                    </Text>
                                    <Text as="span" size="sm" color="muted" data-radio-now-playing={nowPlaying ? "known" : "unknown"}>
                                        {nowPlaying ?? RADIO_LABELS.nowPlayingUnknown}
                                    </Text>
                                </>
                            ) : (
                                <Text as="span" size="sm" color="muted">
                                    {RADIO_LABELS.hostedHere}
                                </Text>
                            )}
                            {station.site && (
                                <Button
                                    as="a"
                                    href={station.site.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    variant="ghost"
                                    iconTrailing="external-link"
                                    className="radio-tap"
                                    data-radio-site=""
                                >
                                    {fill(RADIO_LABELS.visitSite, { site: station.site.label })}
                                </Button>
                            )}
                        </div>
                    )}

                    <div className="radio-stations" role="group" aria-label={RADIO_LABELS.stations}>
                        {RADIO_STATIONS.map((s) => {
                            const selected = s.id === value.stationId;
                            return (
                                <Button
                                    key={s.id}
                                    variant="ghost"
                                    className="radio-station"
                                    aria-pressed={selected}
                                    data-radio-station={s.id}
                                    data-radio-kind={s.kind}
                                    onClick={() => setValue({ ...value, stationId: s.id })}
                                >
                                    <StationCover station={s} size={56} />
                                    <span className="radio-station__text">
                                        <span className="radio-station__name">{s.name}</span>
                                        <span className="radio-station__sub">
                                            {s.kind === "live" ? `${RADIO_LABELS.live}, ${s.genre ?? ""}` : `${RADIO_LABELS.track}, ${s.description ?? ""}`}
                                        </span>
                                    </span>
                                    {selected && <Icon name="check" size="sm" />}
                                </Button>
                            );
                        })}
                    </div>
                </Card.Body>
            </Card>
        </div>
    );
}
