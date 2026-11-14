import { Badge, Button, Card, Heading, Text } from "@particle-academy/react-fancy";
import { DemoFrame } from "../shared/DemoFrame";
import { FeatureCta } from "../shared/FeatureCta";
import { FeatureHero } from "../shared/FeatureHero";
import { FeatureShell } from "../shared/FeatureShell";
import { FeatureTour } from "../shared/FeatureTour";
import { HowItFits } from "../shared/HowItFits";
import { InstallSteps } from "../shared/InstallSteps";
import { PackagesGrid } from "../shared/PackagesGrid";
import type { FeaturePageProps } from "../shared/types";
import { StationsDemo } from "./StationsDemo";
import { ViewersDemo } from "./ViewersDemo";

/**
 * /features/media: every media component the kit ships (owner, 2026-11-14).
 *
 * Members come from FeatureSites: react-fancy (ImageViewer, VideoViewer,
 * AudioViewer, PdfViewer, MediaViewer, StreamingAudio) and fancy-code
 * (FileViewer). Claims are sourced from those components' docs.
 *
 * Channels (one track, a playlist or a live stream, with a guide, playlist and
 * queue) are built in react-fancy but NOT released, so they are described under
 * "coming" and nothing here imports them. When react-fancy ships them, the
 * sandbox dogfoods the release and this section becomes the live channel guide.
 * MediaFeatureTest is the guard. Plan: .ai/plans/media-channels.md.
 */

const COMING_COMPONENTS: { name: string; body: string }[] = [
    { name: "ChannelPlayer", body: "Plays the current channel: audio or video files, live streams, or an embed." },
    { name: "ChannelGuide", body: "The list of channels, with what each one is and whether it is live." },
    { name: "Playlist", body: "Reorder, add and remove tracks, shuffle and repeat, and the track playing now. Removals an agent proposes wait for your OK." },
    { name: "MediaQueue", body: "What plays next, in shuffle order when shuffle is on." },
    { name: "TrackItem", body: "One track row: artwork, title, artist and length." },
    { name: "NowPlaying", body: "Artwork, title and artist of what is playing." },
    { name: "LiveBadge", body: "Live, starting, offline or ended." },
    { name: "MediaEmbed", body: "YouTube, Vimeo and Twitch embeds through a provider registry a host can add to. Nothing loads until play." },
];

