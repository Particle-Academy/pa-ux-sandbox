import { useState } from "react";
import {
  Menu,
  Badge,
  Icon,
} from "@particle-academy/react-fancy";
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
  <Menu.Item icon={<Icon name="home" size="sm" />} active>Home</Menu.Item>
  <Menu.Item icon={<Icon name="file-text" size="sm" />}>Pages</Menu.Item>
  <Menu.Submenu label="Settings" icon={<Icon name="settings" size="sm" />}>
    <Menu.Item>General</Menu.Item>
    <Menu.Item>Security</Menu.Item>
  </Menu.Submenu>
</Menu>`}
      >
        <Menu orientation="horizontal">
          <Menu.Item icon={<Icon name="home" size="sm" />} active={activeH === "home"} onClick={() => setActiveH("home")}>
            Home
          </Menu.Item>
          <Menu.Item icon={<Icon name="file-text" size="sm" />} active={activeH === "pages"} onClick={() => setActiveH("pages")}>
            Pages
          </Menu.Item>
          <Menu.Item icon={<Icon name="users" size="sm" />} active={activeH === "users"} onClick={() => setActiveH("users")}>
            Users
          </Menu.Item>
          <Menu.Submenu label="Settings" icon={<Icon name="settings" size="sm" />}>
            <Menu.Item icon={<Icon name="shield" size="sm" />} onClick={() => setActiveH("security")}>Security</Menu.Item>
            <Menu.Item icon={<Icon name="database" size="sm" />} onClick={() => setActiveH("database")}>Database</Menu.Item>
            <Menu.Item icon={<Icon name="palette" size="sm" />} onClick={() => setActiveH("theme")}>Theme</Menu.Item>
          </Menu.Submenu>
          <Menu.Item icon={<Icon name="bar-chart-3" size="sm" />} active={activeH === "analytics"} onClick={() => setActiveH("analytics")}>
            Analytics
          </Menu.Item>
        </Menu>
      </DemoSection>

      <DemoSection
        title="Vertical Menu"
        description="Vertical menu with groups, submenus (accordion-style), badges, and disabled items."
        code={`<Menu orientation="vertical">
  <Menu.Group label="Main">
    <Menu.Item icon={<Icon name="home" size="sm" />} active>Dashboard</Menu.Item>
    <Menu.Item icon={<Icon name="mail" size="sm" />} badge={<Badge size="xs">3</Badge>}>Inbox</Menu.Item>
  </Menu.Group>
  <Menu.Submenu label="Settings" icon={<Icon name="settings" size="sm" />} defaultOpen>
    <Menu.Item>General</Menu.Item>
    <Menu.Item>Security</Menu.Item>
  </Menu.Submenu>
</Menu>`}
      >
        <div className="max-w-xs">
          <Menu orientation="vertical">
            <Menu.Group label="Main">
              <Menu.Item icon={<Icon name="home" size="sm" />} active={activeV === "dashboard"} onClick={() => setActiveV("dashboard")}>
                Dashboard
              </Menu.Item>
              <Menu.Item
                icon={<Icon name="mail" size="sm" />}
                active={activeV === "inbox"}
                onClick={() => setActiveV("inbox")}
                badge={<Badge size="xs" color="blue">3</Badge>}
              >
                Inbox
              </Menu.Item>
              <Menu.Item icon={<Icon name="users" size="sm" />} active={activeV === "users"} onClick={() => setActiveV("users")}>
                Users
              </Menu.Item>
              <Menu.Item icon={<Icon name="bar-chart-3" size="sm" />} active={activeV === "analytics"} onClick={() => setActiveV("analytics")}>
                Analytics
              </Menu.Item>
            </Menu.Group>

            <Menu.Group label="Settings">
              <Menu.Submenu label="Configuration" icon={<Icon name="settings" size="sm" />} defaultOpen>
                <Menu.Item active={activeV === "general"} onClick={() => setActiveV("general")}>General</Menu.Item>
                <Menu.Item active={activeV === "security"} onClick={() => setActiveV("security")}>Security</Menu.Item>
                <Menu.Item active={activeV === "database"} onClick={() => setActiveV("database")}>Database</Menu.Item>
              </Menu.Submenu>
              <Menu.Item icon={<Icon name="bell" size="sm" />} active={activeV === "notifications"} onClick={() => setActiveV("notifications")}>
                Notifications
              </Menu.Item>
              <Menu.Item icon={<Icon name="palette" size="sm" />} disabled>
                Theme (coming soon)
              </Menu.Item>
            </Menu.Group>
          </Menu>
        </div>
      </DemoSection>
    </div>
  );
}
