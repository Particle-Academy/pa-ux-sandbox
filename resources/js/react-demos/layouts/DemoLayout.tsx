import { Outlet } from "react-router";
import { Sidebar } from "../components/Sidebar";

export function DemoLayout() {
  return (
    <div className="flex min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <Sidebar />
      <main className="ml-56 flex-1 overflow-y-auto p-8">
        <Outlet />
      </main>
    </div>
  );
}
