import { useState, useCallback } from "react";
import { Carousel } from "@fancy/react";
import { DemoSection } from "../components/DemoSection";

interface SlideData {
  id: string;
  label: string;
  color: string;
}

const gradients: Record<string, string> = {
  blue: "from-blue-500 to-blue-600",
  purple: "from-purple-500 to-purple-600",
  green: "from-green-500 to-green-600",
  orange: "from-orange-500 to-orange-600",
  pink: "from-pink-500 to-pink-600",
  cyan: "from-cyan-500 to-cyan-600",
  amber: "from-amber-500 to-amber-600",
  rose: "from-rose-500 to-rose-600",
  indigo: "from-indigo-500 to-indigo-600",
  teal: "from-teal-500 to-teal-600",
};

const colorPool = Object.keys(gradients);

let nextId = 4;

const initialSlides: SlideData[] = [
  { id: "1", label: "Slide 1", color: "blue" },
  { id: "2", label: "Slide 2", color: "purple" },
  { id: "3", label: "Slide 3", color: "green" },
];

export function DynamicCarouselDemo() {
  const [slides, setSlides] = useState<SlideData[]>(initialSlides);

  const prepend = useCallback(() => {
    const id = String(nextId++);
    const color = colorPool[Math.floor(Math.random() * colorPool.length)];
    setSlides((prev) => [
      { id, label: `Slide ${id}`, color },
      ...prev,
    ]);
  }, []);

  const append = useCallback(() => {
    const id = String(nextId++);
    const color = colorPool[Math.floor(Math.random() * colorPool.length)];
    setSlides((prev) => [
      ...prev,
      { id, label: `Slide ${id}`, color },
    ]);
  }, []);

  const removeFirst = useCallback(() => {
    setSlides((prev) => (prev.length > 1 ? prev.slice(1) : prev));
  }, []);

  const removeLast = useCallback(() => {
    setSlides((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));
  }, []);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-zinc-900 dark:text-zinc-100">Dynamic Carousel</h1>

      <DemoSection
        title="Dynamic Slides"
        description="Add and remove slides at runtime. The carousel automatically adjusts its state."
      >
        {/* Controls */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <div className="flex gap-1">
            <button
              onClick={prepend}
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            >
              Prepend
            </button>
            <button
              onClick={append}
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            >
              Append
            </button>
          </div>
          <div className="flex gap-1">
            <button
              onClick={removeFirst}
              disabled={slides.length <= 1}
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-40 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Remove First
            </button>
            <button
              onClick={removeLast}
              disabled={slides.length <= 1}
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-40 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Remove Last
            </button>
          </div>
          <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
            {slides.length} slides
          </span>
        </div>

        {/* Carousel */}
        <Carousel className="max-w-xl">
          <Carousel.Panels>
            {slides.map((slide) => (
              <Carousel.Slide key={slide.id}>
                <div
                  className={`flex h-48 items-center justify-center rounded-xl bg-gradient-to-br text-white ${gradients[slide.color] ?? "from-zinc-500 to-zinc-600"}`}
                >
                  <div className="text-center">
                    <h3 className="text-lg font-semibold">{slide.label}</h3>
                    <span className="mt-2 inline-block rounded-full border border-white/30 px-2.5 py-0.5 text-xs">
                      id: {slide.id}
                    </span>
                  </div>
                </div>
              </Carousel.Slide>
            ))}
          </Carousel.Panels>

          <div className="mt-4 flex items-center justify-between">
            <Carousel.Steps />
            <Carousel.Controls />
          </div>
        </Carousel>
      </DemoSection>
    </div>
  );
}
