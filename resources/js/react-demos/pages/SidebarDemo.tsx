import { useState } from "react";
import {
  Sidebar,
  Badge,
} from "@particle-academy/react-fancy";
import {
  Home,
  FileText,
  Settings,
  Users,
  BarChart3,
  Mail,
  Bell,
  Shield,
  Database,
  CreditCard,
  HelpCircle,
  LogOut,
} from "lucide-react";
import { DemoSection } from "../components/DemoSection";

function SidebarExample({
  collapseMode,
  label,
}: {
  collapseMode: "icons" | "letters";
  label: string;
}) {
  const [active, setActive] = useState("dashboard");

  return (
    <div>
      <p className="mb-2 text-xs font-medium text-zinc-500">{label}</p>
      <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700">
        <Sidebar collapseMode={collapseMode} className="h-[420px]">
          <div className="flex items-center justify-between border-b border-zinc-200 px-3 py-2 dark:border-zinc-700">
            <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">App</span>
            <Sidebar.Toggle />
          </div>

          <div className="flex-1 overflow-y-auto p-1.5">
            <Sidebar.Group label="Main">
              <Sidebar.Item icon={<Home className="h-4 w-4" />} active={active === "dashboard"} onClick={() => setActive("dashboard")}>
                Dashboard
              </Sidebar.Item>
              <Sidebar.Item
                icon={<Mail className="h-4 w-4" />}
                active={active === "inbox"}
                onClick={() => setActive("inbox")}
                badge={<Badge size="xs" color="blue">5</Badge>}
              >
                Inbox
              </Sidebar.Item>
              <Sidebar.Item icon={<Users className="h-4 w-4" />} active={active === "users"} onClick={() => setActive("users")}>
                Users
              </Sidebar.Item>
              <Sidebar.Item icon={<BarChart3 className="h-4 w-4" />} active={active === "analytics"} onClick={() => setActive("analytics")}>
                Analytics
              </Sidebar.Item>
            </Sidebar.Group>

            <Sidebar.Group label="Admin">
              <Sidebar.Submenu label="Settings" icon={<Settings className="h-4 w-4" />} defaultOpen>
                <Sidebar.Item active={active === "general"} onClick={() => setActive("general")}>General</Sidebar.Item>
                <Sidebar.Item active={active === "security"} onClick={() => setActive("security")}>Security</Sidebar.Item>
                <Sidebar.Item active={active === "database"} onClick={() => setActive("database")}>Database</Sidebar.Item>
              </Sidebar.Submenu>
              <Sidebar.Item icon={<CreditCard className="h-4 w-4" />} active={active === "billing"} onClick={() => setActive("billing")}>
                Billing
              </Sidebar.Item>
              <Sidebar.Item icon={<Bell className="h-4 w-4" />} active={active === "notifications"} onClick={() => setActive("notifications")}>
                Notifications
              </Sidebar.Item>
            </Sidebar.Group>
          </div>

          <div className="border-t border-zinc-200 p-1.5 dark:border-zinc-700">
            <Sidebar.Item icon={<HelpCircle className="h-4 w-4" />}>Help</Sidebar.Item>
            <Sidebar.Item icon={<LogOut className="h-4 w-4" />}>Sign out</Sidebar.Item>
          </div>
        </Sidebar>
      </div>
    </div>
  );
}

export function SidebarDemo() {
  const [active, setActive] = useState("dashboard");
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Sidebar</h1>

      <DemoSection
        title="Collapsible Sidebar"
        description="Click the collapse toggle in the header. Supports 'icons' mode (shows icons, falls back to first 3 letters) and 'letters' mode (always shows first 3 letters)."
        code={`<Sidebar collapseMode="icons">
  <Sidebar.Toggle />
  <Sidebar.Group label="Main">
    <Sidebar.Item icon={<Home />} active>Dashboard</Sidebar.Item>
    <Sidebar.Item icon={<Mail />} badge={<Badge>5</Badge>}>Inbox</Sidebar.Item>
  </Sidebar.Group>
  <Sidebar.Submenu label="Settings" icon={<Settings />} defaultOpen>
    <Sidebar.Item>General</Sidebar.Item>
    <Sidebar.Item>Security</Sidebar.Item>
  </Sidebar.Submenu>
</Sidebar>`}
      >
        <div className="grid max-w-2xl grid-cols-2 gap-6">
          <SidebarExample collapseMode="icons" label={'collapseMode="icons" (default)'} />
          <SidebarExample collapseMode="letters" label={'collapseMode="letters"'} />
        </div>
      </DemoSection>

      <DemoSection
        title="Controlled Collapsed State"
        description="Use controlled collapsed prop with external toggle button."
        code={`const [collapsed, setCollapsed] = useState(false);

<button onClick={() => setCollapsed(c => !c)}>Toggle</button>
<Sidebar collapsed={collapsed} onCollapsedChange={setCollapsed}>
  ...
</Sidebar>`}
      >
        <div className="flex max-w-xl items-start gap-4">
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="shrink-0 rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {collapsed ? "Expand" : "Collapse"}
          </button>
          <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700">
            <Sidebar collapsed={collapsed} onCollapsedChange={setCollapsed} className="h-[300px]">
              <div className="flex-1 overflow-y-auto p-1.5">
                <Sidebar.Item icon={<Home className="h-4 w-4" />} active={active === "dashboard"} onClick={() => setActive("dashboard")}>
                  Dashboard
                </Sidebar.Item>
                <Sidebar.Item icon={<Mail className="h-4 w-4" />} active={active === "inbox"} onClick={() => setActive("inbox")}>
                  Inbox
                </Sidebar.Item>
                <Sidebar.Item icon={<Users className="h-4 w-4" />} active={active === "users"} onClick={() => setActive("users")}>
                  Users
                </Sidebar.Item>
                <Sidebar.Item icon={<Shield className="h-4 w-4" />} active={active === "security"} onClick={() => setActive("security")}>
                  Security
                </Sidebar.Item>
                <Sidebar.Item icon={<Database className="h-4 w-4" />} active={active === "database"} onClick={() => setActive("database")}>
                  Database
                </Sidebar.Item>
              </div>
            </Sidebar>
          </div>
        </div>
      </DemoSection>
    </div>
  );
}
