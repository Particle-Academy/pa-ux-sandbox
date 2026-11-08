// @vitest-environment jsdom
// @vitest-environment-options {"url":"https://showcase.example.test/"}
import { act } from "react";
import { createRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RadioButton } from "../../resources/js/radio/RadioButton";
import { RadioProvider } from "../../resources/js/radio/RadioProvider";
import { nowPlayingFrom, RADIO_PREFS_KEY, RADIO_STATIONS, readPrefs } from "../../resources/js/radio/stations";

/**
 * The showcase radio: the drawer toggle, the station list, no autoplay, the
 * persisted choice, now-playing from Icecast, and that the player's <audio>
 * element survives a page swap (the provider sits above every Inertia page).
 */

let host: HTMLDivElement;
let root: ReturnType<typeof createRoot>;
const fetchMock = vi.fn(async () => new Response(JSON.stringify({ icestats: { source: [] } }), { status: 200 }));

beforeEach(() => {
    localStorage.clear();
    fetchMock.mockClear();
    vi.stubGlobal("fetch", fetchMock);
    host = document.createElement("div");
    document.body.appendChild(host);
    root = createRoot(host);
});

afterEach(() => {
    act(() => root.unmount());
    host.remove();
    vi.unstubAllGlobals();
});

function Page({ name }: { name: string }) {
    return (
        <>
            <header className="nav">
                <RadioButton />
            </header>
            <main data-page={name}>{name}</main>
        </>
    );
}

async function render(name = "home") {
    await act(async () => {
        root.render(
            <RadioProvider>
                <Page name={name} />
            </RadioProvider>,
        );
    });
}

const toggle = () => host.querySelector<HTMLButtonElement>("[data-radio-toggle]")!;
const panel = () => host.querySelector<HTMLElement>("[data-radio-panel]")!;
const frame = () => panel().closest<HTMLElement>("[data-react-fancy-drawer-frame]")!;

