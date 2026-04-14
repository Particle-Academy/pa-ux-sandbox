import { Badge } from "@particle-academy/react-fancy";
import { DemoSection } from "../components/DemoSection";

export function BadgeDemo() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Badge</h1>

      <DemoSection title="Variants" description="Soft, solid, and outline styles." code={`<Badge variant="soft" color="blue">Soft</Badge>
<Badge variant="solid" color="blue">Solid</Badge>
<Badge variant="outline" color="blue">Outline</Badge>`}>
        <div className="flex flex-wrap gap-2">
          <Badge variant="soft" color="blue">Soft</Badge>
          <Badge variant="solid" color="blue">Solid</Badge>
          <Badge variant="outline" color="blue">Outline</Badge>
        </div>
      </DemoSection>

      <DemoSection title="Colors" description="All available color options." code={`<Badge color="zinc">zinc</Badge>
<Badge color="red">red</Badge>
<Badge color="blue">blue</Badge>
<Badge color="green">green</Badge>`}>
        <div className="flex flex-wrap gap-2">
          {(["zinc", "red", "blue", "green", "amber", "violet", "rose"] as const).map((color) => (
            <Badge key={color} color={color}>{color}</Badge>
          ))}
        </div>
      </DemoSection>

      <DemoSection title="Sizes" description="Small, medium, and large badges." code={`<Badge size="sm">Small</Badge>
<Badge size="md">Medium</Badge>
<Badge size="lg">Large</Badge>`}>
        <div className="flex items-center gap-2">
          <Badge size="sm">Small</Badge>
          <Badge size="md">Medium</Badge>
          <Badge size="lg">Large</Badge>
        </div>
      </DemoSection>

      <DemoSection title="With Dot" description="Status indicator dot." code={`<Badge dot color="green">Active</Badge>
<Badge dot color="amber">Pending</Badge>
<Badge dot color="red">Error</Badge>
<Badge dot color="zinc">Inactive</Badge>`}>
        <div className="flex flex-wrap gap-2">
          <Badge dot color="green">Active</Badge>
          <Badge dot color="amber">Pending</Badge>
          <Badge dot color="red">Error</Badge>
          <Badge dot color="zinc">Inactive</Badge>
        </div>
      </DemoSection>
    </div>
  );
}
