/**
 * A generated interface, as JSON.
 *
 * Structurally the `ScreenSchema` fancy-screens already renders — `<Screen
 * schema={…}>` maps `type` through its component registry, spreads `props`, and
 * recurses `children`. Restated here as a local type rather than imported so
 * the executor carries no runtime import of a React package: a queue worker
 * generating a screen should not have to install a renderer to do it.
 *
 * The shape is unchanged on purpose. A parallel format would mean the node
 * emits something `<Screen>` cannot take, and the whole point is that it can.
 */
export type ScreenSchema = {
  /** A component name the host registered with `registerSchemaComponent`. */
  type: string;
  props?: Record<string, unknown>;
  children?: Array<ScreenSchema | string>;
};

export type LlmScreenRequest = {
  /** What the interface is for, in the author's words. */
  purpose: string;
  /**
   * Component names the model may use.
   *
   * Supplied by the host, because only the host knows what it registered.
   * A model left to guess emits `<DataTable>` into an app that registered
   * `Table`, and fancy-screens renders an orange placeholder where the
   * interface should be.
   */
  components: string[];
  /** The run's data, for the model to build the interface around. */
  context?: unknown;
  provider?: string;
  model?: string;
  /** Host-resolved credential reference, never a raw key. */
  credential?: string;
};

export type LlmScreenResult = {
  schema: ScreenSchema;
  title?: string;
};

/**
 * The seam between this node and the screen surface.
 *
 * Two jobs, deliberately on one host: generating the schema and knowing which
 * components exist are the same knowledge. Split across two registrations they
 * drift, and the drift shows up as a rendered placeholder — a run that reports
 * success having produced an error message on screen.
 *
 * ```ts
 * registerLlmScreenHost({
 *   components: () => listSchemaComponents(),          // from fancy-screens
 *   generate: (req) => myModel.json(SCREEN_SCHEMA, req),
 *   present: (screen) => screenStore.setState({ schema: screen.schema }),
 * });
 * ```
 */
export type LlmScreenHost = {
  /** Component names registered on this host's fancy-screens registry. */
  components: () => string[];
  generate: (request: LlmScreenRequest) => Promise<LlmScreenResult> | LlmScreenResult;
  /**
   * Put the generated screen in front of someone.
   *
   * Optional: a workflow may only want the schema as data — to store it, diff
   * it, or hand it to a later step — and forcing a presentation step would make
   * that impossible.
   */
  present?: (screen: { screenId: string; title?: string; schema: ScreenSchema }) => void | Promise<void>;
};
