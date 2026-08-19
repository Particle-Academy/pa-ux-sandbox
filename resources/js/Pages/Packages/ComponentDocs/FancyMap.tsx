import type { ComponentDoc } from "./types";
import { useEffect, useState } from "react";
import "leaflet/dist/leaflet.css"; // Leaflet's stylesheet — required once, anywhere in the app.
import { Map, type MapMarker, type MapView } from "@particle-academy/fancy-map";
import { leafletProvider } from "@particle-academy/fancy-map/leaflet";
import { DELIVERY_ROUTE, DELIVERY_ROUTE_START as ROUTE_CENTER } from "../showcase-fixtures";
import { Badge, Text } from "@particle-academy/react-fancy";

/**
 * One OpenStreetMap provider instance, created at module load (not per render)
 * so the map engine isn't re-created on every re-render.
 */
const osm = leafletProvider();

// ── (a) Store locator ────────────────────────────────────────────────────────
const STORES: MapMarker[] = [
    { id: "riverwest", position: { lat: 43.0713, lng: -87.9018 }, icon: "🌮", color: "#D6482B", label: "Riverwest Taquería" },
    { id: "third-ward", position: { lat: 43.0313, lng: -87.9065 }, icon: "☕", color: "#6F4E37", label: "Third Ward Coffee" },
    { id: "bay-view", position: { lat: 43.0000, lng: -87.9065 }, icon: "🍞", color: "#B4703B", label: "Bay View Bakery" },
    { id: "downtown", position: { lat: 43.0389, lng: -87.9065 }, icon: "🍕", color: "#C1121F", label: "Downtown Pizzeria" },
];

function StoreLocatorDemo() {
    const [view, setView] = useState<MapView>({ center: { lat: 43.0389, lng: -87.9065 }, zoom: 12 });
    const [selected, setSelected] = useState<string | null>(null);
    const picked = STORES.find((s) => s.id === selected);
    return (
        <div className="w-full space-y-2">
            <div style={{ height: 420 }} className="overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-800">
                <Map
                    provider={osm}
                    view={view}
                    onViewChange={setView}
                    markers={STORES}
                    selectedId={selected}
                    onSelect={setSelected}
                />
            </div>
            <Text size="xs" className="!text-zinc-500">
                {picked ? (
                    <>
                        Picked: <strong>{picked.label}</strong> ({picked.position.lat.toFixed(4)}, {picked.position.lng.toFixed(4)})
                    </>
                ) : (
                    "Click a pin — selection is controlled state your app (or an agent) owns."
                )}
            </Text>
        </div>
    );
}

// ── (b) Live tracking ────────────────────────────────────────────────────────
// The route lives in showcase-fixtures because the package PREVIEW renders its
// own copy of this demo. It was duplicated, and the duplicate kept the old
// sine/cosine ring long after this one was fixed -- so the docs showed a truck
// on real streets while the preview beside it still drove through the lake.


function LiveTrackingDemo() {
    const [step, setStep] = useState(0);
    const [view, setView] = useState<MapView>({ center: ROUTE_CENTER, zoom: 14 });

    // SSR-safe: the timer only runs in the browser (inside an effect) and is
    // cleared on unmount. Nothing time-dependent happens during render.
    useEffect(() => {
        const id = window.setInterval(() => setStep((s) => (s + 1) % DELIVERY_ROUTE.length), 900);
        return () => window.clearInterval(id);
    }, []);

    const markers: MapMarker[] = [
        { id: "truck", position: DELIVERY_ROUTE[step], icon: "🚚", color: "#2563eb", label: "Order #4821" },
        { id: "home", position: ROUTE_CENTER, icon: "🏠", color: "#16a34a", label: "You" },
    ];

    return (
        <div className="w-full space-y-2">
            <div style={{ height: 420 }} className="overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-800">
                <Map provider={osm} view={view} onViewChange={setView} markers={markers} follow="truck" />
            </div>
            <Text size="xs" className="!text-zinc-500">
                The <code>truck</code> marker's position updates every 900ms; <code>follow="truck"</code> keeps the camera on
                it. Any position source — a websocket, a Laravel Echo channel, an agent over the bridge — drives the same
                controlled <code>markers</code> array.
            </Text>
        </div>
    );
}

