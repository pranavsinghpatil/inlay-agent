import { execFile, spawn, type ChildProcess } from "node:child_process";
import { access, realpath } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, relative, resolve, sep } from "node:path";

export const C2_BASELINE_COMMIT = "3d0945f4fa74c1fc9b8b22d0327c892ffcc11075";

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

interface CommandResult {
  stdout: string;
  stderr: string;
}

export interface PiC2Topology {
  piExecutable: string;
  fixtureCwd: string;
  observedChildCwd: string;
  baselineIntact: boolean;
  fixtureClean: boolean;
  topologyMatches: boolean;
}

function run(executable: string, args: string[], cwd: string): Promise<CommandResult> {
  return new Promise((resolveResult, reject) => {
    execFile(executable, args, { cwd, windowsHide: true }, (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }
      resolveResult({ stdout, stderr });
    });
  });
}

function isInside(candidate: string, root: string): boolean {
  const path = relative(root, candidate);
  return path === "" || (!path.startsWith(`..${sep}`) && path !== "..");
}

/** Resolves Pi from this package, independently of the fixture working directory. */
export async function resolvePinnedPiExecutable(root = packageRoot): Promise<string> {
  const executable = resolve(root, "node_modules", "@earendil-works", "pi-coding-agent", "dist", "bundle", "cli.js");
  await access(executable);
  return realpath(executable);
}

/**
 * Read-only preflight for the fixed C2 fixture. The child cwd probe is a Node
 * process, not Pi, so this check cannot start a provider request or modify the fixture.
 */
export async function preflightPiC2Topology(
  fixture: string,
  baselineCommit = C2_BASELINE_COMMIT,
  root = packageRoot,
): Promise<PiC2Topology> {
  const fixtureCwd = await realpath(fixture);
  const piExecutable = await resolvePinnedPiExecutable(root);
  const [head, status, child] = await Promise.all([
    run("git", ["rev-parse", "HEAD"], fixtureCwd),
    run("git", ["status", "--porcelain"], fixtureCwd),
    run(process.execPath, ["--eval", "process.stdout.write(process.cwd())"], fixtureCwd),
  ]);
  const observedChildCwd = await realpath(child.stdout.trim());
  const baselineIntact = head.stdout.trim() === baselineCommit;
  const fixtureClean = status.stdout.trim() === "";
  const topologyMatches = observedChildCwd === fixtureCwd && !isInside(piExecutable, fixtureCwd);

  return { piExecutable, fixtureCwd, observedChildCwd, baselineIntact, fixtureClean, topologyMatches };
}

/**
 * The only permitted future Pi launcher for C2. This function is not called by
 * the topology command; it makes the fixture cwd explicit for a later approved run.
 */
export async function spawnPiForC2(
  fixture: string,
  piArgs: string[],
  root = packageRoot,
): Promise<ChildProcess> {
  const fixtureCwd = await realpath(fixture);
  const piExecutable = await resolvePinnedPiExecutable(root);
  return spawn(process.execPath, [piExecutable, ...piArgs], {
    cwd: fixtureCwd,
    shell: false,
    stdio: "inherit",
    windowsHide: true,
  });
}

function requiredFixtureArgument(args: string[]): string {
  const index = args.indexOf("--fixture");
  const value = index >= 0 ? args[index + 1] : undefined;
  if (!value || index + 2 !== args.length) {
    throw new Error("Usage: node --experimental-strip-types scripts/pi-c2-runner.ts --fixture <detached-fixture-path>");
  }
  return value;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const fixture = requiredFixtureArgument(process.argv.slice(2));
  const result = await preflightPiC2Topology(fixture);
  process.stdout.write(`${JSON.stringify(result)}\n`);
  if (!result.baselineIntact || !result.fixtureClean || !result.topologyMatches) process.exitCode = 1;
}
