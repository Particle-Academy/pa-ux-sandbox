import { useState } from "react";
import { Callout } from "@particle-academy/react-fancy";
import { DemoSection } from "../components/DemoSection";

function InfoIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

export function CalloutDemo() {
  const [visible, setVisible] = useState(true);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Callout</h1>

      <DemoSection title="Colors" description="Semantic color variants for different message types." code={`<Callout color="blue" icon={<InfoIcon />}>
  Informational message.
</Callout>
<Callout color="green" icon={<CheckIcon />}>
  Success message.
</Callout>
<Callout color="amber">Warning.</Callout>
<Callout color="red">Error.</Callout>`}>
        <div className="space-y-3">
          <Callout color="blue" icon={<InfoIcon />}>
            This is an informational callout with helpful context.
          </Callout>
          <Callout color="green" icon={<CheckIcon />}>
            Operation completed successfully. All changes have been saved.
          </Callout>
          <Callout color="amber" icon={<AlertIcon />}>
            Please review your changes before submitting.
          </Callout>
          <Callout color="red" icon={<AlertIcon />}>
            An error occurred while processing your request.
          </Callout>
          <Callout color="zinc">
            A neutral callout without an icon.
          </Callout>
        </div>
      </DemoSection>

      <DemoSection title="Dismissible" description="Callout that can be closed by the user." code={`<Callout
  color="blue"
  dismissible
  onDismiss={() => setVisible(false)}
>
  Dismissible callout.
</Callout>`}>
        {visible ? (
          <Callout
            color="blue"
            icon={<InfoIcon />}
            dismissible
            onDismiss={() => setVisible(false)}
          >
            Click the X button to dismiss this callout.
          </Callout>
        ) : (
          <button
            className="text-sm text-blue-500 underline"
            onClick={() => setVisible(true)}
          >
            Show callout again
          </button>
        )}
      </DemoSection>
    </div>
  );
}
