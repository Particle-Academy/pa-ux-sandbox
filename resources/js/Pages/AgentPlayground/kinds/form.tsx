/**
 * form kind — a controlled react-fancy form driven by registerFormBridge.
 *
 * We register ONE form bridge centrally (resolving to the active form screen)
 * rather than per-surface <BridgedForm>, so the playground keeps a single
 * bridge per kind on the shared server. The surface renders controlled
 * react-fancy inputs with stable `name` handles the bridge focuses by.
 */
import { Field, Input, Select, Switch, Textarea } from "@particle-academy/react-fancy";
import { registerFormBridge, type FormFieldDescriptor } from "@particle-academy/agent-integrations";
import type { KindModule, SurfaceProps, KindBridgeContext } from "./types";

const FIELDS: FormFieldDescriptor[] = [
  { name: "name", label: "Name", type: "text", required: true },
  { name: "email", label: "Email", type: "email", required: true },
  {
    name: "role",
    label: "Role",
    type: "select",
    options: [
      { value: "engineer", label: "Engineer" },
      { value: "designer", label: "Designer" },
      { value: "pm", label: "PM" },
    ],
  },
  { name: "newsletter", label: "Subscribe", type: "switch" },
  { name: "notes", label: "Notes", type: "textarea" },
];

export type FormState = { values: Record<string, unknown> };

const seed = (): FormState => ({
  values: { name: "", email: "", role: "engineer", newsletter: false, notes: "" },
});

function FormSurface({ screenId, state, onChange }: SurfaceProps) {
  const s = state as FormState;
  const set = (name: string, value: unknown) => onChange({ values: { ...s.values, [name]: value } });
  return (
    <div className="p-4" data-form-id={`form-${screenId}`}>
      <div className="grid max-w-xl grid-cols-2 gap-4">
        <Field label="Name">
          <Input name="name" value={String(s.values.name ?? "")} onValueChange={(v: string) => set("name", v)} />
        </Field>
        <Field label="Email">
          <Input name="email" type="email" value={String(s.values.email ?? "")} onValueChange={(v: string) => set("email", v)} />
        </Field>
        <Field label="Role">
          <Select
            name="role"
            value={String(s.values.role ?? "")}
            onValueChange={(v: string) => set("role", v)}
            list={FIELDS.find((f) => f.name === "role")?.options ?? []}
          />
        </Field>
        <Field label="Subscribe">
          <Switch name="newsletter" checked={!!s.values.newsletter} onCheckedChange={(v: boolean) => set("newsletter", v)} />
        </Field>
        <div className="col-span-2">
          <Field label="Notes">
            <Textarea name="notes" value={String(s.values.notes ?? "")} onValueChange={(v: string) => set("notes", v)} />
          </Field>
        </div>
      </div>
    </div>
  );
}

export const formKind: KindModule = {
  kind: "form",
  label: "Form",
  description: "A controlled react-fancy form. Drive it with form_* tools (describe / set_value / submit).",
  status: "wired",
  createState: seed,
  register: (server, ctx: KindBridgeContext) => {
    const read = () => (ctx.getActiveState() as FormState) ?? seed();
    return registerFormBridge(server, {
      adapter: {
        id: "playground-form",
        title: "Playground form",
        getFields: () => FIELDS,
        getValue: (name) => read().values[name],
        getValues: () => ({ ...read().values }),
        setValue: (name, value) => ctx.setActiveState({ values: { ...read().values, [name]: value } }),
        setValues: (next) => ctx.setActiveState({ values: { ...read().values, ...next } }),
        focus: (name) => {
          const sid = ctx.getActiveScreenId();
          (document.querySelector(`[data-form-id="form-${sid}"] [name="${name}"]`) as HTMLElement | null)?.focus();
        },
        submit: async () => ({ ok: true, values: { ...read().values } }),
      },
      agent: ctx.agent,
    });
  },
  Surface: FormSurface,
};
