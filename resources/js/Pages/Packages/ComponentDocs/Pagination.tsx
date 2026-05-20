import type { ComponentDoc } from "./types";
import { Pagination } from "@particle-academy/react-fancy";

export const paginationDoc: ComponentDoc = {
    intro: (
        <p>
            Page-number navigation for paged lists / tables. Controlled — pass the current
            <code>page</code> and an <code>onPageChange</code> handler. Long page ranges
            collapse to first/last + neighbors (the <code>siblingCount</code> on either side
            of the active page).
        </p>
    ),
    examples: [
        {
            name: "Default",
            render: () => <Pagination page={3} onPageChange={() => {}} totalPages={10} />,
            code: `const [page, setPage] = useState(1);

<Pagination page={page} onPageChange={setPage} totalPages={10} />`,
        },
        {
            name: "Short range",
            description: "When the total fits, all page numbers are shown.",
            render: () => <Pagination page={2} onPageChange={() => {}} totalPages={5} />,
            code: `<Pagination page={2} onPageChange={setPage} totalPages={5} />`,
        },
        {
            name: "Long range",
            description: "Deep paginations collapse — first + ellipsis + neighbors + ellipsis + last.",
            render: () => <Pagination page={42} onPageChange={() => {}} totalPages={100} />,
            code: `<Pagination page={42} onPageChange={setPage} totalPages={100} />`,
        },
        {
            name: "Sibling count",
            description: "`siblingCount` controls how many neighbors flank the active page.",
            render: () => (
                <div className="space-y-2">
                    <Pagination page={42} onPageChange={() => {}} totalPages={100} siblingCount={0} />
                    <Pagination page={42} onPageChange={() => {}} totalPages={100} siblingCount={2} />
                </div>
            ),
            code: `<Pagination page={42} onPageChange={setPage} totalPages={100} siblingCount={0} />
<Pagination page={42} onPageChange={setPage} totalPages={100} siblingCount={2} />`,
        },
    ],
    props: [
        { name: "page", type: `number`, default: "—", description: "Current page (1-indexed). Required." },
        { name: "onPageChange", type: `(page: number) => void`, default: "—", description: "Called when the user clicks a page or arrow. Required." },
        { name: "totalPages", type: `number`, default: "—", description: "Total number of pages. Required." },
        { name: "siblingCount", type: `number`, default: `1`, description: "Number of page links shown on each side of the active page. Higher = wider control." },
        { name: "className", type: `string`, default: "—", description: "Extra classes on the root nav element." },
    ],
};
