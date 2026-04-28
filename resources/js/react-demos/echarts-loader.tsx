import { registerAll } from "@particle-academy/fancy-echarts";
import { Outlet } from "react-router";

registerAll();

export default function EChartsLayout() {
  return <Outlet />;
}
