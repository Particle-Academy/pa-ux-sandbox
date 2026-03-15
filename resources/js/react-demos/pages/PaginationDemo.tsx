import { useState } from "react";
import { Pagination } from "@particle-academy/react-fancy";
import { DemoSection } from "../components/DemoSection";

export function PaginationDemo() {
  const [page1, setPage1] = useState(1);
  const [page2, setPage2] = useState(5);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Pagination</h1>

      <DemoSection title="Basic" description="Simple pagination with few pages." code={`<Pagination page={page} onPageChange={setPage} totalPages={5} />`}>
        <Pagination page={page1} onPageChange={setPage1} totalPages={5} />
        <p className="mt-2 text-sm text-zinc-500">Current page: {page1}</p>
      </DemoSection>

      <DemoSection title="Many Pages" description="Pagination with ellipsis for large datasets." code={`<Pagination page={page} onPageChange={setPage} totalPages={20} />`}>
        <Pagination page={page2} onPageChange={setPage2} totalPages={20} />
        <p className="mt-2 text-sm text-zinc-500">Current page: {page2}</p>
      </DemoSection>

      <DemoSection title="Custom Siblings" description="Show more page numbers around the current page." code={`<Pagination page={page} onPageChange={setPage} totalPages={20} siblingCount={2} />`}>
        <Pagination page={page2} onPageChange={setPage2} totalPages={20} siblingCount={2} />
      </DemoSection>
    </div>
  );
}
