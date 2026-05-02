import { OrgChart } from "@particle-academy/fancy-echarts";
import type { OrgChartNode } from "@particle-academy/fancy-echarts";
import { DemoSection } from "../../components/DemoSection";

const company: OrgChartNode = {
  id: "ceo",
  label: "CEO",
  children: [
    {
      id: "cto",
      label: "CTO",
      children: [
        { id: "fe-mgr", label: "FE Mgr" },
        { id: "be-mgr", label: "BE Mgr", children: [{ id: "be1", label: "Sr. Eng" }, { id: "be2", label: "Eng" }] },
        { id: "data-mgr", label: "Data Mgr" },
      ],
    },
    {
      id: "cfo",
      label: "CFO",
      children: [
        { id: "ar", label: "AR" },
        { id: "ap", label: "AP" },
      ],
    },
    {
      id: "cmo",
      label: "CMO",
      children: [
        { id: "growth",  label: "Growth" },
        { id: "content", label: "Content" },
        { id: "brand",   label: "Brand" },
      ],
    },
  ],
};

const taxonomy: OrgChartNode = {
  id: "animal",
  label: "Animalia",
  children: [
    {
      id: "chordata",
      label: "Chordata",
      children: [
        { id: "mammal", label: "Mammalia", children: [{ id: "primate", label: "Primates" }, { id: "carnivore", label: "Carnivora" }] },
        { id: "aves",   label: "Aves" },
      ],
    },
    { id: "arthropoda", label: "Arthropoda", children: [{ id: "insecta", label: "Insecta" }] },
  ],
};

export function OrgChartDemo() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">OrgChart</h1>

      <DemoSection
        title="Company hierarchy"
        description="Tidy-tree top-down layout. Each parent sits centered over the span of its descendants; manhattan-routed connectors with a triangle marker on the child end."
        code={`<OrgChart
  root={{
    id: "ceo", label: "CEO",
    children: [
      { id: "cto", label: "CTO", children: [...] },
      { id: "cfo", label: "CFO", children: [...] },
      { id: "cmo", label: "CMO", children: [...] },
    ],
  }}
/>`}
      >
        <div style={{ height: 520 }}>
          <OrgChart root={company} />
        </div>
      </DemoSection>

      <DemoSection
        title="Asymmetric tree"
        description="Layout handles uneven branches — Chordata's subtree is wider than Arthropoda's, so the parents are placed accordingly."
        code={`<OrgChart root={taxonomy} />`}
      >
        <div style={{ height: 460 }}>
          <OrgChart root={taxonomy} />
        </div>
      </DemoSection>
    </div>
  );
}
