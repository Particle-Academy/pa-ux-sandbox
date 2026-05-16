import { Action, Badge, Card, CardBody, CardHeader } from "@particle-academy/fancy-tsrx";

export function TsrxPilotDemo() {
  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">TSRX Pilot</h1>
      <p className="mb-6 max-w-3xl text-sm text-zinc-500">
        A pilot of <code className="text-xs">.tsrx</code> single-file components living in{" "}
        <code className="text-xs">@particle-academy/fancy-tsrx</code>. Each component below is
        authored as one <code className="text-xs">.tsrx</code> file and compiled at build time
        by <code className="text-xs">@tsrx/vite-plugin-react</code>. Tailwind classes still
        carry the styling so visuals match the React originals.
      </p>

      <Card className="mb-6">
        <CardHeader>
          <div className="text-sm font-semibold">Action (.tsrx)</div>
        </CardHeader>
        <CardBody>
          <div className="flex flex-wrap gap-2">
            <Action>Default</Action>
            <Action color="indigo">Indigo</Action>
            <Action color="emerald">Emerald</Action>
            <Action color="red">Red</Action>
            <Action variant="ghost">Ghost</Action>
            <Action variant="circle" color="indigo">+</Action>
            <Action size="sm">Small</Action>
            <Action size="lg">Large</Action>
            <Action disabled>Disabled</Action>
          </div>
        </CardBody>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <div className="text-sm font-semibold">Badge (.tsrx)</div>
        </CardHeader>
        <CardBody>
          <div className="flex flex-wrap items-center gap-2">
            <Badge>default</Badge>
            <Badge color="indigo">indigo</Badge>
            <Badge color="emerald">emerald</Badge>
            <Badge color="amber">amber</Badge>
            <Badge color="red">red</Badge>
            <Badge color="blue" size="sm">small</Badge>
            <Badge color="blue" size="lg">large</Badge>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <div className="text-sm font-semibold">Composed</div>
        </CardHeader>
        <CardBody>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-zinc-500">Build status</div>
              <div className="mt-1 flex items-center gap-2 text-base font-semibold">
                Tsrx pipeline <Badge color="emerald">healthy</Badge>
              </div>
            </div>
            <Action color="indigo" onClick={() => alert("clicked from a .tsrx file")}>
              Run again
            </Action>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
