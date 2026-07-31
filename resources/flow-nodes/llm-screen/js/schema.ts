import type { ScreenSchema } from "./types";

/**
 * Check a generated screen before anything renders it.
 *
 * fancy-screens renders an unknown component name as a visible orange
 * placeholder — good behaviour for a developer typing a schema by hand, and the
 * wrong outcome for a workflow: the run completes, reports success, and what
 * reaches the person is an error message where their interface should be. So a
 * schema naming a component the host never registered is rejected HERE, while
 * there is still a run to fail.
 *
 * Returns every problem rather than the first. An author fixing a prompt wants
 * the whole list, and a generated tree usually gets several wrong at once.
 */
export function checkSchema(schema: unknown, components: string[], maxDepth = 12): string[] {
  const known = new Set(components);
  const problems: string[] = [];
  const unknown = new Set<string>();

  const walk = (node: unknown, path: string, depth: number): void => {
    if (typeof node === "string") return;

    if (typeof node !== "object" || node === null || Array.isArray(node)) {
      problems.push(`${path}: expected a component object or a string, got ${describe(node)}`);
      return;
    }

    if (depth > maxDepth) {
      // A model that loses its place emits a tree that nests until something
      // downstream blows its stack. Naming the depth beats a RangeError.
      problems.push(`${path}: nested deeper than ${maxDepth} levels`);
      return;
    }

    const element = node as Partial<ScreenSchema>;

    if (typeof element.type !== "string" || element.type.trim() === "") {
      problems.push(`${path}: no component type`);
    } else if (!known.has(element.type) && !unknown.has(element.type)) {
      // Reported once per name, not once per occurrence: a model that gets a
      // name wrong usually uses it a dozen times, and a dozen identical lines
      // buries the other problems.
      unknown.add(element.type);
      problems.push(`${path}: unknown component "${element.type}"`);
    }

    if (element.props !== undefined && (typeof element.props !== "object" || element.props === null || Array.isArray(element.props))) {
      problems.push(`${path}: props must be an object`);
    }

    if (element.children === undefined) return;

    if (!Array.isArray(element.children)) {
      problems.push(`${path}: children must be an array`);
      return;
    }

    element.children.forEach((child, index) => walk(child, `${path}.children[${index}]`, depth + 1));
  };

  walk(schema, "screen", 0);

  if (unknown.size > 0) {
    // The actionable half of an unknown-component error: the model was told
    // what exists, so the fix is usually the registry, not the prompt.
    problems.push(
      `registered components are: ${components.length > 0 ? components.join(", ") : "(none — the host registered nothing)"}`,
    );
  }

  return problems;
}

function describe(value: unknown): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return "an array";

  return typeof value;
}
