import { Card, Action } from "@particle-academy/react-fancy";
import { DemoSection } from "../components/DemoSection";

export function CardDemo() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Card</h1>

      <DemoSection title="Variants" description="Outlined, elevated, and flat styles." code={`<Card variant="outlined">
  <Card.Header>Title</Card.Header>
  <Card.Body>Content</Card.Body>
</Card>
<Card variant="elevated">...</Card>
<Card variant="flat">...</Card>`}>
        <div className="grid grid-cols-3 gap-4">
          <Card variant="outlined">
            <Card.Header>Outlined</Card.Header>
            <Card.Body>Default card style with a border.</Card.Body>
          </Card>
          <Card variant="elevated">
            <Card.Header>Elevated</Card.Header>
            <Card.Body>Card with shadow elevation.</Card.Body>
          </Card>
          <Card variant="flat">
            <Card.Header>Flat</Card.Header>
            <Card.Body>Subtle background, no border.</Card.Body>
          </Card>
        </div>
      </DemoSection>

      <DemoSection title="Full Card" description="Header, body, and footer composition." code={`<Card>
  <Card.Header>Title</Card.Header>
  <Card.Body>Content here.</Card.Body>
  <Card.Footer>
    <Action size="sm">View Details</Action>
  </Card.Footer>
</Card>`}>
        <Card className="max-w-sm">
          <Card.Header>
            <h3 className="font-semibold">Project Update</h3>
            <p className="text-sm text-zinc-500">Last updated 2 hours ago</p>
          </Card.Header>
          <Card.Body>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              The latest deployment has been completed successfully. All tests passed
              and the new features are live in production.
            </p>
          </Card.Body>
          <Card.Footer>
            <div className="flex gap-2">
              <Action size="sm">View Details</Action>
              <Action size="sm" href="#">Share</Action>
            </div>
          </Card.Footer>
        </Card>
      </DemoSection>

      <DemoSection title="Padding" description="Control inner padding." code={`<Card padding="sm">...</Card>
<Card padding="md">...</Card>
<Card padding="lg">...</Card>`}>
        <div className="grid grid-cols-3 gap-4">
          <Card padding="sm">
            <Card.Body>Small padding</Card.Body>
          </Card>
          <Card padding="md">
            <Card.Body>Medium padding</Card.Body>
          </Card>
          <Card padding="lg">
            <Card.Body>Large padding</Card.Body>
          </Card>
        </div>
      </DemoSection>
    </div>
  );
}
