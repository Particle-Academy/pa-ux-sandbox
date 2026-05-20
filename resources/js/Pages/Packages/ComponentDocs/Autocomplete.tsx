import type { ComponentDoc } from "./types";
import { Autocomplete } from "@particle-academy/react-fancy";

const fruits = [
    { value: "apple", label: "Apple" },
    { value: "banana", label: "Banana" },
    { value: "blueberry", label: "Blueberry" },
    { value: "cherry", label: "Cherry" },
    { value: "dragonfruit", label: "Dragonfruit" },
    { value: "grape", label: "Grape" },
    { value: "kiwi", label: "Kiwi" },
    { value: "mango", label: "Mango" },
    { value: "orange", label: "Orange" },
    { value: "papaya", label: "Papaya" },
    { value: "pear", label: "Pear" },
    { value: "strawberry", label: "Strawberry" },
];

export const autocompleteDoc: ComponentDoc = {
    intro: (
        <p>
            A type-to-filter combobox. Pass a static <code>options</code> list (filtering is
            handled internally), or pair with <code>onSearch</code> to fetch from a server.
            Controlled (<code>value</code> + <code>onChange</code>) or uncontrolled
            (<code>defaultValue</code>).
        </p>
    ),
    examples: [
        {
            name: "Default",
            description: "Static list — internal filter matches on the option `label`.",
            render: () => (
                <div className="w-full max-w-sm">
                    <Autocomplete options={fruits} placeholder="Pick a fruit…" />
                </div>
            ),
            code: `const fruits = [
    { value: "apple", label: "Apple" },
    { value: "banana", label: "Banana" },
    …
];

<Autocomplete options={fruits} placeholder="Pick a fruit…" />`,
        },
        {
            name: "Controlled",
            description: "Bind `value` + `onChange` to your own state.",
            render: () => (
                <div className="w-full max-w-sm">
                    <Autocomplete value="kiwi" onChange={() => {}} options={fruits} />
                </div>
            ),
            code: `const [value, setValue] = useState("kiwi");

<Autocomplete value={value} onChange={setValue} options={fruits} />`,
        },
        {
            name: "Server-side search",
            description: "Use `onSearch` to debounce-fetch options on each keystroke.",
            render: () => (
                <div className="w-full max-w-sm">
                    <Autocomplete options={fruits.slice(0, 4)} onSearch={() => {}} placeholder="Type to search…" />
                </div>
            ),
            code: `const [options, setOptions] = useState<AutocompleteOption[]>([]);
const [loading, setLoading] = useState(false);

const onSearch = useDebounce(async (query) => {
    setLoading(true);
    const res = await fetch(\`/api/search?q=\${encodeURIComponent(query)}\`);
    setOptions(await res.json());
    setLoading(false);
}, 200);

<Autocomplete options={options} loading={loading} onSearch={onSearch} />`,
        },
        {
            name: "Empty message",
            description: "Override the no-results message with a string or any ReactNode.",
            render: () => (
                <div className="w-full max-w-sm">
                    <Autocomplete options={[]} emptyMessage="Nothing matches — try a different word." />
                </div>
            ),
            code: `<Autocomplete options={[]} emptyMessage="Nothing matches." />`,
        },
        {
            name: "Disabled",
            render: () => (
                <div className="w-full max-w-sm">
                    <Autocomplete options={fruits} disabled placeholder="Disabled" />
                </div>
            ),
            code: `<Autocomplete options={fruits} disabled />`,
        },
    ],
    props: [
        { name: "options", type: `AutocompleteOption[]`, default: "—", description: "Options list — `{ value, label, disabled? }`." },
        { name: "value", type: `string`, default: "—", description: "Controlled selected `value`. Use with `onChange`." },
        { name: "defaultValue", type: `string`, default: "—", description: "Initial selected `value` (uncontrolled)." },
        { name: "onChange", type: `(value: string) => void`, default: "—", description: "Called when a user picks an option." },
        { name: "onSearch", type: `(query: string) => void`, default: "—", description: "Called as the user types. Use for server-side search." },
        { name: "placeholder", type: `string`, default: "—", description: "Input placeholder." },
        { name: "loading", type: `boolean`, default: `false`, description: "Show a loading spinner in the popover." },
        { name: "emptyMessage", type: `ReactNode`, default: `"No results"`, description: "Message when there are no matching options." },
        { name: "disabled", type: `boolean`, default: `false`, description: "Disable the input." },
        { name: "className", type: `string`, default: "—", description: "Extra classes on the input wrapper." },
    ],
};
