import { useEffect, useRef, useState } from "react";
import { StreamingAudio, type StreamingAudioValue } from "@particle-academy/react-fancy";
import { useRadio } from "../../../radio/RadioProvider";
import { RADIO_STATIONS } from "../../../radio/stations";

/**
 * StreamingAudio over the showcase radio's own stations: Riverwest Radio live
 * (owner's choice) and the self-hosted Thunder in the Garden tracks
 * (owner-approved for public streaming, 2026-11-08). The list is the radio's,
 * so this page names no media URL of its own.
 *
 * Its value is local and never starts playing. The site radio in the header is
 * a second <audio> element with its own value, so the two take turns: playing
 * here pauses the site radio, and the site radio starting pauses this one.
 */
export function StationsDemo() {
    const radio = useRadio();
    const [value, setValue] = useState<StreamingAudioValue>({
        stationId: "riverwest",
        playing: false,
        volume: 0.8,
        muted: false,
    });

    const radioRef = useRef(radio);
    radioRef.current = radio;

    // This demo started: pause the site radio.
    useEffect(() => {
        const r = radioRef.current;
        if (value.playing && r?.value.playing) {
            r.setValue({ ...r.value, playing: false });
        }
    }, [value.playing]);

    // The site radio started: pause this demo.
    const radioPlaying = radio?.value.playing ?? false;
    useEffect(() => {
        if (radioPlaying) {
            setValue((v) => (v.playing ? { ...v, playing: false } : v));
        }
    }, [radioPlaying]);

    return (
        <div className="media-stations" data-media-demo="stations">
            <StreamingAudio stations={RADIO_STATIONS} value={value} onChange={setValue} />
        </div>
    );
}
