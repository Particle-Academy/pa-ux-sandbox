import { useEffect, useRef } from "react";
import { Badge, Card, Text } from "@particle-academy/react-fancy";
import { mountPixel, type PixelHandle, type PixelStyle } from "@particle-academy/fancy-pixel";

/**
 * The real fancy-pixel embed, in each of its three styles. Mounted in `placed`
 * mode inside its card, and with NO endpoint, so the demo never sends a
 * beacon or an event: fancy-pixel makes no network request without one.
 */
const STYLES: { style: PixelStyle; name: string; renders: string }[] = [
    { style: "badge", name: "Badge", renders: "The wordmark and glyph" },
    { style: "mark", name: "Mark", renders: "The glyph only" },
    { style: "beacon", name: "Beacon", renders: "A small pulsing dot" },
];

function PixelMount({ style }: { style: PixelStyle }) {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const target = ref.current;
        if (!target) {
            return;
        }
        // One key per style: fancy-pixel mounts one pixel per site key, so a
        // shared key would leave every card after the first empty.
        const pixel: PixelHandle = mountPixel({ style, mode: "placed", target, siteKey: `feature-demo-${style}` });

        return () => pixel.destroy();
    }, [style]);

    return <div ref={ref} className="heur-pixel__slot" data-heuristics-demo-pixel={style} />;
}

export function PixelDemo() {
    return (
        <div className="heur-pixels" data-heuristics-demo="pixel">
            {STYLES.map(({ style, name, renders }) => (
                <Card key={style} variant="outlined" className="heur-pixel">
                    <Card.Body>
                        <div className="heur-pixel__head">
                            <Text as="span" weight="semibold">
                                {name}
                            </Text>
                            <Badge size="sm" color="zinc">
                                style: {style}
                            </Badge>
                        </div>
                        <PixelMount style={style} />
                        <Text as="p" size="sm" color="muted">
                            {renders}
                        </Text>
                    </Card.Body>
                </Card>
            ))}
        </div>
    );
}
