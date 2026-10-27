/**
 * The JSON an agent would hand the writers: one document per format, in each
 * package's own schema (last-word's Doc, dark-slide's Deck). Plain data, so
 * the demo shows exactly what goes in.
 */

export const DOCX_SEED = {
    title: "Community garden: spring plan",
    blocks: [
        { type: "heading", level: 1, runs: [{ text: "Community garden: spring plan" }] },
        {
            type: "paragraph",
            runs: [
                { text: "Planting starts on the " },
                { text: "first dry weekend in April", bold: true },
                { text: ". Bring gloves; the shed has the rest." },
            ],
        },
        { type: "heading", level: 2, runs: [{ text: "Beds" }] },
        {
            type: "list",
            items: [
                { runs: [{ text: "North beds: beans and peas" }] },
                { runs: [{ text: "South beds: tomatoes" }], children: [{ runs: [{ text: "Stake them early" }] }] },
                { runs: [{ text: "Herb spiral: unchanged" }] },
            ],
        },
        {
            type: "table",
            rows: [
                {
                    header: true,
                    cells: [
                        { blocks: [{ type: "paragraph", runs: [{ text: "Task" }] }] },
                        { blocks: [{ type: "paragraph", runs: [{ text: "Who" }] }] },
                    ],
                },
                {
                    cells: [
                        { blocks: [{ type: "paragraph", runs: [{ text: "Turn the compost" }] }] },
                        { blocks: [{ type: "paragraph", runs: [{ text: "Sam" }] }] },
                    ],
                },
                {
                    cells: [
                        { blocks: [{ type: "paragraph", runs: [{ text: "Fix the water butt" }] }] },
                        { blocks: [{ type: "paragraph", runs: [{ text: "Priya" }] }] },
                    ],
                },
            ],
        },
        { type: "quote", blocks: [{ type: "paragraph", runs: [{ text: "Water in the morning, not at noon.", italic: true }] }] },
    ],
};

export const PPTX_SEED = {
    id: "garden-deck",
    title: "Community garden",
    theme: { name: "default" },
    slides: [
        {
            id: "s1",
            layout: "title",
            elements: [
                {
                    id: "t1",
                    type: "text",
                    x: 0.08,
                    y: 0.3,
                    w: 0.84,
                    h: 0.22,
                    content: "# Community garden",
                    format: "markdown",
                    style: { fontSize: 96 },
                },
                {
                    id: "t2",
                    type: "text",
                    x: 0.08,
                    y: 0.56,
                    w: 0.84,
                    h: 0.12,
                    content: "Spring plan, *first dry weekend in April*",
                    format: "markdown",
                    style: { fontSize: 44 },
                },
            ],
        },
        {
            id: "s2",
            elements: [
                {
                    id: "h",
                    type: "text",
                    x: 0.08,
                    y: 0.08,
                    w: 0.84,
                    h: 0.14,
                    content: "## Beds",
                    format: "markdown",
                    style: { fontSize: 72 },
                },
                {
                    id: "b",
                    type: "text",
                    x: 0.08,
                    y: 0.26,
                    w: 0.84,
                    h: 0.6,
                    content: "- North beds: **beans and peas**\n- South beds: tomatoes\n- Herb spiral: unchanged",
                    format: "markdown",
                    style: { fontSize: 44 },
                },
            ],
        },
    ],
};

export const MARKDOWN_SEED = `# Community garden: spring plan

Planting starts on the **first dry weekend in April**.

- North beds: beans and peas
- South beds: tomatoes

| Task | Who |
| --- | --- |
| Turn the compost | Sam |
`;

export const pretty = (value: unknown): string => JSON.stringify(value, null, 2);
