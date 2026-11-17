import { useEffect, useMemo, useRef, useState } from "react";
import {
    ChannelGuide,
    ChannelPlayer,
    MediaQueue,
    Playlist,
    createChannelValue,
    findChannel,
    selectChannel,
    type Channel,
    type ChannelPlayerValue,
    type MediaTrack,
} from "@particle-academy/react-fancy";
import { NOW_PLAYING_POLL_MS, useRadio } from "../../../radio/RadioProvider";
import { PLAYLIST_CHANNEL, RADIO_TRACKS, RIVERWEST_LISTEN_URL, SINGLE_TRACK_CHANNEL, riverwestChannel } from "../../../radio/channels";
import { nowPlayingFrom, RIVERWEST_STATUS_URL } from "../../../radio/stations";

/**
 * A live channel guide over the showcase radio's own media (react-fancy 6.26.0):
 * a single Thunder in the Garden track, a playlist of all three, and Riverwest
 * Radio live. The channels come from resources/js/radio/channels.ts, which
 * derives them from RADIO_STATIONS, so this page names no media URL of its own.
 * Riverwest is an Icecast MP3 mount and plays natively everywhere, so the
 * hls.js adapter is not imported.
 *
 * ChannelGuide, ChannelPlayer, Playlist and MediaQueue share ONE value. It is
 * local and never starts playing. As with StationsDemo, this player and the
 * site radio take turns: playing here pauses the site radio, and the site radio
 * starting pauses this one.
 */
export function ChannelsDemo() {
    const radio = useRadio();
    const [tracks, setTracks] = useState<MediaTrack[]>(PLAYLIST_CHANNEL.tracks);
    const [nowPlaying, setNowPlaying] = useState<string | undefined>(undefined);
    const [value, setValue] = useState<ChannelPlayerValue>(() =>
        selectChannel(createChannelValue({ volume: 0.8 }), PLAYLIST_CHANNEL),
    );

    const channels = useMemo<Channel[]>(
        () => [SINGLE_TRACK_CHANNEL, { ...PLAYLIST_CHANNEL, tracks }, riverwestChannel(nowPlaying)],
        [tracks, nowPlaying],
    );
    const channel = findChannel(channels, value.channelId);
    const onLive = channel?.kind === "live";

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

    // What is on air, from Riverwest's Icecast status, only while tuned to it.
    useEffect(() => {
        if (!onLive) {
            setNowPlaying(undefined);
            return;
        }
        const controller = new AbortController();
        const poll = () => {
            fetch(RIVERWEST_STATUS_URL, { signal: controller.signal, cache: "no-store" })
                .then((r) => (r.ok ? r.json() : null))
                .then((status) => setNowPlaying(status ? nowPlayingFrom(status, RIVERWEST_LISTEN_URL) : undefined))
                .catch(() => {
                    if (!controller.signal.aborted) {
                        setNowPlaying(undefined);
                    }
                });
        };
        poll();
        const timer = window.setInterval(poll, NOW_PLAYING_POLL_MS);
        return () => {
            controller.abort();
            window.clearInterval(timer);
        };
    }, [onLive]);

    return (
        <div className="media-channels" data-media-demo="channels">
            <ChannelGuide channels={channels} value={value} onChange={setValue} className="media-channels__guide" />
            <div className="media-channels__main">
                <ChannelPlayer channels={channels} value={value} onChange={setValue} />
                {channel && !onLive && (
                    <Playlist
                        channel={channel}
                        value={value}
                        onChange={setValue}
                        onTracksChange={
                            channel.kind === "playlist" ? (_channelId: string, next: MediaTrack[]) => setTracks(next) : undefined
                        }
                        library={channel.kind === "playlist" ? RADIO_TRACKS : undefined}
                    />
                )}
                {channel?.kind === "playlist" && <MediaQueue channel={channel} value={value} onChange={setValue} />}
            </div>
        </div>
    );
}
