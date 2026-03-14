import { useState } from "react";
import { EmojiSelect } from "@particle-academy/react-fancy";
import { DemoSection } from "../components/DemoSection";

export function EmojiSelectDemo() {
  const [emoji, setEmoji] = useState("");

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">EmojiSelect</h1>

      <DemoSection
        title="Searchable Picker"
        description="Dropdown emoji picker with category browsing and search."
      >
        <EmojiSelect value={emoji} onChange={setEmoji} />
        {emoji && (
          <p className="mt-3 text-sm text-zinc-500">
            Selected: <span className="text-2xl">{emoji}</span>
          </p>
        )}
      </DemoSection>
    </div>
  );
}
