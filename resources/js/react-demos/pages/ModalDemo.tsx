import { useState } from "react";
import { Modal, Action } from "@particle-academy/react-fancy";
import { DemoSection } from "../components/DemoSection";

export function ModalDemo() {
  const [basicOpen, setBasicOpen] = useState(false);
  const [lgOpen, setLgOpen] = useState(false);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Modal</h1>

      <DemoSection title="Basic" description="A simple dialog with header, body, and footer." code={`<Action onClick={() => setOpen(true)}>Open Modal</Action>
<Modal open={open} onClose={() => setOpen(false)}>
  <Modal.Header><h2>Confirm Action</h2></Modal.Header>
  <Modal.Body><p>Are you sure?</p></Modal.Body>
  <Modal.Footer>
    <Action size="sm" onClick={() => setOpen(false)}>Cancel</Action>
    <Action size="sm" onClick={() => setOpen(false)}>Confirm</Action>
  </Modal.Footer>
</Modal>`}>
        <Action onClick={() => setBasicOpen(true)}>Open Modal</Action>
        <Modal open={basicOpen} onClose={() => setBasicOpen(false)}>
          <Modal.Header>
            <h2 className="text-lg font-semibold">Confirm Action</h2>
          </Modal.Header>
          <Modal.Body>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Are you sure you want to proceed? This action cannot be undone.
            </p>
          </Modal.Body>
          <Modal.Footer>
            <div className="flex justify-end gap-2">
              <Action size="sm" onClick={() => setBasicOpen(false)}>
                Cancel
              </Action>
              <Action size="sm" onClick={() => setBasicOpen(false)}>
                Confirm
              </Action>
            </div>
          </Modal.Footer>
        </Modal>
      </DemoSection>

      <DemoSection title="Large Size" description="Modal with size=lg for more content." code={`<Modal open={open} onClose={() => setOpen(false)} size="lg">
  <Modal.Header><h2>Project Details</h2></Modal.Header>
  <Modal.Body><p>More complex content here.</p></Modal.Body>
  <Modal.Footer>
    <Action size="sm" onClick={() => setOpen(false)}>Close</Action>
  </Modal.Footer>
</Modal>`}>
        <Action onClick={() => setLgOpen(true)}>Open Large Modal</Action>
        <Modal open={lgOpen} onClose={() => setLgOpen(false)} size="lg">
          <Modal.Header>
            <h2 className="text-lg font-semibold">Project Details</h2>
          </Modal.Header>
          <Modal.Body>
            <div className="space-y-4">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                This is a larger modal that can hold more complex content such as forms,
                tables, or multi-step wizards.
              </p>
              <div className="h-32 rounded-lg bg-zinc-100 dark:bg-zinc-800" />
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Press Escape or click the backdrop to close.
              </p>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <div className="flex justify-end">
              <Action size="sm" onClick={() => setLgOpen(false)}>Close</Action>
            </div>
          </Modal.Footer>
        </Modal>
      </DemoSection>
    </div>
  );
}
