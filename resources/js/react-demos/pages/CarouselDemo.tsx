import { Carousel } from "@particle-academy/react-fancy";
import { DemoSection } from "../components/DemoSection";

const slides = [
  { bg: "bg-blue-100 dark:bg-blue-900", label: "Slide 1" },
  { bg: "bg-emerald-100 dark:bg-emerald-900", label: "Slide 2" },
  { bg: "bg-amber-100 dark:bg-amber-900", label: "Slide 3" },
  { bg: "bg-rose-100 dark:bg-rose-900", label: "Slide 4" },
];

export function CarouselDemo() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Carousel</h1>

      <DemoSection
        title="Basic Carousel"
        description="Compound component with slides, controls, and step indicators."
        code={`<Carousel>
  <Carousel.Panels>
    <Carousel.Slide>Slide 1</Carousel.Slide>
    <Carousel.Slide>Slide 2</Carousel.Slide>
  </Carousel.Panels>
  <Carousel.Steps />
  <Carousel.Controls />
</Carousel>`}
      >
        <Carousel className="max-w-lg">
          <Carousel.Panels>
            {slides.map((slide) => (
              <Carousel.Slide key={slide.label}>
                <div
                  className={`flex h-48 items-center justify-center rounded-lg text-lg font-medium ${slide.bg}`}
                >
                  {slide.label}
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

      <DemoSection
        title="AutoPlay"
        description="Carousel auto-advances every 3 seconds. Pauses on hover."
        code={`<Carousel autoPlay interval={3000}>
  <Carousel.Panels>
    <Carousel.Slide>...</Carousel.Slide>
  </Carousel.Panels>
  <Carousel.Controls />
</Carousel>`}
      >
        <Carousel className="max-w-lg" autoPlay interval={3000}>
          <Carousel.Panels>
            {slides.map((slide) => (
              <Carousel.Slide key={slide.label}>
                <div
                  className={`flex h-48 items-center justify-center rounded-lg text-lg font-medium ${slide.bg}`}
                >
                  {slide.label}
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

      <DemoSection
        title="Loop"
        description="Wraps around from last slide back to first."
        code={`<Carousel loop>
  <Carousel.Panels>
    <Carousel.Slide>...</Carousel.Slide>
  </Carousel.Panels>
  <Carousel.Controls />
</Carousel>`}
      >
        <Carousel className="max-w-lg" loop>
          <Carousel.Panels>
            {slides.map((slide) => (
              <Carousel.Slide key={slide.label}>
                <div
                  className={`flex h-48 items-center justify-center rounded-lg text-lg font-medium ${slide.bg}`}
                >
                  {slide.label}
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

      <DemoSection
        title="AutoPlay + Loop"
        description="Combines autoPlay and loop for continuous cycling."
        code={`<Carousel autoPlay interval={2000} loop>
  <Carousel.Panels>
    <Carousel.Slide>...</Carousel.Slide>
  </Carousel.Panels>
  <Carousel.Controls />
</Carousel>`}
      >
        <Carousel className="max-w-lg" autoPlay interval={2000} loop>
          <Carousel.Panels>
            {slides.map((slide) => (
              <Carousel.Slide key={slide.label}>
                <div
                  className={`flex h-48 items-center justify-center rounded-lg text-lg font-medium ${slide.bg}`}
                >
                  {slide.label}
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

      <DemoSection
        title="Wizard Variant"
        description='Using variant="wizard" for step-based navigation with named slides.'
        code={`<Carousel variant="wizard">
  <Carousel.Steps />
  <Carousel.Panels>
    <Carousel.Slide name="Account">Step 1</Carousel.Slide>
    <Carousel.Slide name="Profile">Step 2</Carousel.Slide>
    <Carousel.Slide name="Confirm">Step 3</Carousel.Slide>
  </Carousel.Panels>
  <Carousel.Controls />
</Carousel>`}
      >
        <Carousel className="max-w-lg" variant="wizard">
          <Carousel.Steps />
          <Carousel.Panels>
            <Carousel.Slide name="Account">
              <div className="flex h-48 items-center justify-center rounded-lg bg-violet-100 text-lg font-medium dark:bg-violet-900">
                Step 1: Account Details
              </div>
            </Carousel.Slide>
            <Carousel.Slide name="Profile">
              <div className="flex h-48 items-center justify-center rounded-lg bg-cyan-100 text-lg font-medium dark:bg-cyan-900">
                Step 2: Profile Setup
              </div>
            </Carousel.Slide>
            <Carousel.Slide name="Confirm">
              <div className="flex h-48 items-center justify-center rounded-lg bg-emerald-100 text-lg font-medium dark:bg-emerald-900">
                Step 3: Confirmation
              </div>
            </Carousel.Slide>
          </Carousel.Panels>
          <div className="mt-4 flex justify-end">
            <Carousel.Controls />
          </div>
        </Carousel>
      </DemoSection>
    </div>
  );
}
