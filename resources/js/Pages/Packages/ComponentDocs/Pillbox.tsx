import type { ComponentDoc } from "./types";
import { Pillbox } from "@particle-academy/react-fancy";

export const pillboxDoc: ComponentDoc = {
    intro: (
        <p>
            A multi-tag input — type a token, press Enter to add it as a pill, click the × to
            remove it. Backspace on the empty input pops the trailing pill. Great for tag
            editors, recipient lists, keyword filters.
        </p>
    ),
    examples: [
        {
            name: "Default",
            render: () => (
                <div className="w-full max-w-sm">
                    <Pillbox defaultValue={["typescript", "react", "tailwind"]} onChange={() => {}} placeholder="Add a tag…" />
                </div>
            ),
            code: `const [tags, setTags] = useState<string[]>([]);

<Pillbox
    value={tags}
    onChange={setTags}
    placeholder="Add a tag…"
/>`,
        },
        {
            name: "Max items",
            description: "Cap the number of pills the user can add.",
            render: () => (
                <div className="w-full max-w-sm">
                    <Pillbox defaultValue={["one", "two"]} maxItems={3} onChange={() => {}} placeholder="Up to 3 tags…" />
                </div>
            ),
            code: `<Pillbox value={tags} onChange={setTags} maxItems={3} />`,
        },
        {
            name: "Disabled",
            render: () => (
                <div className="w-full max-w-sm">
                    <Pillbox defaultValue={["pinned", "read-only"]} disabled />
                </div>
            ),
            code: `<Pillbox value={tags} onChange={setTags} disabled />`,
        },
    ],
    props: [
        { name: "value", type: `string[]`, default: "—", description: "Controlled tag list. Pair with `onChange`." },
        { name: "defaultValue", type: `string[]`, default: `[]`, description: "Initial tag list (uncontrolled)." },
        { name: "onChange", type: `(values: string[]) => void`, default: "—", description: "Called when tags are added / removed." },
        { name: "placeholder", type: `string`, default: "—", description: "Input placeholder shown when there are no pills." },
        { name: "maxItems", type: `number`, default: "—", description: "Cap total pills. The input is hidden once the cap is reached." },
        { name: "disabled", type: `boolean`, default: `false`, description: "Disable the input and the × buttons." },
        { name: "className", type: `string`, default: "—", description: "Extra classes on the root wrapper." },
    ],
};
