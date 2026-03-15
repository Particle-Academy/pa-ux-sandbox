import { useState } from "react";
import { MobileMenu, Badge } from "@particle-academy/react-fancy";
import {
  Home,
  Search,
  Bell,
  User,
  Settings,
  Mail,
  BarChart3,
  FileText,
  Users,
  HelpCircle,
  LogOut,
  Menu,
} from "lucide-react";
import { DemoSection } from "../components/DemoSection";

export function MobileMenuDemo() {
  const [flyoutOpen, setFlyoutOpen] = useState(false);
  const [flyoutRightOpen, setFlyoutRightOpen] = useState(false);
  const [activeBottom, setActiveBottom] = useState("home");
  const [activeFlyout, setActiveFlyout] = useState("dashboard");

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">MobileMenu</h1>

      <DemoSection
        title="Flyout Menu (Left)"
        description="Slides in from the left as a modal overlay. Closes on backdrop click or Escape."
        code={`const [open, setOpen] = useState(false);

<button onClick={() => setOpen(true)}>Open Menu</button>

<MobileMenu.Flyout open={open} onClose={() => setOpen(false)} side="left" title="Navigation">
  <MobileMenu.Item icon={<Home />} active>Dashboard</MobileMenu.Item>
  <MobileMenu.Item icon={<Mail />}>Inbox</MobileMenu.Item>
</MobileMenu.Flyout>`}
      >
        <button
          onClick={() => setFlyoutOpen(true)}
          className="inline-flex items-center gap-2 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          <Menu className="h-4 w-4" />
          Open Left Flyout
        </button>

        <MobileMenu.Flyout open={flyoutOpen} onClose={() => setFlyoutOpen(false)} side="left" title="Navigation">
          <MobileMenu.Item icon={<Home className="h-4 w-4" />} active={activeFlyout === "dashboard"} onClick={() => { setActiveFlyout("dashboard"); }}>
            Dashboard
          </MobileMenu.Item>
          <MobileMenu.Item
            icon={<Mail className="h-4 w-4" />}
            active={activeFlyout === "inbox"}
            onClick={() => { setActiveFlyout("inbox"); }}
            badge={<Badge size="xs" color="blue">3</Badge>}
          >
            Inbox
          </MobileMenu.Item>
          <MobileMenu.Item icon={<Users className="h-4 w-4" />} active={activeFlyout === "users"} onClick={() => { setActiveFlyout("users"); }}>
            Users
          </MobileMenu.Item>
          <MobileMenu.Item icon={<BarChart3 className="h-4 w-4" />} active={activeFlyout === "analytics"} onClick={() => { setActiveFlyout("analytics"); }}>
            Analytics
          </MobileMenu.Item>
          <MobileMenu.Item icon={<FileText className="h-4 w-4" />} active={activeFlyout === "docs"} onClick={() => { setActiveFlyout("docs"); }}>
            Documentation
          </MobileMenu.Item>
          <MobileMenu.Item icon={<Settings className="h-4 w-4" />} active={activeFlyout === "settings"} onClick={() => { setActiveFlyout("settings"); }}>
            Settings
          </MobileMenu.Item>

          <div className="mt-auto border-t border-zinc-200 pt-2 dark:border-zinc-700">
            <MobileMenu.Item icon={<HelpCircle className="h-4 w-4" />}>Help & Support</MobileMenu.Item>
            <MobileMenu.Item icon={<LogOut className="h-4 w-4" />}>Sign out</MobileMenu.Item>
          </div>
        </MobileMenu.Flyout>
      </DemoSection>

      <DemoSection
        title="Flyout Menu (Right)"
        description="Same flyout but slides in from the right side."
        code={`<MobileMenu.Flyout open={open} onClose={close} side="right" title="Menu">
  ...
</MobileMenu.Flyout>`}
      >
        <button
          onClick={() => setFlyoutRightOpen(true)}
          className="inline-flex items-center gap-2 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          <Menu className="h-4 w-4" />
          Open Right Flyout
        </button>

        <MobileMenu.Flyout open={flyoutRightOpen} onClose={() => setFlyoutRightOpen(false)} side="right" title="Account">
          <MobileMenu.Item icon={<User className="h-4 w-4" />}>Profile</MobileMenu.Item>
          <MobileMenu.Item icon={<Settings className="h-4 w-4" />}>Settings</MobileMenu.Item>
          <MobileMenu.Item icon={<Bell className="h-4 w-4" />} badge={<Badge size="xs" color="red">2</Badge>}>
            Notifications
          </MobileMenu.Item>
          <MobileMenu.Item icon={<HelpCircle className="h-4 w-4" />}>Help</MobileMenu.Item>
          <MobileMenu.Item icon={<LogOut className="h-4 w-4" />}>Sign out</MobileMenu.Item>
        </MobileMenu.Flyout>
      </DemoSection>

      <DemoSection
        title="Bottom Bar"
        description="Fixed navigation bar at the bottom of the viewport. Ideal for mobile apps with 3-5 primary destinations. The preview below simulates the bar inline."
        code={`<MobileMenu.BottomBar>
  <MobileMenu.Item icon={<Home />} active>Home</MobileMenu.Item>
  <MobileMenu.Item icon={<Search />}>Search</MobileMenu.Item>
  <MobileMenu.Item icon={<Bell />} badge={<Badge>2</Badge>}>Alerts</MobileMenu.Item>
  <MobileMenu.Item icon={<User />}>Profile</MobileMenu.Item>
</MobileMenu.BottomBar>`}
      >
        <div className="max-w-sm">
          <p className="mb-3 text-xs text-zinc-500">
            In production, this is <code>position: fixed</code> at the bottom. Below is an inline preview:
          </p>
          <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700">
            {/* Simulated phone screen */}
            <div className="flex h-[300px] flex-col bg-zinc-50 dark:bg-zinc-950">
              <div className="flex-1 p-4">
                <p className="text-sm text-zinc-500">
                  Active tab: <span className="font-semibold text-zinc-900 dark:text-zinc-100">{activeBottom}</span>
                </p>
              </div>
              {/* Inline bottom bar (not fixed, for demo purposes) */}
              <div className="border-t border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
                <MobileMenu.BottomBar className="!fixed-none !relative">
                  <MobileMenu.Item
                    icon={<Home className="h-5 w-5" />}
                    active={activeBottom === "home"}
                    onClick={() => setActiveBottom("home")}
                  >
                    Home
                  </MobileMenu.Item>
                  <MobileMenu.Item
                    icon={<Search className="h-5 w-5" />}
                    active={activeBottom === "search"}
                    onClick={() => setActiveBottom("search")}
                  >
                    Search
                  </MobileMenu.Item>
                  <MobileMenu.Item
                    icon={<Bell className="h-5 w-5" />}
                    active={activeBottom === "alerts"}
                    onClick={() => setActiveBottom("alerts")}
                    badge={<Badge size="xs" color="red">2</Badge>}
                  >
                    Alerts
                  </MobileMenu.Item>
                  <MobileMenu.Item
                    icon={<User className="h-5 w-5" />}
                    active={activeBottom === "profile"}
                    onClick={() => setActiveBottom("profile")}
                  >
                    Profile
                  </MobileMenu.Item>
                </MobileMenu.BottomBar>
              </div>
            </div>
          </div>
        </div>
      </DemoSection>
    </div>
  );
}
