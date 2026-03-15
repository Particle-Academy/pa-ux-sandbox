import { Accordion } from "@particle-academy/react-fancy";
import { DemoSection } from "../components/DemoSection";

export function AccordionDemo() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Accordion</h1>

      <DemoSection title="Single" description="Only one item open at a time." code={`<Accordion type="single" defaultOpen={["faq-1"]}>
  <Accordion.Item value="faq-1">
    <Accordion.Trigger>Question?</Accordion.Trigger>
    <Accordion.Content>Answer.</Accordion.Content>
  </Accordion.Item>
</Accordion>`}>
        <Accordion type="single" defaultOpen={["faq-1"]} className="max-w-lg">
          <Accordion.Item value="faq-1">
            <Accordion.Trigger>What is React Fancy?</Accordion.Trigger>
            <Accordion.Content>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                React Fancy is a component library built with React and Tailwind CSS,
                designed for building beautiful UIs quickly.
              </p>
            </Accordion.Content>
          </Accordion.Item>
          <Accordion.Item value="faq-2">
            <Accordion.Trigger>Is it accessible?</Accordion.Trigger>
            <Accordion.Content>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Yes! All components follow WAI-ARIA patterns and support keyboard navigation.
              </p>
            </Accordion.Content>
          </Accordion.Item>
          <Accordion.Item value="faq-3">
            <Accordion.Trigger>Can I customize the styles?</Accordion.Trigger>
            <Accordion.Content>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Absolutely. Every component accepts a className prop and uses Tailwind CSS
                classes that you can override.
              </p>
            </Accordion.Content>
          </Accordion.Item>
        </Accordion>
      </DemoSection>

      <DemoSection title="Multiple" description="Multiple items can be open simultaneously." code={`<Accordion type="multiple" defaultOpen={["a", "b"]}>
  <Accordion.Item value="a">
    <Accordion.Trigger>Section A</Accordion.Trigger>
    <Accordion.Content>Content A</Accordion.Content>
  </Accordion.Item>
  <Accordion.Item value="b">
    <Accordion.Trigger>Section B</Accordion.Trigger>
    <Accordion.Content>Content B</Accordion.Content>
  </Accordion.Item>
</Accordion>`}>
        <Accordion type="multiple" defaultOpen={["a", "b"]} className="max-w-lg">
          <Accordion.Item value="a">
            <Accordion.Trigger>Section A</Accordion.Trigger>
            <Accordion.Content>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                This section is open by default along with Section B.
              </p>
            </Accordion.Content>
          </Accordion.Item>
          <Accordion.Item value="b">
            <Accordion.Trigger>Section B</Accordion.Trigger>
            <Accordion.Content>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Both sections can remain open at the same time.
              </p>
            </Accordion.Content>
          </Accordion.Item>
          <Accordion.Item value="c">
            <Accordion.Trigger>Section C</Accordion.Trigger>
            <Accordion.Content>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Click to expand this section without collapsing others.
              </p>
            </Accordion.Content>
          </Accordion.Item>
        </Accordion>
      </DemoSection>
    </div>
  );
}
