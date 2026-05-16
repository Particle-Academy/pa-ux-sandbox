// tsrx pilot version of react-fancy's Action button.
//
// .tsrx is a single-file component format compiled by @tsrx/vite-plugin-react
// into standard React components with scoped CSS. We keep using Tailwind
// utility classes for styling so the component matches the rest of the
// react-fancy look without per-component <style> blocks.

type ActionVariant = "default" | "ghost" | "circle";
type ActionColor = "blue" | "emerald" | "amber" | "red" | "violet" | "indigo" | "sky" | "rose" | "orange" | "zinc";
type ActionSize = "sm" | "md" | "lg";

interface ActionProps {
  children?: any;
  variant?: ActionVariant;
  color?: ActionColor;
  size?: ActionSize;
  disabled?: boolean;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
}

const COLOR_CLASSES: Record<ActionColor, string> = {
  blue: "bg-blue-500 hover:bg-blue-600 text-white",
  emerald: "bg-emerald-500 hover:bg-emerald-600 text-white",
  amber: "bg-amber-500 hover:bg-amber-600 text-white",
  red: "bg-red-500 hover:bg-red-600 text-white",
  violet: "bg-violet-500 hover:bg-violet-600 text-white",
  indigo: "bg-indigo-500 hover:bg-indigo-600 text-white",
  sky: "bg-sky-500 hover:bg-sky-600 text-white",
  rose: "bg-rose-500 hover:bg-rose-600 text-white",
  orange: "bg-orange-500 hover:bg-orange-600 text-white",
  zinc: "bg-zinc-700 hover:bg-zinc-800 text-white",
};

const SIZE_CLASSES: Record<ActionSize, string> = {
  sm: "h-7 px-2.5 text-xs rounded-md",
  md: "h-9 px-3.5 text-sm rounded-lg",
  lg: "h-11 px-5 text-base rounded-xl",
};

const CIRCLE_SIZE: Record<ActionSize, string> = {
  sm: "h-7 w-7 rounded-full text-xs",
  md: "h-9 w-9 rounded-full text-sm",
  lg: "h-11 w-11 rounded-full text-base",
};

export component Action({
  children,
  variant = "default",
  color,
  size = "md",
  disabled = false,
  onClick,
  type = "button",
}: ActionProps) {
  const isCircle = variant === "circle";
  const isGhost = variant === "ghost";

  const base = "inline-flex items-center justify-center font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2";

  const sizeClass = isCircle ? CIRCLE_SIZE[size] : SIZE_CLASSES[size];

  const variantClass = isGhost
    ? "bg-transparent text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
    : color
    ? COLOR_CLASSES[color]
    : "bg-zinc-100 hover:bg-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-100";

  <button
    type={type}
    disabled={disabled}
    onClick={onClick}
    class={`${base} ${sizeClass} ${variantClass}`}
    data-particle-tsrx-action=""
  >
    {children}
  </button>
}
