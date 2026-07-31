#!/usr/bin/env node
/**
 * List every node manifest in this repo, validated.
 *
 * `npm run manifests` prints the paths the registry command consumes:
 *
 *   php artisan flow:register-node <path>   # once per line, in px-ui-sandbox
 *
 * It exists because a marketplace repo accumulates nodes, and "which manifests
 * are there, and are they valid" stops being obvious somewhere around the third
 * one. Validation is the engine's own — a repo that disagrees with the runtime
 * about what a valid manifest is would ship packages the runtime then refuses.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { validateNodeManifest } from "@particle-academy/fancy-flow/engine";

const NODES = "resources/flow-nodes";
let failed = false;

for (const dir of readdirSync(NODES, { withFileTypes: true })) {
  if (!dir.isDirectory()) continue;

  const path = join(NODES, dir.name, "fancy-flow.node.json");
  if (!existsSync(path)) {
    console.error(`✗ ${dir.name}: no fancy-flow.node.json`);
    failed = true;
    continue;
  }

  const manifest = JSON.parse(readFileSync(path, "utf8"));
  const { ok, problems } = validateNodeManifest(manifest);

  // The checks the engine's validator cannot make, because they are about this
  // repo's own layout: every directory a manifest declares has to exist. One
  // that does not is a node the registry serves with files missing, and the CLI
  // copies a half node into a project without a word.
  const declared = [
    ...(manifest.ui ?? []),
    ...Object.values(manifest.runtimes ?? {}).flatMap((r) => r.files ?? []),
  ];

  for (const part of new Set(declared)) {
    if (!existsSync(join(NODES, dir.name, part))) {
      console.error(`✗ ${dir.name}: declares "${part}/", which does not exist`);
      failed = true;
    }
  }

  if (declared.length === 0) {
    console.error(`✗ ${dir.name}: declares no source at all — nothing would be copied`);
    failed = true;
  }

  for (const problem of problems) {
    console.error(`${problem.level === "error" ? "✗" : "!"} ${dir.name}: ${problem.field}: ${problem.message}`);
  }

  if (!ok) failed = true;
  else console.log(`${failed ? " " : "✓"} ${manifest.kind.padEnd(34)} ${path}`);
}

process.exit(failed ? 1 : 0);
