import { registerAll } from "@particle-academy/react-echarts";
import { Outlet } from "react-router";

registerAll();

export default function EChartsLayout() {
  return <Outlet />;
}
