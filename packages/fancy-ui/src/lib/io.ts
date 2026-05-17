/**
 * Tiny output helpers — color, prompts, progress. Zero deps; ANSI codes
 * hand-coded so we don't pull in chalk / kleur.
 */
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";

const isTTY = stdout.isTTY === true;
const wrap = (code: string) => (s: string) => (isTTY ? `\x1b[${code}m${s}\x1b[0m` : s);

export const color = {
  bold: wrap("1"),
  dim: wrap("2"),
  red: wrap("31"),
  green: wrap("32"),
  yellow: wrap("33"),
  blue: wrap("34"),
  magenta: wrap("35"),
  cyan: wrap("36"),
};

export async function prompt(question: string, defaultValue?: string): Promise<string> {
  const rl = createInterface({ input: stdin, output: stdout });
  const suffix = defaultValue ? color.dim(` (${defaultValue})`) : "";
  const answer = (await rl.question(`${color.cyan("?")} ${question}${suffix} `)).trim();
  rl.close();
  return answer || defaultValue || "";
}

export async function confirm(question: string, defaultYes = true): Promise<boolean> {
  const choices = defaultYes ? "Y/n" : "y/N";
  const answer = await prompt(`${question} ${color.dim(`(${choices})`)}`);
  if (!answer) return defaultYes;
  return /^y/i.test(answer);
}

export function step(label: string, detail?: string): void {
  console.log(`${color.cyan("›")} ${label}${detail ? color.dim(" " + detail) : ""}`);
}

export function ok(label: string): void {
  console.log(`${color.green("✓")} ${label}`);
}

export function warn(label: string): void {
  console.log(`${color.yellow("!")} ${label}`);
}

export function info(label: string): void {
  console.log(`${color.dim("  ")}${label}`);
}
