import { Text } from "@particle-academy/react-fancy";
import { DemoSection } from "../components/DemoSection";

export function TextDemo() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Text</h1>

      <DemoSection title="Colors" description="Semantic color variants." code={`<Text color="default">Default text</Text>
<Text color="muted">Muted text</Text>
<Text color="accent">Accent text</Text>
<Text color="success">Success text</Text>
<Text color="danger">Danger text</Text>`}>
        <div className="space-y-1">
          <Text color="default">Default text color</Text>
          <Text color="muted">Muted text for secondary information</Text>
          <Text color="accent">Accent text for emphasis</Text>
          <Text color="success">Success text for positive feedback</Text>
          <Text color="danger">Danger text for errors and warnings</Text>
        </div>
      </DemoSection>

      <DemoSection title="Sizes" description="Available text sizes." code={`<Text size="xs">Extra small</Text>
<Text size="sm">Small</Text>
<Text size="md">Medium</Text>
<Text size="lg">Large</Text>`}>
        <div className="space-y-1">
          <Text size="xs">Extra small text</Text>
          <Text size="sm">Small text</Text>
          <Text size="md">Medium text (default)</Text>
          <Text size="lg">Large text</Text>
        </div>
      </DemoSection>

      <DemoSection title="Weights" description="Font weight options." code={`<Text weight="normal">Normal</Text>
<Text weight="medium">Medium</Text>
<Text weight="semibold">Semibold</Text>
<Text weight="bold">Bold</Text>`}>
        <div className="space-y-1">
          <Text weight="normal">Normal weight</Text>
          <Text weight="medium">Medium weight</Text>
          <Text weight="semibold">Semibold weight</Text>
          <Text weight="bold">Bold weight</Text>
        </div>
      </DemoSection>
    </div>
  );
}