describe("the radio drawer", () => {
    it("is react-fancy's Drawer, attached under the header rather than portalled, and kept mounted while closed", async () => {
        await render();
        // The panel IS the Drawer's dialog element: no Card stand-in.
        expect(panel().hasAttribute("data-react-fancy-drawer")).toBe(true);
        expect(panel().dataset.side).toBe("top");
        expect(panel().getAttribute("role")).toBe("dialog");
        expect(panel().id).toBe("site-radio");
        // container-attached: inside the app tree, in the fixed box that sits under the header.
        expect(host.contains(panel())).toBe(true);
        expect(panel().closest("[data-react-fancy-drawer-container]")?.classList.contains("radio-panel")).toBe(true);
        expect(host.querySelector("[data-react-fancy-card]")).toBeNull();
        // keepMounted: closed, the player is still in the tree.
        expect(frame().hidden).toBe(true);
        expect(panel().querySelector("audio")).not.toBeNull();
    });

    it("starts closed, inert and hidden, and toggles open from the header button", async () => {
        await render();
        expect(toggle().getAttribute("aria-expanded")).toBe("false");
        expect(panel().dataset.open).toBe("false");
        expect(frame().hasAttribute("inert")).toBe(true);
        expect(frame().getAttribute("aria-hidden")).toBe("true");
        expect(frame().hidden).toBe(true);

        await act(async () => toggle().click());
        expect(toggle().getAttribute("aria-expanded")).toBe("true");
        expect(panel().dataset.open).toBe("true");
        expect(frame().hasAttribute("inert")).toBe(false);
        expect(frame().hidden).toBe(false);
        expect(document.activeElement?.tagName).toBe("H2");

        await act(async () => document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" })));
        expect(panel().dataset.open).toBe("false");
        expect(toggle().getAttribute("aria-expanded")).toBe("false");
        expect(frame().hidden).toBe(true);
        expect(document.activeElement).toBe(toggle());
    });

    it("closes from the Drawer's own close button", async () => {
        await render();
        await act(async () => toggle().click());
        const close = panel().querySelector<HTMLButtonElement>("[data-react-fancy-drawer-close]")!;
        expect(close.getAttribute("aria-label")).toBe("Close the radio");
        await act(async () => close.click());
        expect(panel().dataset.open).toBe("false");
        expect(frame().hidden).toBe(true);
    });

    it("keeps the same <audio> element, still playing, across close and reopen", async () => {
        const play = vi.spyOn(HTMLMediaElement.prototype, "play").mockImplementation(() => Promise.resolve());
        const pause = vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
        await render();
        await act(async () => toggle().click());
        const audio = host.querySelector("audio");
        expect(audio).not.toBeNull();
        await act(async () => host.querySelector<HTMLElement>("[data-radio-station=locked-on]")!.click());
        await act(async () => panel().querySelector<HTMLButtonElement>("[data-streaming-control=play]")!.click());
        expect(toggle().dataset.radioPlaying).toBe("true");
        const pausesBefore = pause.mock.calls.length;

        await act(async () => toggle().click());
        expect(frame().hidden).toBe(true);
        expect(host.querySelector("audio")).toBe(audio);
        expect(toggle().dataset.radioPlaying).toBe("true");
        expect(pause.mock.calls.length).toBe(pausesBefore);

        await act(async () => toggle().click());
        expect(frame().hidden).toBe(false);
        expect(host.querySelector("audio")).toBe(audio);
        expect(host.querySelector<HTMLElement>("[data-react-fancy-streaming-audio]")!.dataset.streamingPlaying).toBe("true");
        play.mockRestore();
        pause.mockRestore();
    });

    it("lists Riverwest at 128k and HQ, then the three tracks, each with its own artwork", async () => {
        await render();
        const tiles = [...host.querySelectorAll<HTMLElement>("[data-radio-station]")];
        expect(tiles.map((t) => t.dataset.radioStation)).toEqual(["riverwest", "riverwest-hq", "no-second-life", "locked-on", "run-it-back"]);
        expect(tiles.map((t) => t.dataset.radioKind)).toEqual(["live", "live", "file", "file", "file"]);
        for (const tile of tiles) {
            const picture = tile.querySelector("picture")!;
            expect(picture.querySelector("source")?.getAttribute("type")).toBe("image/webp");
            expect(picture.querySelector("source")?.getAttribute("srcset")).toMatch(/-512\.webp 1x, .*-1024\.webp 2x$/);
            expect(picture.querySelector("img")?.getAttribute("src")).toMatch(/-512\.jpg$/);
        }
        expect(host.querySelector("[data-radio-cover=riverwest] img")?.getAttribute("src")).toBe("/radio/riverwest-radio-512.jpg");
        expect(host.querySelector("[data-radio-cover=locked-on] img")?.getAttribute("src")).toBe("/radio/thunder-in-the-garden-512.jpg");
    });

    it("links the live station to riverwestradio.com", async () => {
        await render();
        expect(host.querySelector("[data-radio-site]")?.getAttribute("href")).toBe("https://www.riverwestradio.com");
    });

    it("never autoplays: nothing is playing after load, even with a saved station", async () => {
        localStorage.setItem(RADIO_PREFS_KEY, JSON.stringify({ stationId: "locked-on", volume: 0.3, playing: true }));
        const play = vi.spyOn(HTMLMediaElement.prototype, "play").mockImplementation(() => Promise.resolve());
        await render();
        const player = host.querySelector<HTMLElement>("[data-react-fancy-streaming-audio]")!;
        expect(player.dataset.streamingStation).toBe("locked-on");
        expect(player.dataset.streamingPlaying).toBe("false");
        expect(host.querySelector("audio")?.autoplay).toBe(false);
        expect(play).not.toHaveBeenCalled();
        expect(toggle().dataset.radioPlaying).toBe("false");
        play.mockRestore();
    });

    it("renders on the server without touching the browser, closed and not playing", () => {
        const html = renderToString(
            <RadioProvider>
                <Page name="ssr" />
            </RadioProvider>,
        );
        expect(html).toContain('data-open="false"');
        expect(html).toContain('data-streaming-playing="false"');
        expect(html).not.toMatch(/<audio[^>]*\ssrc=/);
    });

    it("keeps the same <audio> element when the page under it changes", async () => {
        await render("home");
        const audio = host.querySelector("audio");
        expect(audio).not.toBeNull();
        await render("docs");
        expect(host.querySelector("[data-page]")?.textContent).toBe("docs");
        expect(host.querySelector("audio")).toBe(audio);
    });

    it("polls Icecast only while a live station is selected and the drawer is open", async () => {
        await render();
        expect(fetchMock).not.toHaveBeenCalled();
        await act(async () => toggle().click());
        expect(fetchMock).toHaveBeenCalledTimes(1);
        await act(async () => host.querySelector<HTMLElement>("[data-radio-station=run-it-back]")!.click());
        const calls = fetchMock.mock.calls.length;
        await act(async () => host.querySelector<HTMLElement>("[data-radio-station=run-it-back]")!.click());
        expect(fetchMock.mock.calls.length).toBe(calls);
    });
});

describe("now playing", () => {
    const status = {
        icestats: {
            source: [
                { listenurl: "https://radio.computer:8443/riverwestradio", title: "Night Shift" },
                { listenurl: "https://radio.computer:8443/riverwestradio-hq", title: "Night Shift HQ", artist: "DJ Example" },
            ],
        },
    };

    it("matches on listenurl, not on order", () => {
        expect(nowPlayingFrom(status, "https://radio.computer:8443/riverwestradio")).toBe("Night Shift");
        expect(nowPlayingFrom(status, "https://radio.computer:8443/riverwestradio-hq")).toBe("DJ Example - Night Shift HQ");
    });

    it("matches the mount when Icecast reports its internal address (the real Riverwest status)", () => {
        // Measured 2026-11-07: status-json.xsl lists http://radio.computer:8000/...
        // while listeners play https://radio.computer:8443/... A whole-URL match
        // never matched, so now-playing would never have shown.
        const real = {
            icestats: {
                source: [
                    { listenurl: "http://radio.computer:8000/riverwestradio", title: "Low Tide" },
                    { listenurl: "http://radio.computer:8000/riverwestradio-hq", title: "Low Tide HQ" },
                ],
            },
        };
        expect(nowPlayingFrom(real, "https://radio.computer:8443/riverwestradio")).toBe("Low Tide");
        expect(nowPlayingFrom(real, "https://radio.computer:8443/riverwestradio-hq")).toBe("Low Tide HQ");
    });

    it("accepts a single source object, and says nothing for an unknown mount or no title", () => {
        expect(nowPlayingFrom({ icestats: { source: { listenurl: "https://radio.computer:8443/riverwestradio/", title: "One" } } }, "https://radio.computer:8443/riverwestradio")).toBe("One");
        expect(nowPlayingFrom(status, "https://radio.computer:8443/other")).toBeUndefined();
        expect(nowPlayingFrom({ icestats: { source: [{ listenurl: "https://radio.computer:8443/riverwestradio" }] } }, "https://radio.computer:8443/riverwestradio")).toBeUndefined();
        expect(nowPlayingFrom(null, "x")).toBeUndefined();
    });
});

describe("saved preferences", () => {
    it("keeps a known station and a clamped volume, and ignores anything else", () => {
        expect(readPrefs(JSON.stringify({ stationId: "run-it-back", volume: 2 }))).toEqual({ stationId: "run-it-back", volume: 1 });
        expect(readPrefs(JSON.stringify({ stationId: "nope", volume: "loud" }))).toEqual({ stationId: "riverwest", volume: 0.8 });
        expect(readPrefs("not json")).toEqual({ stationId: "riverwest", volume: 0.8 });
        expect(readPrefs(null)).toEqual({ stationId: "riverwest", volume: 0.8 });
    });

    it("has no station without artwork", () => {
        for (const s of RADIO_STATIONS) {
            expect(s.artwork).toMatch(/^\/radio\/.+-512\.webp$/);
        }
    });
});
