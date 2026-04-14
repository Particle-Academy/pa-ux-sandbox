import { Avatar } from "@particle-academy/react-fancy";
import { DemoSection } from "../components/DemoSection";

export function AvatarDemo() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Avatar</h1>

      <DemoSection title="Sizes" description="Available avatar sizes." code={`<Avatar size="xs" fallback="XS" />
<Avatar size="sm" fallback="SM" />
<Avatar size="md" fallback="MD" />
<Avatar size="lg" fallback="LG" />
<Avatar size="xl" fallback="XL" />`}>
        <div className="flex items-end gap-3">
          <Avatar size="xs" fallback="XS" />
          <Avatar size="sm" fallback="SM" />
          <Avatar size="md" fallback="MD" />
          <Avatar size="lg" fallback="LG" />
          <Avatar size="xl" fallback="XL" />
        </div>
      </DemoSection>

      <DemoSection title="With Image" description="Avatar displaying an image." code={`<Avatar size="lg" src="https://i.pravatar.cc/150?u=alice" alt="Alice" />
<Avatar size="lg" src="https://i.pravatar.cc/150?u=bob" alt="Bob" />
<Avatar size="lg" src="https://i.pravatar.cc/150?u=carol" alt="Carol" />`}>
        <div className="flex items-center gap-3">
          <Avatar
            size="lg"
            src="https://i.pravatar.cc/150?u=alice"
            alt="Alice"
          />
          <Avatar
            size="lg"
            src="https://i.pravatar.cc/150?u=bob"
            alt="Bob"
          />
          <Avatar
            size="lg"
            src="https://i.pravatar.cc/150?u=carol"
            alt="Carol"
          />
        </div>
      </DemoSection>

      <DemoSection title="Status" description="Online status indicators." code={`<Avatar size="lg" fallback="ON" status="online" />
<Avatar size="lg" fallback="AW" status="away" />
<Avatar size="lg" fallback="BS" status="busy" />
<Avatar size="lg" fallback="OF" status="offline" />`}>
        <div className="flex items-center gap-3">
          <Avatar size="lg" fallback="ON" status="online" />
          <Avatar size="lg" fallback="AW" status="away" />
          <Avatar size="lg" fallback="BS" status="busy" />
          <Avatar size="lg" fallback="OF" status="offline" />
        </div>
      </DemoSection>
    </div>
  );
}
