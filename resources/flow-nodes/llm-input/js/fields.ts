import type { GeneratedField } from "./types";

const TYPES = new Set(["text", "textarea", "number", "select", "switch"]);

/**
 * Check a generated form before the run pauses on it.
 *
 * A model returns plausible JSON, not correct JSON, and every defect here has
 * the same shape: the run parks on a form that looks fine and produces values
 * nothing downstream can read. That failure surfaces minutes or hours later,
 * after a person has already filled the thing in — so it is caught at the seam
 * instead, where the error can still name what went wrong.
 *
 * Returns the problems rather than throwing, so the caller reports all of them
 * at once. An author fixing a prompt wants the whole list.
 */
export function checkFields(fields: unknown, requiredKeys: string[] = [], maxFields?: number): string[] {
  const problems: string[] = [];

  if (!Array.isArray(fields)) return ["the model returned no field list"];
  if (fields.length === 0) return ["the model returned an empty form"];
  if (maxFields !== undefined && fields.length > maxFields) {
    problems.push(`the model returned ${fields.length} fields, over the ${maxFields} allowed`);
  }

  const seen = new Set<string>();

  fields.forEach((raw, index) => {
    const field = raw as Partial<GeneratedField>;
    const at = `field ${index + 1}`;

    if (typeof field.key !== "string" || field.key.trim() === "") {
      problems.push(`${at}: no key — its value would be unreachable`);
    } else if (seen.has(field.key)) {
      // Two fields sharing a key means one silently overwrites the other on
      // submit, and the form itself gives no sign of it.
      problems.push(`${at}: duplicate key "${field.key}"`);
    } else {
      seen.add(field.key);
    }

    if (typeof field.label !== "string" || field.label.trim() === "") {
      problems.push(`${at}: no label — the person filling it in cannot tell what it wants`);
    }

    if (field.type !== undefined && !TYPES.has(field.type)) {
      problems.push(`${at}: unknown type "${field.type}"`);
    }

    if (field.type === "select" && (!Array.isArray(field.options) || field.options.length === 0)) {
      problems.push(`${at}: a select with no options renders as an empty dropdown`);
    }
  });

  // The contract with downstream nodes. Without it, a node reading
  // `values.email` breaks silently because the model chose `emailAddress`.
  const missing = requiredKeys.filter((key) => !seen.has(key));
  if (missing.length > 0) {
    problems.push(`missing required key${missing.length === 1 ? "" : "s"}: ${missing.join(", ")}`);
  }

  return problems;
}

/** Fill in what a model reasonably leaves out, without inventing meaning. */
export function normalizeFields(fields: GeneratedField[]): GeneratedField[] {
  return fields.map((field) => ({
    ...field,
    // `text` is the only default that cannot lose information: a textarea
    // rendered as text still accepts the answer, where a switch does not.
    type: field.type ?? "text",
    required: field.required ?? false,
  }));
}
