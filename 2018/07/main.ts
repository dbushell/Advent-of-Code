#!/usr/bin/env -S deno run --allow-read

const inputText = await Deno.readTextFile(
  new URL("input.txt", import.meta.url),
);

type Step = { id: string; dependencies: Set<Step> };

const stepMap = new Map<string, Step>();
for (const line of inputText.split("\n")) {
  const match = line.match(/^Step ([A-Z]) .+?step ([A-Z])/);
  if (!match) continue;
  const s1 = stepMap.get(match[1]) ?? { id: match[1], dependencies: new Set() };
  const s2 = stepMap.get(match[2]) ?? { id: match[2], dependencies: new Set() };
  s2.dependencies.add(s1);
  stepMap.set(s1.id, s1);
  stepMap.set(s2.id, s2);
}

const depedencies = (s: Step): Array<Step> => {
  const deps: Array<Step> = [];
  for (const dep of s.dependencies) {
    deps.push(dep);
    deps.push(...depedencies(dep));
  }
  return deps;
};

for (const [, step] of stepMap) {
  step.dependencies = new Set(depedencies(step));
}

const candidates = (steps: Array<Step>) => {
  const next = steps.filter((s1) => {
    for (const s2 of steps) {
      if (s1.dependencies.has(s2)) return false;
    }
    return true;
  });
  next.sort((a, b) => a.id.localeCompare(b.id));
  return next;
};

{
  let order = "";
  const steps = Array.from(stepMap.values());
  while (steps.length) {
    const next = candidates(steps);
    steps.splice(steps.indexOf(next[0]), 1);
    order += next[0].id;
  }
  console.log(`Answer 1: ${order}`);
}

{
  const MAX_WORKERS = 5;
  const workers: Array<[Step, number]> = [];
  const steps = Array.from(stepMap.values());
  for (let second = -1;; second++) {
    if (steps.length === 0 && workers.length === 0) {
      console.log(`Answer 2: ${second}`);
      break;
    }
    workers.forEach((worker, i) => {
      if (second < worker[1]) return;
      steps.splice(steps.indexOf(worker[0]), 1);
      workers.splice(i, 1);
    });
    for (const next of candidates(steps)) {
      if (workers.length === MAX_WORKERS) break;
      if (workers.find((w) => w[0].id === next.id)) continue;
      workers.push([next, second + next.id.codePointAt(0)! - 4]);
    }
  }
}
