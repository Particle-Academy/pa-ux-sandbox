import { Carousel } from "@fancy/react";
import { DemoSection } from "../components/DemoSection";

export function NestedCarouselDemo() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-zinc-900 dark:text-zinc-100">Nested Carousel</h1>

      <DemoSection
        title="Independent Nested Carousels"
        description="Each Carousel provides its own context, so nested carousels operate independently."
      >
        <Carousel className="max-w-2xl">
          <Carousel.Panels>
            {/* Outer Slide 1 */}
            <Carousel.Slide>
              <div className="flex h-56 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/40">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200">
                    Outer Slide 1
                  </h3>
                  <p className="mt-1 text-sm text-blue-600 dark:text-blue-300">
                    A simple slide in the outer carousel.
                  </p>
                </div>
              </div>
            </Carousel.Slide>

            {/* Outer Slide 2 — contains nested carousel */}
            <Carousel.Slide>
              <div className="rounded-lg bg-emerald-50 p-4 dark:bg-emerald-900/20">
                <h3 className="mb-3 text-lg font-semibold text-emerald-800 dark:text-emerald-200">
                  Outer Slide 2 — Nested Carousel
                </h3>

                {/* Inner carousel */}
                <div className="rounded-lg border border-emerald-200 bg-white p-4 dark:border-emerald-700 dark:bg-zinc-900">
                  <p className="mb-3 text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    Inner Carousel
                  </p>
                  <Carousel>
                    <Carousel.Panels>
                      <Carousel.Slide>
                        <div className="flex h-32 items-center justify-center rounded-lg bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-200">
                          Inner Slide A
                        </div>
                      </Carousel.Slide>
                      <Carousel.Slide>
                        <div className="flex h-32 items-center justify-center rounded-lg bg-pink-100 text-pink-800 dark:bg-pink-900/40 dark:text-pink-200">
                          Inner Slide B
                        </div>
                      </Carousel.Slide>
                      <Carousel.Slide>
                        <div className="flex h-32 items-center justify-center rounded-lg bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-200">
                          Inner Slide C
                        </div>
                      </Carousel.Slide>
                    </Carousel.Panels>
                    <div className="mt-3 flex items-center justify-between">
                      <Carousel.Steps />
                      <Carousel.Controls />
                    </div>
                  </Carousel>
                </div>
              </div>
            </Carousel.Slide>

            {/* Outer Slide 3 */}
            <Carousel.Slide>
              <div className="flex h-56 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/40">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-amber-800 dark:text-amber-200">
                    Outer Slide 3
                  </h3>
                  <p className="mt-1 text-sm text-amber-600 dark:text-amber-300">
                    Back to a normal outer slide.
                  </p>
                </div>
              </div>
            </Carousel.Slide>
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
