import { Skeleton } from "@particle-academy/react-fancy";
import { DemoSection } from "../components/DemoSection";

export function SkeletonDemo() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Skeleton</h1>

      <DemoSection title="Shapes" description="Rectangle, circle, and text shapes." code={`<Skeleton shape="rect" width={200} height={40} />
<Skeleton shape="circle" width={48} />
<Skeleton shape="text" />
<Skeleton shape="text" width="60%" />`}>
        <div className="space-y-4">
          <Skeleton shape="rect" width={200} height={40} />
          <Skeleton shape="circle" width={48} />
          <Skeleton shape="text" />
          <Skeleton shape="text" width="60%" />
        </div>
      </DemoSection>

      <DemoSection title="Card Skeleton" description="Composing skeletons to mock a card layout." code={`<Skeleton shape="circle" width={48} />
<Skeleton shape="text" width="70%" />
<Skeleton shape="text" />
<Skeleton shape="text" width="40%" />`}>
        <div className="flex items-start gap-4 max-w-sm">
          <Skeleton shape="circle" width={48} />
          <div className="flex-1 space-y-2">
            <Skeleton shape="text" width="70%" />
            <Skeleton shape="text" />
            <Skeleton shape="text" width="40%" />
          </div>
        </div>
      </DemoSection>
    </div>
  );
}
