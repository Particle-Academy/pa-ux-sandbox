import type { ComponentDoc } from "./types";
import { Carousel } from "@particle-academy/react-fancy";

const slides = [
    { name: "intro", title: "Welcome", body: "Slide one — introduce the experience." },
    { name: "features", title: "Features", body: "Slide two — show off what's inside." },
    { name: "finish", title: "Get started", body: "Slide three — call to action." },
];

export const carouselDoc: ComponentDoc = {
    intro: (
        <p>
            Slideshow with two variants — <code>directional</code> (next / prev arrows + dots)
            and <code>wizard</code> (numbered steps + finish). Compound:
            <code>Carousel.Panels</code> + <code>Carousel.Slide</code> for the content,
            <code>Carousel.Controls</code> / <code>Carousel.Steps</code> for navigation.
        </p>
    ),
    examples: [
        {
            name: "Directional (default)",
            description: "Looping slideshow with arrow controls and dot pagination.",
            render: () => (
                <div className="w-full max-w-md">
                    <Carousel>
                        <Carousel.Panels>
                            {slides.map((s) => (
                                <Carousel.Slide key={s.name} name={s.name}>
                                    <div className="grid h-32 place-items-center rounded-md border border-zinc-200 bg-zinc-50 p-4 text-center dark:border-zinc-800 dark:bg-zinc-900">
                                        <div>
                                            <div className="font-semibold">{s.title}</div>
                                            <div className="mt-1 text-xs text-zinc-500">{s.body}</div>
                                        </div>
                                    </div>
                                </Carousel.Slide>
                            ))}
                        </Carousel.Panels>
                        <Carousel.Controls className="mt-3" />
                    </Carousel>
                </div>
            ),
            code: `<Carousel>
    <Carousel.Panels>
        <Carousel.Slide name="intro">…</Carousel.Slide>
        <Carousel.Slide name="features">…</Carousel.Slide>
        <Carousel.Slide name="finish">…</Carousel.Slide>
    </Carousel.Panels>
    <Carousel.Controls />
</Carousel>`,
        },
        {
            name: "Wizard",
            description: "Step-numbered variant with a finish button on the last slide.",
            render: () => (
                <div className="w-full max-w-md">
                    <Carousel variant="wizard" loop={false}>
                        <Carousel.Steps className="mb-3" />
                        <Carousel.Panels>
                            {slides.map((s) => (
                                <Carousel.Slide key={s.name} name={s.name}>
                                    <div className="grid h-28 place-items-center rounded-md border border-zinc-200 bg-zinc-50 p-4 text-center dark:border-zinc-800 dark:bg-zinc-900">
                                        <div>
                                            <div className="font-semibold">{s.title}</div>
                                            <div className="mt-1 text-xs text-zinc-500">{s.body}</div>
                                        </div>
                                    </div>
                                </Carousel.Slide>
                            ))}
                        </Carousel.Panels>
                        <Carousel.Controls className="mt-3" finishLabel="Start" />
                    </Carousel>
                </div>
            ),
            code: `<Carousel variant="wizard" loop={false} onFinish={() => router.visit("/onboarding/done")}>
    <Carousel.Steps />
    <Carousel.Panels>
        <Carousel.Slide name="intro">…</Carousel.Slide>
        <Carousel.Slide name="features">…</Carousel.Slide>
        <Carousel.Slide name="finish">…</Carousel.Slide>
    </Carousel.Panels>
    <Carousel.Controls finishLabel="Start" />
</Carousel>`,
        },
        {
            name: "Auto-play",
            description: "Cycle through slides on a timer. Default `interval` is 4000ms.",
            render: () => (
                <div className="w-full max-w-md">
                    <Carousel autoPlay interval={3000}>
                        <Carousel.Panels>
                            {slides.map((s) => (
                                <Carousel.Slide key={s.name} name={s.name}>
                                    <div className="grid h-28 place-items-center rounded-md border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
                                        <div className="font-semibold">{s.title}</div>
                                    </div>
                                </Carousel.Slide>
                            ))}
                        </Carousel.Panels>
                        <Carousel.Controls className="mt-3" />
                    </Carousel>
                </div>
            ),
            code: `<Carousel autoPlay interval={3000}>
    <Carousel.Panels>…</Carousel.Panels>
    <Carousel.Controls />
</Carousel>`,
        },
        {
            name: "Control labels",
            description:
                "prevLabel and nextLabel replace the arrow controls' content — and, because they are the controls' accessible names, translating them is the difference between “Previous slide” and an unlabelled button in every non-English locale.",
            render: () => (
                <Carousel className="w-full">
                    <Carousel.Panels>
                        {["One", "Two", "Three"].map((label) => (
                            <Carousel.Slide key={label}>
                                <div className="flex h-32 items-center justify-center rounded-lg bg-zinc-100 text-sm dark:bg-zinc-800">
                                    {label}
                                </div>
                            </Carousel.Slide>
                        ))}
                    </Carousel.Panels>
                    <Carousel.Controls prevLabel="Zurück" nextLabel="Weiter" />
                </Carousel>
            ),
            code: `<Carousel.Controls prevLabel={t("previous")} nextLabel={t("next")} />`,
        },
        {
            name: "transition",
            description:
                "How panels change. “none” cuts straight to the next one, “fade” cross-fades. Prefer none where the panels are text a reader is mid-sentence in, and fade where they are images.",
            render: () => (
                <div className="w-full space-y-6">
                    {(["none", "fade"] as const).map((transition) => (
                        <div key={transition}>
                            <p className="mb-1 text-xs font-medium text-zinc-500">
                                transition="{transition}"
                            </p>
                            <Carousel>
                                <Carousel.Panels transition={transition}>
                                    {["A", "B", "C"].map((label) => (
                                        <Carousel.Slide key={label}>
                                            <div className="flex h-24 items-center justify-center rounded-lg bg-violet-100 text-sm dark:bg-violet-900/40">
                                                {label}
                                            </div>
                                        </Carousel.Slide>
                                    ))}
                                </Carousel.Panels>
                                <Carousel.Controls />
                            </Carousel>
                        </div>
                    ))}
                </div>
            ),
            code: `<Carousel.Panels transition="fade">
    <Carousel.Slide>…</Carousel.Slide>
</Carousel.Panels>`,
        },
    ],
    props: [
        { name: "children", type: `ReactNode`, default: "—", description: "Compound parts — `Carousel.Panels`, `Carousel.Slide`, `Carousel.Controls`, `Carousel.Steps`." },
        { name: "defaultIndex", type: `number`, default: `0`, description: "Initial slide (uncontrolled)." },
        { name: "activeIndex", type: `number`, default: "—", description: "Controlled active slide. Pair with `onIndexChange`." },
        { name: "onIndexChange", type: `(index: number) => void`, default: "—", description: "Called when the active slide changes." },
        { name: "autoPlay", type: `boolean`, default: `false`, description: "Cycle through slides automatically." },
        { name: "interval", type: `number`, default: `4000`, description: "Auto-play interval in ms." },
        { name: "loop", type: `boolean`, default: `true`, description: "Loop from last to first. Set false for wizard flows." },
        { name: "variant", type: `"directional" | "wizard"`, default: `"directional"`, description: "Direction-only or numbered-step UX." },
        { name: "onFinish", type: `() => void`, default: "—", description: "Wizard only — fires when the user clicks finish on the last slide." },
        { name: "headless", type: `boolean`, default: `false`, description: "Disable default styling on `Carousel.Slide`. Use when wrapping the slide in your own container." },
        { name: "className", type: `string`, default: "—", description: "Extra classes on the root wrapper." },
        { name: "Carousel.Controls — prevLabel", type: `ReactNode`, default: "—", description: "Content and accessible name of the previous control." },
        { name: "Carousel.Controls — nextLabel", type: `ReactNode`, default: "—", description: "Content and accessible name of the next control." },
        { name: "Carousel.Panels — transition", type: `"none" | "fade"`, default: `"none"`, description: "How panels change." },
    ],
};
