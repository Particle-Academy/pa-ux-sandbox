import { useState } from "react";
import { Pillbox } from "@particle-academy/react-fancy";
import { DemoSection } from "../components/DemoSection";

export function PillboxDemo() {
  const [tags, setTags] = useState(["react", "typescript"]);
  const [skills, setSkills] = useState<string[]>([]);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Pillbox</h1>

      <DemoSection title="Basic" description="Type and press Enter to add tags. Backspace to remove." code={`<Pillbox value={tags} onChange={setTags} placeholder="Add a tag..." />`}>
        <div className="max-w-md">
          <Pillbox
            value={tags}
            onChange={setTags}
            placeholder="Add a tag..."
          />
          <p className="mt-2 text-sm text-zinc-500">Tags: {tags.join(", ") || "none"}</p>
        </div>
      </DemoSection>

      <DemoSection title="Max Items" description="Limited to 5 items." code={`<Pillbox value={skills} onChange={setSkills} maxItems={5} placeholder="Add up to 5 skills..." />`}>
        <div className="max-w-md">
          <Pillbox
            value={skills}
            onChange={setSkills}
            maxItems={5}
            placeholder="Add up to 5 skills..."
          />
          <p className="mt-2 text-sm text-zinc-500">{skills.length}/5 skills added</p>
        </div>
      </DemoSection>

      <DemoSection title="Disabled" description="Pillbox in disabled state." code={`<Pillbox value={["read-only", "cannot-edit"]} disabled />`}>
        <div className="max-w-md">
          <Pillbox
            value={["read-only", "cannot-edit"]}
            disabled
          />
        </div>
      </DemoSection>
    </div>
  );
}
