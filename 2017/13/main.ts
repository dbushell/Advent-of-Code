#!/usr/bin/env -S deno run --allow-read

const inputText = await Deno.readTextFile(
  new URL("input.txt", import.meta.url),
);

type Firewall = Array<
  {
    depth: number;
    range: number;
    position: number;
    direction: number;
  } | undefined
>;

const firewall: Firewall = [];

inputText.trim().split("\n").forEach((line) => {
  const [depth, range] = line.match(/^(\d+):\s+(\d+)$/)!
    .slice(1, 3).map(Number);
  firewall[depth] = { depth, range, position: 0, direction: 1 };
});

const picoseconds = 1 +
  Math.max(...firewall.filter(Boolean).map((s) => s!.depth));

{
  let severity = 0;
  for (let i = 0, current = -1; i < picoseconds; i++) {
    current++;
    for (const scan of firewall) {
      if (!scan) continue;
      // Check if caught
      if (scan.depth === current && scan.position === 0) {
        severity += scan.depth * scan.range;
      }
      // Move scanner up or down
      scan.position += scan.direction;
      if (scan.position === scan.range - 1) {
        scan.direction = -1;
      } else if (scan.position === 0) {
        scan.direction = 1;
      }
    }
  }
  console.log(`Answer 1: ${severity}`);
}

{
  loop: for (let delay = 0; delay < Infinity; delay++) {
    for (let i = delay, current = -1; i < (picoseconds + delay); i++) {
      const scan = firewall[++current];
      if (scan && i % ((scan.range * 2) - 2) === 0) continue loop;
    }
    console.log(`Answer 2: ${delay}`);
    break;
  }
}