// ── (c) Google Maps (code-only) ──────────────────────────────────────────────
function GoogleMapsPlaceholder() {
    return (
        <div className="w-full">
            <div
                style={{ height: 420 }}
                className="grid place-items-center rounded-md border border-dashed border-zinc-300 bg-zinc-50 p-6 text-center dark:border-zinc-700 dark:bg-zinc-950"
            >
                <div className="space-y-2">
                    <div className="text-3xl">🗺️</div>
                    <Badge color="amber">API key required</Badge>
                    <Text size="sm" className="!text-zinc-500">
                        Add a Google Maps JS API key to <code>VITE_GOOGLE_MAPS_KEY</code> to run this example live.
                    </Text>
                    <Text size="xs" className="!text-zinc-400">
                        Only the <code>provider</code> prop changes — every other prop (view, markers, selection, follow) is identical to the Leaflet examples above.
                    </Text>
                </div>
            </div>
        </div>
    );
}

export const fancyMapDoc: ComponentDoc = {
    intro: (
        <p>
            Engine-agnostic map surface: <strong>one <code>&lt;Map&gt;</code> API</strong> over swappable providers
            (OpenStreetMap via Leaflet, or Google Maps), with <strong>live position tracking</strong> and a Human+ MCP
            bridge so a human and an agent can share the same map. <code>view</code> + <code>markers</code> +{" "}
            <code>selectedId</code> are controlled props; markers are a plain JSON array an agent can emit directly. Every
            pin carries a stable <code>data-map-marker-id</code> handle. SSR-safe — a sized placeholder renders on the
            server, the engine mounts in an effect (no hydration mismatch under Inertia).
        </p>
    ),
    examples: [
        {
            name: "Store locator (OpenStreetMap)",
            description:
                "`leafletProvider()` renders OpenStreetMap tiles (no API key). A few markers with emoji icons; selection is controlled — click a pin and the picked store reads out below.",
            render: () => <StoreLocatorDemo />,
            code: `import "leaflet/dist/leaflet.css"; // once, anywhere
import { Map, type MapMarker, type MapView } from "@particle-academy/fancy-map";
import { leafletProvider } from "@particle-academy/fancy-map/leaflet";

const osm = leafletProvider(); // OpenStreetMap tiles by default

const STORES: MapMarker[] = [
    { id: "riverwest", position: { lat: 43.0713, lng: -87.9018 }, icon: "🌮", color: "#D6482B", label: "Riverwest Taquería" },
    { id: "third-ward", position: { lat: 43.0313, lng: -87.9065 }, icon: "☕", color: "#6F4E37", label: "Third Ward Coffee" },
];

function StoreLocator() {
    const [view, setView] = useState<MapView>({ center: { lat: 43.0389, lng: -87.9065 }, zoom: 12 });
    const [selected, setSelected] = useState<string | null>(null);
    // The map container MUST have a real height.
    return (
        <div style={{ height: 420 }}>
            <Map
                provider={osm}
                view={view}
                onViewChange={setView}
                markers={STORES}
                selectedId={selected}
                onSelect={setSelected}
            />
        </div>
    );
}`,
        },
        {
            name: "Live tracking (follow a moving marker)",
            description:
                "A `truck` marker whose position updates on an interval; `follow=\"truck\"` keeps the camera centered as it moves. The route is precomputed (deterministic, SSR-safe) and the timer lives in an effect.",
            render: () => <LiveTrackingDemo />,
            code: `import { Map, type MapMarker } from "@particle-academy/fancy-map";
// A real app would feed positions from a websocket / Echo channel / geolocation.
// useGeolocationTrack() wires the browser's live position with zero extra work:
//   const { position } = useGeolocationTrack();

function LiveTracking() {
    const [step, setStep] = useState(0);
    const [view, setView] = useState({ center: ROUTE_CENTER, zoom: 13 });

    // SSR-safe: the timer runs only in the browser and is cleared on unmount.
    useEffect(() => {
        const id = window.setInterval(() => setStep((s) => (s + 1) % ROUTE.length), 900);
        return () => window.clearInterval(id);
    }, []);

    const markers: MapMarker[] = [
        { id: "truck", position: ROUTE[step], icon: "🚚", color: "#2563eb", label: "Order #4821" },
        { id: "home", position: ROUTE_CENTER, icon: "🏠", color: "#16a34a" },
    ];

    return (
        <div style={{ height: 420 }}>
            <Map provider={osm} view={view} onViewChange={setView} markers={markers} follow="truck" />
        </div>
    );
}`,
        },
        {
            name: "Google Maps (swap one prop)",
            description:
                "Switching engines is a one-line `provider` change — the rest of the API is identical. This example is code-only (no key wired here); add a Google Maps JS API key to run it live.",
            render: () => <GoogleMapsPlaceholder />,
            code: `import { Map } from "@particle-academy/fancy-map";
import { googleProvider } from "@particle-academy/fancy-map/google";

// npm install @googlemaps/js-api-loader — the SDK loads over the network at mount time.
const provider = googleProvider({ apiKey: import.meta.env.VITE_GOOGLE_MAPS_KEY });

<div style={{ height: 420 }}>
    <Map provider={provider} view={view} onViewChange={setView} markers={markers} />
</div>`,
        },
    ],
    props: [
        { name: "provider", type: `MapProvider`, default: "—", description: "The map engine. `leafletProvider()` (OpenStreetMap) or `googleProvider({ apiKey })`. Swapping engines is a one-line change.", required: true },
        { name: "view", type: `MapView`, default: "—", description: "Controlled camera — `{ center: { lat, lng }, zoom, bearing?, pitch? }`. `bearing`/`pitch` honored only by providers that support them.", required: true },
        { name: "onViewChange", type: `(view) => void`, default: "—", description: "Fires when the user pans/zooms (or a provider animation settles)." },
        { name: "markers", type: `MapMarker[]`, default: "—", description: "Controlled, JSON-friendly markers — `{ id, position, label?, color?, icon?, draggable?, data? }`. `icon` is an emoji or 1–2 chars." },
        { name: "selectedId", type: `string | null`, default: "—", description: "Controlled selection (marker id)." },
        { name: "onSelect", type: `(id, marker?) => void`, default: "—", description: "Called when a marker is clicked." },
        { name: "onMarkerDragEnd", type: `(id, position) => void`, default: "—", description: "Called when a `draggable` marker is released at a new position." },
        { name: "onMapClick", type: `(position) => void`, default: "—", description: "Called when the map background (not a marker) is clicked." },
        { name: "follow", type: `string | null`, default: "—", description: "Keep this marker centered as its position updates — the live-tracking camera." },
        { name: "fitTo", type: `LatLng[]`, default: "—", description: "One-shot: fit the camera to enclose these points (re-runs on array identity change)." },
        { name: "onReady", type: `(handle) => void`, default: "—", description: "Grab the imperative `MapHandle` once the engine is live — e.g. to wire the bridge's `fitBounds`." },
        { name: "onError", type: `(error) => void`, default: "—", description: "Called if the provider fails to mount (e.g. a Google SDK load error)." },
        { name: "className", type: `string`, default: "—", description: "Extra classes on the map container." },
        { name: "style", type: `CSSProperties`, default: "—", description: "Inline styles on the map container. The container needs a real height." },
    ],
    notes: (
        <div className="space-y-2 text-xs text-zinc-600 dark:text-zinc-300">
            <p>
                <strong>Height is required.</strong> Give the map a container with a real height (<code>height: 420</code>,{" "}
                <code>100%</code> of a sized parent, or a flex child with <code>min-height</code>) — like every map
                library, Leaflet / Google measure their container to lay out tiles.
            </p>
            <p>
                <strong>Leaflet CSS.</strong> The Leaflet provider needs its stylesheet imported once anywhere in your app:{" "}
                <code>import "leaflet/dist/leaflet.css"</code>. Markers render as colored teardrop pins (a Leaflet{" "}
                <code>divIcon</code>, so there's no bundler broken-image-path problem).
            </p>
            <p>
                <strong>Live tracking.</strong> There's no special "tracking mode" — the map re-renders from controlled{" "}
                <code>markers</code>, and <code>follow</code> keeps the camera on one. <code>useGeolocationTrack()</code>{" "}
                wires the browser's live position (SSR-safe; watch starts in an effect).
            </p>
            <p>
                <strong>Human+:</strong> <code>registerMapBridge</code> from{" "}
                <code>@particle-academy/agent-integrations/bridges/map</code> gives an agent{" "}
                <code>map_set_view</code> / <code>map_pan</code> / <code>map_zoom</code> / <code>map_add_marker</code> /{" "}
                <code>map_update_marker</code> / <code>map_remove_marker</code> / <code>map_select</code> /{" "}
                <code>map_fit_bounds</code> / <code>map_start_track</code> / <code>map_stop_track</code> over the same
                controlled state — every mutation broadcasts <code>AgentActivity</code> and is undoable. See the cohabited
                map.
            </p>
        </div>
    ),
};
