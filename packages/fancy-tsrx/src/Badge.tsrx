// tsrx pilot version of react-fancy's Badge.

type BadgeColor = "blue" | "emerald" | "amber" | "red" | "indigo" | "zinc";
type BadgeSize = "sm" | "md" | "lg";

interface BadgeProps {
  children?: any;
  color?: BadgeColor;
  size?: BadgeSize;
}

const COLOR: Record<BadgeColor, string> = {
  blue: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300",
  emerald: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
  amber: "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300",
  red: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300",
  indigo: "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300",
  zinc: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
};

const SIZE: Record<BadgeSize, string> = {
  sm: "px-1.5 py-0.5 text-[10px] rounded",
  md: "px-2 py-0.5 text-xs rounded-md",
  lg: "px-2.5 py-1 text-sm rounded-md",
};

export component Badge({ children, color = "zinc", size = "md" }: BadgeProps) {
  <span
    class={`inline-flex items-center font-medium ${COLOR[color]} ${SIZE[size]}`}
    data-particle-tsrx-badge=""
  >
    {children}
  </span>
}
