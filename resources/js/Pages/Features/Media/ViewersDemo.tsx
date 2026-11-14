import { useState } from "react";
import { Button, MediaViewer } from "@particle-academy/react-fancy";
import { FileViewer } from "@particle-academy/fancy-code";

/**
 * One file list, one viewer slot. MediaViewer picks the viewer from the file's
 * type (image, SVG, PDF, audio); fancy-code's FileViewer takes the text file
 * and opens it read-only in its code editor. Every file is served by this site.
 */
type DemoFile =
    | { name: string; kind: "media"; src: string; mime: string; alt: string }
    | { name: string; kind: "text"; value: string };

const PLAYER_SOURCE = `import { StreamingAudio } from "@particle-academy/react-fancy";

<StreamingAudio
  stations={[{ id: "ep1", name: "Episode 1", src: "/media/episode-1.mp3" }]}
  value={value}
  onChange={setValue}
/>;
`;

const FILES: DemoFile[] = [
    { name: "cover.webp", kind: "media", src: "/radio/thunder-in-the-garden-512.webp", mime: "image/webp", alt: "Thunder in the Garden cover art" },
    { name: "diagram.svg", kind: "media", src: "/showcase-assets/file-viewer/diagram.svg", mime: "image/svg+xml", alt: "Diagram" },
    { name: "sample.pdf", kind: "media", src: "/showcase-assets/file-viewer/sample.pdf", mime: "application/pdf", alt: "Sample PDF" },
    { name: "make-it-fancy.mp3", kind: "media", src: "/showcase-assets/audio/make-it-fancy.mp3", mime: "audio/mpeg", alt: "Make it Fancy" },
    { name: "player.tsx", kind: "text", value: PLAYER_SOURCE },
];

export function ViewersDemo() {
    const [name, setName] = useState(FILES[0].name);
    const file = FILES.find((f) => f.name === name) ?? FILES[0];

    return (
        <div className="media-viewers" data-media-demo="viewers">
            <div className="media-viewers__files" role="group" aria-label="Files">
                {FILES.map((f) => (
                    <Button
                        key={f.name}
                        size="sm"
                        variant={f.name === name ? undefined : "ghost"}
                        aria-pressed={f.name === name}
                        data-media-file={f.name}
                        onClick={() => setName(f.name)}
                        className="media-tap"
                    >
                        {f.name}
                    </Button>
                ))}
            </div>
            <div className="media-viewers__stage" data-media-viewer={file.name}>
                {file.kind === "media" ? (
                    <MediaViewer key={file.name} src={file.src} mime={file.mime} alt={file.alt} style={{ height: "100%" }} />
                ) : (
                    <FileViewer key={file.name} filename={file.name} value={file.value} readOnly />
                )}
            </div>
        </div>
    );
}
