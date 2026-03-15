import { Heading } from "@particle-academy/react-fancy";
import { DemoSection } from "../components/DemoSection";

export function HeadingDemo() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Heading</h1>

      <DemoSection title="Levels" description="Semantic heading levels using the as prop." code={`<Heading as="h1" size="2xl">Heading 1</Heading>
<Heading as="h2" size="xl">Heading 2</Heading>
<Heading as="h3" size="lg">Heading 3</Heading>`}>
        <div className="space-y-2">
          <Heading as="h1" size="2xl">Heading 1 (2xl)</Heading>
          <Heading as="h2" size="xl">Heading 2 (xl)</Heading>
          <Heading as="h3" size="lg">Heading 3 (lg)</Heading>
          <Heading as="h4" size="md">Heading 4 (md)</Heading>
          <Heading as="h5" size="sm">Heading 5 (sm)</Heading>
          <Heading as="h6" size="xs">Heading 6 (xs)</Heading>
        </div>
      </DemoSection>

      <DemoSection title="Weights" description="Different font weights." code={`<Heading weight="semibold">Semibold weight</Heading>
<Heading weight="bold">Bold weight</Heading>`}>
        <div className="space-y-2">
          <Heading weight="normal">Normal weight</Heading>
          <Heading weight="medium">Medium weight</Heading>
          <Heading weight="semibold">Semibold weight</Heading>
          <Heading weight="bold">Bold weight</Heading>
        </div>
      </DemoSection>
    </div>
  );
}
