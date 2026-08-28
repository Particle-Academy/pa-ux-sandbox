import type { NodeKindDefinition } from "@particle-academy/fancy-flow/engine";
import { deepResearchKind } from "../ui/kind";
import { deepResearchExecutor } from "./executor";

export const deepResearchRunnableKind: NodeKindDefinition = { ...deepResearchKind, executor: deepResearchExecutor };
