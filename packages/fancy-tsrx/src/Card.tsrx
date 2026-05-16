// tsrx pilot version of react-fancy's Card (root + Header + Body slots).

interface CardProps {
  children?: any;
  className?: string;
}

export component Card({ children, className }: CardProps) {
  <div
    class={`overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 ${className ?? ""}`}
    data-particle-tsrx-card=""
  >
    {children}
  </div>
}

export component CardHeader({ children, className }: CardProps) {
  <div class={`border-b border-zinc-100 px-4 py-3 dark:border-zinc-800 ${className ?? ""}`}>
    {children}
  </div>
}

export component CardBody({ children, className }: CardProps) {
  <div class={`p-4 ${className ?? ""}`}>{children}</div>
}
