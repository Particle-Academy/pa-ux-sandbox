import { Timeline } from "@particle-academy/react-fancy";
import { DemoSection } from "../components/DemoSection";

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function CircleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="12" r="6" />
    </svg>
  );
}

export function TimelineDemo() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Timeline</h1>

      <DemoSection title="Basic" description="Simple timeline with colored dots." code={`<Timeline>
  <Timeline.Item color="green">
    <p>Order placed</p>
  </Timeline.Item>
  <Timeline.Item color="blue" active>
    <p>Shipped</p>
  </Timeline.Item>
  <Timeline.Item color="zinc">
    <p>Delivered</p>
  </Timeline.Item>
</Timeline>`}>
        <Timeline>
          <Timeline.Item color="green">
            <p className="font-medium">Order placed</p>
            <p className="text-sm text-zinc-500">March 10, 2026</p>
          </Timeline.Item>
          <Timeline.Item color="green">
            <p className="font-medium">Payment confirmed</p>
            <p className="text-sm text-zinc-500">March 10, 2026</p>
          </Timeline.Item>
          <Timeline.Item color="blue" active>
            <p className="font-medium">Shipped</p>
            <p className="text-sm text-zinc-500">March 12, 2026</p>
          </Timeline.Item>
          <Timeline.Item color="zinc">
            <p className="font-medium text-zinc-400">Delivered</p>
            <p className="text-sm text-zinc-400">Pending</p>
          </Timeline.Item>
        </Timeline>
      </DemoSection>

      <DemoSection title="With Icons" description="Custom icons on timeline items." code={`<Timeline>
  <Timeline.Item icon={<CheckIcon />} color="green">
    Done step
  </Timeline.Item>
  <Timeline.Item icon={<CircleIcon />} color="blue" active>
    Current step
  </Timeline.Item>
  <Timeline.Item color="zinc">
    Upcoming step
  </Timeline.Item>
</Timeline>`}>
        <Timeline>
          <Timeline.Item icon={<CheckIcon />} color="green">
            <p className="font-medium">Requirements gathered</p>
            <p className="text-sm text-zinc-500">Completed on Feb 1</p>
          </Timeline.Item>
          <Timeline.Item icon={<CheckIcon />} color="green">
            <p className="font-medium">Design approved</p>
            <p className="text-sm text-zinc-500">Completed on Feb 15</p>
          </Timeline.Item>
          <Timeline.Item icon={<CircleIcon />} color="blue" active>
            <p className="font-medium">Development in progress</p>
            <p className="text-sm text-zinc-500">Started March 1</p>
          </Timeline.Item>
          <Timeline.Item color="zinc">
            <p className="font-medium text-zinc-400">Testing</p>
            <p className="text-sm text-zinc-400">Not started</p>
          </Timeline.Item>
        </Timeline>
      </DemoSection>

      <DemoSection title="Blocks" description="Rich content blocks for detailed timeline entries." code={`<Timeline>
  <Timeline.Block heading="v2.0 Released" icon={<CheckIcon />} color="green">
    Major release with new features.
  </Timeline.Block>
  <Timeline.Block heading="In Progress" color="blue" active>
    Analytics module merged.
  </Timeline.Block>
</Timeline>`}>
        <Timeline>
          <Timeline.Block
            heading="v2.0.0 Released"
            icon={<CheckIcon />}
            color="green"
          >
            Major release with new dashboard, API v2, and performance improvements.
            Migration guide published.
          </Timeline.Block>
          <Timeline.Block
            heading="Security Patch Applied"
            icon={<CheckIcon />}
            color="green"
          >
            CVE-2026-1234 patched in authentication module. All users updated automatically.
          </Timeline.Block>
          <Timeline.Block
            heading="Feature Branch Merged"
            color="blue"
            active
          >
            <p>The analytics module has been merged into main.</p>
            <ul className="mt-2 list-inside list-disc text-zinc-500 dark:text-zinc-400">
              <li>Real-time event tracking</li>
              <li>Custom dashboard widgets</li>
              <li>Export to CSV/PDF</li>
            </ul>
          </Timeline.Block>
          <Timeline.Block
            heading="Upcoming: Mobile App Launch"
            color="zinc"
          >
            iOS and Android apps scheduled for next quarter. Beta testing begins soon.
          </Timeline.Block>
        </Timeline>
      </DemoSection>
    </div>
  );
}
