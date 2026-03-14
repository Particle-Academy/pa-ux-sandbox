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
    </div>
  );
}
