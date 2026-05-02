import { Mindmap } from "@particle-academy/fancy-echarts";
import type { MindmapNode } from "@particle-academy/fancy-echarts";
import { DemoSection } from "../../components/DemoSection";

const productMap: MindmapNode = {
  id: "root",
  label: "Product",
  children: [
    {
      id: "ux",
      label: "UX",
      children: [
        { id: "ia",   label: "IA" },
        { id: "vis",  label: "Visual" },
        { id: "copy", label: "Copy" },
      ],
    },
    {
      id: "eng",
      label: "Engineering",
      children: [
        { id: "fe",   label: "Frontend" },
        { id: "be",   label: "Backend" },
        { id: "data", label: "Data" },
        { id: "infra", label: "Infra" },
      ],
    },
    {
      id: "biz",
      label: "Business",
      children: [
        { id: "sales", label: "Sales" },
        { id: "mkt",   label: "Marketing" },
      ],
    },
    { id: "ops", label: "Ops" },
  ],
};

const flat: MindmapNode = {
  id: "topic",
  label: "Climate Change",
  children: [
    { id: "causes",  label: "Causes" },
    { id: "effects", label: "Effects" },
    { id: "policy",  label: "Policy" },
    { id: "tech",    label: "Tech" },
    { id: "people",  label: "People" },
    { id: "biz",     label: "Business" },
  ],
};

export function MindmapDemo() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Mindmap</h1>

      <DemoSection
        title="Product taxonomy"
        description="Radial layout. Angular wedges are sized by subtree leaf count so dense branches (Engineering: 4 leaves) get more room than sparse ones (Ops: 1 leaf)."
        code={`<Mindmap
  root={{
    id: "root", label: "Product",
    children: [
      { id: "ux",  label: "UX",  children: [...] },
      { id: "eng", label: "Engineering", children: [...] },
      { id: "biz", label: "Business" },
      { id: "ops", label: "Ops" },
    ],
  }}
/>`}
      >
        <div style={{ height: 520 }}>
          <Mindmap root={productMap} />
        </div>
      </DemoSection>

      <DemoSection
        title="Flat brainstorm"
        description="Single ring around a root — even angular distribution when every child is a leaf."
        code={`<Mindmap root={{ id: "topic", label: "Climate", children: [...flatTopics] }} />`}
      >
        <div style={{ height: 420 }}>
          <Mindmap root={flat} />
        </div>
      </DemoSection>
    </div>
  );
}
