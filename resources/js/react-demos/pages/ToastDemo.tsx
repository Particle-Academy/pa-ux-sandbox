import { Toast, useToast, Button } from "@particle-academy/react-fancy";
import { DemoSection } from "../components/DemoSection";

function ToastButtons() {
  const { toast } = useToast();

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        size="sm"
        onClick={() => toast({ title: "Default toast", description: "Something happened." })}
      >
        Default
      </Button>
      <Button
        size="sm"
        onClick={() =>
          toast({ title: "Saved!", description: "Your changes were saved.", variant: "success" })
        }
      >
        Success
      </Button>
      <Button
        size="sm"
        onClick={() =>
          toast({ title: "Error", description: "Something went wrong.", variant: "error" })
        }
      >
        Error
      </Button>
      <Button
        size="sm"
        onClick={() =>
          toast({ title: "Warning", description: "Check your input.", variant: "warning" })
        }
      >
        Warning
      </Button>
      <Button
        size="sm"
        onClick={() =>
          toast({ title: "Info", description: "Here is some information.", variant: "info" })
        }
      >
        Info
      </Button>
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

        <DemoSection title="Usage" description="Wrap your app with Toast.Provider and use the useToast hook. Click 'Show Code' above for the snippet." code={`<Toast.Provider position="bottom-right">
  <App />
</Toast.Provider>

// In a component:
const { toast } = useToast();
toast({ title: "Hello!", variant: "success" });`}>
          <div className="text-sm text-zinc-500">
            Toast.Provider lives at the root; `useToast()` returns `{`{ toast, dismiss }`}` to any descendant.
          </div>
        </DemoSection>
      </div>
    </Toast.Provider>
  );
}
