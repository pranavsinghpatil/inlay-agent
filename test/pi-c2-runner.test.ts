import assert from "node:assert/strict";
import { execFile as execFileCallback } from "node:child_process";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { C2_BASELINE_COMMIT, preflightPiC2Topology, resolvePinnedPiExecutable } from "../scripts/pi-c2-runner.ts";

function runGit(args: string[], cwd: string): Promise<void> {
  return new Promise((resolve, reject) => {
    execFileCallback("git", args, { cwd, windowsHide: true }, (error) => error ? reject(error) : resolve());
  });
}

test("C2 topology preflight resolves Pi outside the fixture and observes the child cwd", async () => {
  const fixture = await mkdtemp(join(tmpdir(), "inlay-pi-c2-fixture-"));
  await runGit(["init", "--quiet"], fixture);
  await runGit(["config", "user.email", "inlay-test@example.invalid"], fixture);
  await runGit(["config", "user.name", "Inlay Test"], fixture);
  await writeFile(join(fixture, "baseline.txt"), "baseline\n", "utf8");
  await runGit(["add", "baseline.txt"], fixture);
  await runGit(["commit", "--quiet", "-m", "baseline"], fixture);
  const head = await new Promise<string>((resolve, reject) => {
    execFileCallback("git", ["rev-parse", "HEAD"], { cwd: fixture, windowsHide: true }, (error, stdout) => error ? reject(error) : resolve(stdout.trim()));
  });

  const result = await preflightPiC2Topology(fixture, head);

  assert.equal(result.baselineIntact, true);
  assert.equal(result.fixtureClean, true);
  assert.equal(result.topologyMatches, true);
  assert.equal(result.observedChildCwd, result.fixtureCwd);
  assert.notEqual(result.piExecutable, result.fixtureCwd);
  assert.match(result.piExecutable, /pi-coding-agent/);
  assert.equal(C2_BASELINE_COMMIT.length, 40);
});
