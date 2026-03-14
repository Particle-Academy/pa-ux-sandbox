import { Emoji } from "@particle-academy/react-fancy";
import { DemoSection } from "../components/DemoSection";

export function EmojiDemo() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Emoji</h1>

      <DemoSection title="By Name" description="Resolve emoji by name.">
        <div className="flex items-center gap-4">
          <Emoji name="grinning face" size="xl" />
          <Emoji name="thumbs up" size="xl" />
          <Emoji name="rocket" size="xl" />
          <Emoji name="heart" size="xl" />
        </div>
      </DemoSection>

      <DemoSection title="Direct Emoji" description="Pass emoji character directly.">
        <div className="flex items-center gap-4">
          <Emoji emoji="🎉" size="sm" />
          <Emoji emoji="🎉" size="md" />
          <Emoji emoji="🎉" size="lg" />
          <Emoji emoji="🎉" size="xl" />
        </div>
      </DemoSection>
    </div>
  );
}
