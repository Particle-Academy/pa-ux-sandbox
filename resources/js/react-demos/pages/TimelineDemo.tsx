import { Timeline } from "@particle-academy/react-fancy";
import type { TimelineEvent } from "@particle-academy/react-fancy";
import { DemoSection } from "../components/DemoSection";

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function RocketIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
      <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
    </svg>
  );
}

const companyTimeline: TimelineEvent[] = [
  { date: "January 2020", title: "Company Founded", description: "Started with a small team of three in a garage.", emoji: "🚀", color: "blue" },
  { date: "June 2020", title: "First Product Launch", description: "Released our MVP to early adopters.", color: "green" },
  { date: "March 2021", title: "Seed Round", description: "Raised $2M from angel investors.", color: "amber" },
  { date: "November 2021", title: "Team Growth", description: "Expanded to 25 team members across 3 countries.", color: "purple" },
  { date: "July 2022", title: "Series A", description: "Raised $15M led by top-tier VC.", emoji: "💰", color: "emerald" },
  { date: "January 2023", title: "Platform v2.0", description: "Complete rebuild with 10x performance improvements.", color: "sky" },
  { date: "2024", title: "Going Global", description: "Expanded to 50+ countries with localized support.", emoji: "🌍", color: "indigo" },
];

const roadmap: TimelineEvent[] = [
  { date: "Q1 2025", title: "API v3", description: "New REST + GraphQL API with improved rate limiting.", color: "blue" },
  { date: "Q2 2025", title: "Mobile App", description: "Native iOS and Android applications.", color: "violet" },
  { date: "Q3 2025", title: "Enterprise Features", description: "SSO, audit logs, and advanced permissions.", color: "amber" },
  { date: "Q4 2025", title: "AI Integration", description: "Smart automation and predictive analytics.", color: "rose" },
];

const simpleEvents: TimelineEvent[] = [
  { date: "2020", title: "Founded" },
  { date: "2021", title: "First Customer" },
  { date: "2022", title: "Profitability" },
  { date: "2023", title: "Series A" },
  { date: "2024", title: "100K Users" },
];

export function TimelineDemo() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Timeline</h1>

      <DemoSection title="Horizontal (data-driven)" description="Scrollable horizontal timeline with emoji and color accents. Scroll with mouse wheel." code={`<Timeline events={events} variant="horizontal" />`}>
        <Timeline events={companyTimeline} variant="horizontal" />
      </DemoSection>

      <DemoSection title="Horizontal Minimal" description="Simple horizontal timeline with just dates and titles." code={`<Timeline events={simpleEvents} variant="horizontal" />`}>
        <Timeline events={simpleEvents} variant="horizontal" />
      </DemoSection>

      <DemoSection title="Stacked (data-driven)" description="Default vertical layout using the events prop." code={`<Timeline events={events} />`}>
        <Timeline events={companyTimeline} />
      </DemoSection>

      <DemoSection title="Alternating (data-driven)" description="Events alternate left and right on desktop." code={`<Timeline events={events} variant="alternating" />`}>
        <Timeline events={companyTimeline} variant="alternating" />
      </DemoSection>

      <DemoSection title="With Heading" description="Timeline with built-in heading and description." code={`<Timeline events={roadmap} heading="Product Roadmap" description="What we're building next." />`}>
        <Timeline events={roadmap} heading="Product Roadmap" description="What we're building next." />
      </DemoSection>

      <DemoSection title="Compound Components" description="Compose timeline items manually with full control." code={`<Timeline>
  <Timeline.Item color="green" icon={<CheckIcon />} date="Feb 1">
    <p className="font-medium">Requirements gathered</p>
  </Timeline.Item>
  <Timeline.Item color="blue" active date="March 1">
    <p className="font-medium">Development in progress</p>
  </Timeline.Item>
  <Timeline.Item color="zinc">
    <p className="font-medium text-zinc-400">Testing</p>
  </Timeline.Item>
</Timeline>`}>
        <Timeline>
          <Timeline.Item icon={<CheckIcon />} color="green" date="Feb 1">
            <p className="font-medium">Requirements gathered</p>
            <p className="text-sm text-zinc-500">Completed on schedule</p>
          </Timeline.Item>
          <Timeline.Item icon={<CheckIcon />} color="green" date="Feb 15">
            <p className="font-medium">Design approved</p>
            <p className="text-sm text-zinc-500">Stakeholders signed off</p>
          </Timeline.Item>
          <Timeline.Item icon={<RocketIcon />} color="blue" active date="March 1">
            <p className="font-medium">Development in progress</p>
            <p className="text-sm text-zinc-500">Sprint 3 of 5</p>
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
</Timeline>`}>
        <Timeline>
          <Timeline.Block heading="v2.0.0 Released" icon={<CheckIcon />} color="green">
            Major release with new dashboard, API v2, and performance improvements.
          </Timeline.Block>
          <Timeline.Block heading="Security Patch" icon={<CheckIcon />} color="green">
            CVE-2026-1234 patched in authentication module.
          </Timeline.Block>
          <Timeline.Block heading="Feature Merged" color="blue" active>
            <p>Analytics module merged into main.</p>
            <ul className="mt-2 list-inside list-disc text-zinc-500 dark:text-zinc-400">
              <li>Real-time event tracking</li>
              <li>Custom dashboard widgets</li>
              <li>Export to CSV/PDF</li>
            </ul>
          </Timeline.Block>
          <Timeline.Block heading="Upcoming: Mobile Launch" color="zinc">
            iOS and Android apps scheduled for next quarter.
          </Timeline.Block>
        </Timeline>
      </DemoSection>

      <DemoSection title="No Animation" description="Disable scroll-reveal animation." code={`<Timeline events={roadmap} animated={false} />`}>
        <Timeline events={roadmap} animated={false} />
      </DemoSection>
    </div>
  );
}
