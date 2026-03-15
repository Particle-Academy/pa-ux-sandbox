import { Profile } from "@particle-academy/react-fancy";
import { DemoSection } from "../components/DemoSection";

export function ProfileDemo() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Profile</h1>

      <DemoSection title="Basic" description="Avatar with name and subtitle." code={`<Profile src="https://i.pravatar.cc/150" name="Jane Cooper" subtitle="Software Engineer" />`}>
        <Profile
          src="https://i.pravatar.cc/150?u=jane"
          name="Jane Cooper"
          subtitle="Software Engineer"
        />
      </DemoSection>

      <DemoSection title="Sizes" description="Profile at different sizes." code={`<Profile size="sm" fallback="SM" name="Small Profile" subtitle="Compact" />
<Profile size="md" fallback="MD" name="Medium Profile" subtitle="Default size" />
<Profile size="lg" fallback="LG" name="Large Profile" subtitle="More prominent" />`}>
        <div className="space-y-4">
          <Profile size="sm" fallback="SM" name="Small Profile" subtitle="Compact" />
          <Profile size="md" fallback="MD" name="Medium Profile" subtitle="Default size" />
          <Profile size="lg" fallback="LG" name="Large Profile" subtitle="More prominent" />
        </div>
      </DemoSection>

      <DemoSection title="With Status" description="Shows online presence." code={`<Profile src="..." name="Alice Johnson" subtitle="Online now" status="online" />
<Profile src="..." name="Bob Smith" subtitle="Away" status="away" />
<Profile fallback="CD" name="Carol Davis" subtitle="Busy" status="busy" />`}>
        <div className="space-y-3">
          <Profile
            src="https://i.pravatar.cc/150?u=alice"
            name="Alice Johnson"
            subtitle="Online now"
            status="online"
          />
          <Profile
            src="https://i.pravatar.cc/150?u=bob"
            name="Bob Smith"
            subtitle="Away for lunch"
            status="away"
          />
          <Profile
            fallback="CD"
            name="Carol Davis"
            subtitle="In a meeting"
            status="busy"
          />
        </div>
      </DemoSection>
    </div>
  );
}