export default function MediaFeature({ feature, versions }: FeaturePageProps) {
    return (
        <FeatureShell feature={feature}>
            <FeatureHero
                feature={feature}
                eyebrow="Feature · Images, sound, video and documents"
                lede="Show any file with the right viewer, and play MP3s and Icecast or Shoutcast live streams with a player your app controls. Everything runs on the browser's own media elements, with no media library."
                languages={feature.languages}
                actions={
                    <>
                        <Button href="#player" icon="radio" className="media-tap">
                            Play a station
                        </Button>
                        <Button href="#channels" variant="ghost" iconTrailing="arrow-down" className="media-tap">
                            Channels are coming
                        </Button>
                    </>
                }
            />

            <section id="player" className="feature-section media-anchor">
                <Heading as="h2" size="lg" weight="semibold" className="feature-display">
                    The streaming player
                </Heading>
                <Text as="p" color="muted" className="feature-section__intro">
                    StreamingAudio plays server-hosted MP3s and Icecast or Shoutcast live streams on the native audio element. It is
                    fully controlled: nothing plays until the value says so, and the player sets it back when the browser blocks
                    autoplay or a stream gives up.
                </Text>
            </section>

            <DemoFrame
                id="media-stations"
                label="react-fancy StreamingAudio"
                status="Live · local state"
                caption="Pick Riverwest Radio for a live stream, or a Thunder in the Garden track for a file you can seek. The value below is everything an app, or an agent, needs to read or set. This player and the site radio take turns: starting one pauses the other."
            >
                <StationsDemo />
            </DemoFrame>

            <FeatureTour
                title="What ships today"
                intro={<Text as="span">Each claim is checkable in the components' docs.</Text>}
                items={[
                    {
                        icon: "radio",
                        title: "Live streams and files",
                        body: "A live station has no seek bar; pause drops the connection and play reconnects at the live edge, so you never hear a stale buffer. A dropped stream reconnects with backoff, three attempts. A file keeps its position and gets elapsed, duration and a seek bar.",
                    },
                    {
                        icon: "shield-check",
                        title: "Only addresses it should play",
                        body: "StreamingAudio plays absolute http and https URLs and same-origin paths, and refuses every other scheme with an error state, so a station list from somewhere else cannot hand it a javascript: or data: address.",
                    },
                    {
                        icon: "smartphone",
                        title: "Lock-screen controls",
                        body: "The station and what is on air go to the Media Session, so the phone's lock screen and the keyboard's media keys play and pause it.",
                    },
                    {
                        icon: "image",
                        title: "A viewer for every file",
                        body: "MediaViewer picks ImageViewer, VideoViewer, AudioViewer or PdfViewer from a file's type or its address, and shows a download card for anything else. ImageViewer fits, zooms with Ctrl or Command and the wheel, and pans.",
                    },
                    {
                        icon: "file-code",
                        title: "Text too",
                        body: "fancy-code's FileViewer opens text in a read-only code editor with the language taken from the file name, and hands images, video, audio and PDFs to MediaViewer.",
                    },
                ]}
            />

            <DemoFrame
                id="media-viewers"
                label="react-fancy MediaViewer and fancy-code FileViewer"
                status="Live · files from this site"
                caption="Choose a file. The image, the SVG, the PDF and the MP3 each get their own viewer from MediaViewer; the .tsx file opens in FileViewer's code editor."
            >
                <ViewersDemo />
            </DemoFrame>

            <section id="channels" className="feature-section media-anchor">
                <Heading as="h2" size="lg" weight="semibold" className="feature-display">
                    Channels{" "}
                    <Badge color="violet" variant="soft" data-media-coming="">
                        Coming
                    </Badge>
                </Heading>
                <Text as="p" color="muted" className="feature-section__intro">
                    Coming in the next react-fancy release, and not installable yet. A channel is a single track, a playlist of
                    tracks, or a live stream from any streaming service. One value holds the whole player, so the guide, the
                    playlist and the queue stay in step, and an agent can drive them through the same value.
                </Text>
                <div className="media-coming" data-media-coming-list="">
                    {COMING_COMPONENTS.map((c) => (
                        <Card key={c.name} variant="outlined" className="media-coming__card" data-media-coming-component={c.name}>
                            <Card.Body>
                                <Heading as="h3" size="sm" weight="semibold" className="media-coming__name">
                                    {c.name}
                                </Heading>
                                <Text as="p" size="sm" color="muted">
                                    {c.body}
                                </Text>
                            </Card.Body>
                        </Card>
                    ))}
                </div>
                <Card variant="outlined" className="media-note">
                    <Card.Body>
                        <Heading as="h3" size="sm" weight="semibold">
                            Which streams will play
                        </Heading>
                        <Text as="p" size="sm" color="muted">
                            Files, Icecast and Shoutcast play everywhere. HLS plays where the browser plays it natively, which is
                            Safari and iOS. Other services come in through embeds or a source adapter your app registers. This page
                            will show a live channel guide when the release ships.
                        </Text>
                    </Card.Body>
                </Card>
            </section>

            <HowItFits
                members={feature.members}
                bridges={feature.bridges}
                intro="The viewers and the player are react-fancy components; FileViewer in fancy-code builds on MediaViewer."
            />
            <InstallSteps members={feature.members} versions={versions} />
            <PackagesGrid members={feature.members} versions={versions} />

            <FeatureCta
                title="Add a player to your app"
                body="Install react-fancy, give StreamingAudio your stations and hold its value in state. Its page lists every prop, label and error kind."
                primary={{ label: "StreamingAudio", href: "/packages/react-fancy/streaming-audio" }}
                secondary={{ label: "Humans and agents on one UI", href: "/features/human-plus" }}
            />
        </FeatureShell>
    );
}
