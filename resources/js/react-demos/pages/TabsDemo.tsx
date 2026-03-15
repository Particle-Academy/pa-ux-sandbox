import { Tabs } from "@particle-academy/react-fancy";
import { DemoSection } from "../components/DemoSection";

export function TabsDemo() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Tabs</h1>

      <DemoSection title="Underline Variant" description="Default tab style with an underline indicator." code={`<Tabs defaultTab="overview" variant="underline">
  <Tabs.List>
    <Tabs.Tab value="overview">Overview</Tabs.Tab>
    <Tabs.Tab value="features">Features</Tabs.Tab>
  </Tabs.List>
  <Tabs.Panels>
    <Tabs.Panel value="overview">Overview content</Tabs.Panel>
    <Tabs.Panel value="features">Features content</Tabs.Panel>
  </Tabs.Panels>
</Tabs>`}>
        <Tabs defaultTab="overview" variant="underline">
          <Tabs.List>
            <Tabs.Tab value="overview">Overview</Tabs.Tab>
            <Tabs.Tab value="features">Features</Tabs.Tab>
            <Tabs.Tab value="pricing">Pricing</Tabs.Tab>
          </Tabs.List>
          <Tabs.Panels>
            <Tabs.Panel value="overview">
              <p className="py-4 text-sm text-zinc-600 dark:text-zinc-400">
                Welcome to the overview tab. This provides a high-level summary of the product.
              </p>
            </Tabs.Panel>
            <Tabs.Panel value="features">
              <p className="py-4 text-sm text-zinc-600 dark:text-zinc-400">
                Explore the key features that make this product stand out.
              </p>
            </Tabs.Panel>
            <Tabs.Panel value="pricing">
              <p className="py-4 text-sm text-zinc-600 dark:text-zinc-400">
                Choose a plan that fits your needs starting at $9/month.
              </p>
            </Tabs.Panel>
          </Tabs.Panels>
        </Tabs>
      </DemoSection>

      <DemoSection title="Pills Variant (Segmented Control)" description="Renders as a segmented control with pill-shaped active indicator." code={`<Tabs defaultTab="general" variant="pills">
  <Tabs.List>
    <Tabs.Tab value="general">General</Tabs.Tab>
    <Tabs.Tab value="security">Security</Tabs.Tab>
    <Tabs.Tab value="notifications">Notifications</Tabs.Tab>
  </Tabs.List>
  <Tabs.Panels>
    <Tabs.Panel value="general">General content</Tabs.Panel>
    <Tabs.Panel value="security">Security content</Tabs.Panel>
  </Tabs.Panels>
</Tabs>`}>
        <Tabs defaultTab="tab1" variant="pills">
          <Tabs.List>
            <Tabs.Tab value="tab1">General</Tabs.Tab>
            <Tabs.Tab value="tab2">Security</Tabs.Tab>
            <Tabs.Tab value="tab3">Notifications</Tabs.Tab>
          </Tabs.List>
          <Tabs.Panels>
            <Tabs.Panel value="tab1">
              <p className="py-4 text-sm text-zinc-600 dark:text-zinc-400">General settings panel content.</p>
            </Tabs.Panel>
            <Tabs.Panel value="tab2">
              <p className="py-4 text-sm text-zinc-600 dark:text-zinc-400">Security settings panel content.</p>
            </Tabs.Panel>
            <Tabs.Panel value="tab3">
              <p className="py-4 text-sm text-zinc-600 dark:text-zinc-400">Notification preferences panel content.</p>
            </Tabs.Panel>
          </Tabs.Panels>
        </Tabs>
      </DemoSection>
    </div>
  );
}
