#!/usr/bin/env -S deno run --allow-read

const inputText = await Deno.readTextFile(
  new URL("input.txt", import.meta.url),
);

type Port = [number, number];

type State = {
  path: Array<Port>;
  used: number;
  strength: number;
};

const ports: Array<Port> = inputText.trim().split("\n").map((line) =>
  line.split("/").map(Number) as Port
).sort((a, b) => a[0] - b[0]);

const queue: Array<State> = [];
const bridges: Array<State> = [];
const state: State = { path: [ports[0]], used: 0, strength: 0 };

const diverge = (state: State) => {
  // Get valid ports to append
  const valid = ports.filter((p) => {
    if (state.path.includes(p)) return false;
    const [a, b] = state.path.at(-1)!;
    return p.includes(a === state.used ? b : a);
  });
  // End bridge if complete
  if (valid.length === 0) {
    bridges.push(state);
    return;
  }
  // Start new bridges
  for (const port of valid) {
    const next = { path: [...state.path, port], used: 0, strength: 0 };
    const [a, b] = next.path.at(-1)!;
    next.used = next.path.at(-2)!.includes(a) ? a : b;
    next.strength = next.path.flat().reduce((s, p) => s + p, 0);
    queue.push(next);
  }
};

// Build all possible bridges
queue.push(state);
while (queue.length) diverge(queue.pop()!);

// Sort by strength
bridges.sort((a, b) => b.strength - a.strength);
console.log(`Answer 1: ${bridges[0].strength}`);

// Sort by longest and strength
bridges.sort((a, b) => {
  if (a.path.length === b.path.length) return b.strength - a.strength;
  return b.path.length - a.path.length;
});
console.log(`Answer 2: ${bridges[0].strength}`);
