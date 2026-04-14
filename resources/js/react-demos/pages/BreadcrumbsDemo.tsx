import { Breadcrumbs } from "@particle-academy/react-fancy";
import { DemoSection } from "../components/DemoSection";

export function BreadcrumbsDemo() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Breadcrumbs</h1>

      <DemoSection title="Basic" description="Simple breadcrumb navigation trail." code={`<Breadcrumbs>
  <Breadcrumbs.Item href="#">Home</Breadcrumbs.Item>
  <Breadcrumbs.Item href="#">Products</Breadcrumbs.Item>
  <Breadcrumbs.Item active>Widget Pro</Breadcrumbs.Item>
</Breadcrumbs>`}>
        <Breadcrumbs>
          <Breadcrumbs.Item href="#">Home</Breadcrumbs.Item>
          <Breadcrumbs.Item href="#">Products</Breadcrumbs.Item>
          <Breadcrumbs.Item active>Widget Pro</Breadcrumbs.Item>
        </Breadcrumbs>
      </DemoSection>

      <DemoSection title="Deep Nesting" description="Multi-level breadcrumb path." code={`<Breadcrumbs>
  <Breadcrumbs.Item href="#">Dashboard</Breadcrumbs.Item>
  <Breadcrumbs.Item href="#">Settings</Breadcrumbs.Item>
  <Breadcrumbs.Item href="#">Team</Breadcrumbs.Item>
  <Breadcrumbs.Item href="#">Members</Breadcrumbs.Item>
  <Breadcrumbs.Item active>John Doe</Breadcrumbs.Item>
</Breadcrumbs>`}>
        <Breadcrumbs>
          <Breadcrumbs.Item href="#">Dashboard</Breadcrumbs.Item>
          <Breadcrumbs.Item href="#">Settings</Breadcrumbs.Item>
          <Breadcrumbs.Item href="#">Team</Breadcrumbs.Item>
          <Breadcrumbs.Item href="#">Members</Breadcrumbs.Item>
          <Breadcrumbs.Item active>John Doe</Breadcrumbs.Item>
        </Breadcrumbs>
      </DemoSection>

      <DemoSection title="Custom Separator" description="Using a custom separator character." code={`<Breadcrumbs separator={<span>/</span>}>
  <Breadcrumbs.Item href="#">src</Breadcrumbs.Item>
  <Breadcrumbs.Item href="#">components</Breadcrumbs.Item>
  <Breadcrumbs.Item active>Button.tsx</Breadcrumbs.Item>
</Breadcrumbs>`}>
        <Breadcrumbs separator={<span className="text-zinc-400">/</span>}>
          <Breadcrumbs.Item href="#">src</Breadcrumbs.Item>
          <Breadcrumbs.Item href="#">components</Breadcrumbs.Item>
          <Breadcrumbs.Item active>Button.tsx</Breadcrumbs.Item>
        </Breadcrumbs>
      </DemoSection>

      <DemoSection title="Shrink" description="Collapses middle items into a dropdown on narrow screens. Resize the browser to see the mobile dropdown." code={`<Breadcrumbs shrink>
  <Breadcrumbs.Item href="#">Home</Breadcrumbs.Item>
  <Breadcrumbs.Item href="#">Category</Breadcrumbs.Item>
  <Breadcrumbs.Item href="#">Subcategory</Breadcrumbs.Item>
  <Breadcrumbs.Item href="#">Products</Breadcrumbs.Item>
  <Breadcrumbs.Item active>Current Page</Breadcrumbs.Item>
</Breadcrumbs>`}>
        <Breadcrumbs shrink>
          <Breadcrumbs.Item href="#">Home</Breadcrumbs.Item>
          <Breadcrumbs.Item href="#">Category</Breadcrumbs.Item>
          <Breadcrumbs.Item href="#">Subcategory</Breadcrumbs.Item>
          <Breadcrumbs.Item href="#">Products</Breadcrumbs.Item>
          <Breadcrumbs.Item active>Current Page</Breadcrumbs.Item>
        </Breadcrumbs>
      </DemoSection>
    </div>
  );
}
