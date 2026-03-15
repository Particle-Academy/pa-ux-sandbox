import { useState } from "react";
import {
  Menu,
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
  Palette,
} from "lucide-react";
import { DemoSection } from "../components/DemoSection";

export function MenuDemo() {
  const [activeH, setActiveH] = useState("home");
  const [activeV, setActiveV] = useState("dashboard");

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Menu</h1>

      <DemoSection
        title="Horizontal Menu"
        description="Horizontal menu with items and submenus. Submenus appear on hover."
        code={`<Menu orientation="horizontal">
  <Menu.Item icon={<Home />} active>Home</Menu.Item>
  <Menu.Item icon={<FileText />}>Pages</Menu.Item>
  <Menu.Submenu label="Settings" icon={<Settings />}>
    <Menu.Item>General</Menu.Item>
    <Menu.Item>Security</Menu.Item>
  </Menu.Submenu>
</Menu>`}
      >
        <Menu orientation="horizontal">
          <Menu.Item icon={<Home className="h-4 w-4" />} active={activeH === "home"} onClick={() => setActiveH("home")}>
            Home
          </Menu.Item>
          <Menu.Item icon={<FileText className="h-4 w-4" />} active={activeH === "pages"} onClick={() => setActiveH("pages")}>
            Pages
          </Menu.Item>
          <Menu.Item icon={<Users className="h-4 w-4" />} active={activeH === "users"} onClick={() => setActiveH("users")}>
            Users
          </Menu.Item>
          <Menu.Submenu label="Settings" icon={<Settings className="h-4 w-4" />}>
            <Menu.Item icon={<Shield className="h-4 w-4" />} onClick={() => setActiveH("security")}>Security</Menu.Item>
            <Menu.Item icon={<Database className="h-4 w-4" />} onClick={() => setActiveH("database")}>Database</Menu.Item>
            <Menu.Item icon={<Palette className="h-4 w-4" />} onClick={() => setActiveH("theme")}>Theme</Menu.Item>
          </Menu.Submenu>
          <Menu.Item icon={<BarChart3 className="h-4 w-4" />} active={activeH === "analytics"} onClick={() => setActiveH("analytics")}>
            Analytics
          </Menu.Item>
        </Menu>
      </DemoSection>

      <DemoSection
        title="Vertical Menu"
        description="Vertical menu with groups, submenus (accordion-style), badges, and disabled items."
        code={`<Menu orientation="vertical">
  <Menu.Group label="Main">
    <Menu.Item icon={<Home />} active>Dashboard</Menu.Item>
    <Menu.Item icon={<Mail />} badge={<Badge size="xs">3</Badge>}>Inbox</Menu.Item>
  </Menu.Group>
  <Menu.Submenu label="Settings" icon={<Settings />} defaultOpen>
    <Menu.Item>General</Menu.Item>
    <Menu.Item>Security</Menu.Item>
  </Menu.Submenu>
</Menu>`}
      >
        <div className="max-w-xs">
          <Menu orientation="vertical">
            <Menu.Group label="Main">
              <Menu.Item icon={<Home className="h-4 w-4" />} active={activeV === "dashboard"} onClick={() => setActiveV("dashboard")}>
                Dashboard
              </Menu.Item>
              <Menu.Item
                icon={<Mail className="h-4 w-4" />}
                active={activeV === "inbox"}
                onClick={() => setActiveV("inbox")}
                badge={<Badge size="xs" color="blue">3</Badge>}
              >
                Inbox
              </Menu.Item>
              <Menu.Item icon={<Users className="h-4 w-4" />} active={activeV === "users"} onClick={() => setActiveV("users")}>
                Users
              </Menu.Item>
              <Menu.Item icon={<BarChart3 className="h-4 w-4" />} active={activeV === "analytics"} onClick={() => setActiveV("analytics")}>
                Analytics
              </Menu.Item>
            </Menu.Group>

            <Menu.Group label="Settings">
              <Menu.Submenu label="Configuration" icon={<Settings className="h-4 w-4" />} defaultOpen>
                <Menu.Item active={activeV === "general"} onClick={() => setActiveV("general")}>General</Menu.Item>
                <Menu.Item active={activeV === "security"} onClick={() => setActiveV("security")}>Security</Menu.Item>
                <Menu.Item active={activeV === "database"} onClick={() => setActiveV("database")}>Database</Menu.Item>
              </Menu.Submenu>
              <Menu.Item icon={<Bell className="h-4 w-4" />} active={activeV === "notifications"} onClick={() => setActiveV("notifications")}>
                Notifications
              </Menu.Item>
              <Menu.Item icon={<Palette className="h-4 w-4" />} disabled>
                Theme (coming soon)
              </Menu.Item>
            </Menu.Group>
          </Menu>
        </div>
      </DemoSection>
    </div>
  );
}
