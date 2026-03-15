import { Toast, useToast, Action } from "@particle-academy/react-fancy";
import { DemoSection } from "../components/DemoSection";

function ToastButtons() {
  const { toast } = useToast();

  return (
    <div className="flex flex-wrap gap-2">
      <Action
        size="sm"
        onClick={() => toast({ title: "Default toast", description: "Something happened." })}
      >
        Default
      </Action>
      <Action
        size="sm"
        onClick={() =>
          toast({ title: "Saved!", description: "Your changes were saved.", variant: "success" })
        }
      >
        Success
      </Action>
      <Action
        size="sm"
        onClick={() =>
          toast({ title: "Error", description: "Something went wrong.", variant: "error" })
        }
      >
        Error
      </Action>
      <Action
        size="sm"
        onClick={() =>
          toast({ title: "Warning", description: "Check your input.", variant: "warning" })
        }
      >
        Warning
      </Action>
      <Action
        size="sm"
        onClick={() =>
          toast({ title: "Info", description: "Here is some information.", variant: "info" })
        }
      >
        Info
      </Action>
    </div>
  );
}

export function ToastDemo() {
  return (
    <Toast.Provider position="bottom-right">
      <div>
        <h1 className="mb-6 text-2xl font-bold">Toast</h1>

        <DemoSection title="Variants" description="Click buttons to trigger different toast variants." code={`const { toast } = useToast();

toast({ title: "Saved!", variant: "success" });
toast({ title: "Error", description: "Something went wrong.", variant: "error" });
toast({ title: "Warning", variant: "warning" });
toast({ title: "Info", variant: "info" });`}>
          <ToastButtons />
        </DemoSection>

        <DemoSection title="Usage" description="Wrap your app with Toast.Provider and use the useToast hook." code={`<Toast.Provider position="bottom-right">
  <App />
</Toast.Provider>

// In a component:
const { toast } = useToast();
toast({ title: "Hello!", variant: "success" });`}>
          <pre className="rounded-lg bg-zinc-100 p-4 text-sm dark:bg-zinc-800">
{`<Toast.Provider position="bottom-right">
  <App />
</Toast.Provider>

// In a component:
const { toast } = useToast();
toast({ title: "Hello!", variant: "success" });`}
          </pre>
        </DemoSection>
      </div>
    </Toast.Provider>
  );
}
