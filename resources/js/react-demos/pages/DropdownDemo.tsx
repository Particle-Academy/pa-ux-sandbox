import { Dropdown, Action } from "@particle-academy/react-fancy";
import { DemoSection } from "../components/DemoSection";

export function DropdownDemo() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Dropdown</h1>

      <DemoSection title="Basic" description="Click a trigger to reveal a list of actions." code={`<Dropdown>
  <Dropdown.Trigger>
    <Action>Options</Action>
  </Dropdown.Trigger>
  <Dropdown.Items>
    <Dropdown.Item onClick={() => alert("Edit")}>Edit</Dropdown.Item>
    <Dropdown.Item onClick={() => alert("Duplicate")}>Duplicate</Dropdown.Item>
    <Dropdown.Separator />
    <Dropdown.Item onClick={() => alert("Archive")}>Archive</Dropdown.Item>
    <Dropdown.Item onClick={() => alert("Delete")} danger>
      Delete
    </Dropdown.Item>
  </Dropdown.Items>
</Dropdown>`}>
        <Dropdown>
          <Dropdown.Trigger>
            <Action>Options</Action>
          </Dropdown.Trigger>
          <Dropdown.Items>
            <Dropdown.Item onClick={() => alert("Edit")}>Edit</Dropdown.Item>
            <Dropdown.Item onClick={() => alert("Duplicate")}>Duplicate</Dropdown.Item>
            <Dropdown.Separator />
            <Dropdown.Item onClick={() => alert("Archive")}>Archive</Dropdown.Item>
            <Dropdown.Item onClick={() => alert("Delete")} danger>
              Delete
            </Dropdown.Item>
          </Dropdown.Items>
        </Dropdown>
      </DemoSection>

      <DemoSection title="With Disabled Items" description="Items can be individually disabled." code={`<Dropdown>
  <Dropdown.Trigger>
    <Action>Actions</Action>
  </Dropdown.Trigger>
  <Dropdown.Items>
    <Dropdown.Item onClick={() => {}}>Save</Dropdown.Item>
    <Dropdown.Item onClick={() => {}} disabled>Save As (disabled)</Dropdown.Item>
    <Dropdown.Separator />
    <Dropdown.Item onClick={() => {}}>Export</Dropdown.Item>
  </Dropdown.Items>
</Dropdown>`}>
        <Dropdown>
          <Dropdown.Trigger>
            <Action>Actions</Action>
          </Dropdown.Trigger>
          <Dropdown.Items>
            <Dropdown.Item onClick={() => {}}>Save</Dropdown.Item>
            <Dropdown.Item onClick={() => {}} disabled>Save As (disabled)</Dropdown.Item>
            <Dropdown.Separator />
            <Dropdown.Item onClick={() => {}}>Export</Dropdown.Item>
          </Dropdown.Items>
        </Dropdown>
      </DemoSection>
    </div>
  );
}
