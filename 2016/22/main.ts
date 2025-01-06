#!/usr/bin/env -S deno run --allow-read

const inputText = await Deno.readTextFile(
  new URL("input.txt", import.meta.url),
);

type XY = { x: number; y: number };

type Node = { xy: XY; size: number; used: number };

const grid: Array<Array<Node>> = [];

for (const line of inputText.split("\n")) {
  const match = line.match(/node-x(\d+)-y(\d+)\s+(\d+)T\s+(\d+)T\s+/);
  if (!match) continue;
  const [x, y, size, used] = match.slice(1, 5).map(Number);
  grid[y] ??= [];
  grid[y][x] = { xy: { x, y }, size, used };
}

let viablePairs = 0;
for (const n1 of grid.flat()) {
  for (const n2 of grid.flat()) {
    if (n1 === n2) continue;
    if (n1.used === 0) continue;
    if (n1.used <= (n2.size - n2.used)) viablePairs++;
  }
}

console.log(`Answer 1: ${viablePairs}`);

const empty = grid.flat().find((n) => n.used === 0)!;

let current = empty;
let steps = 0;

while (true) {
  if (current.xy.y > 0) {
    // Move up if possible
    const above = grid[current.xy.y - 1][current.xy.x];
    if (above.used <= empty.size) {
      current = above;
      steps++;
    } else {
      // Otherwise move left
      const left = grid[current.xy.y][current.xy.x - 1];
      current = left;
      steps++;
    }
    continue;
  }
  // Move right until end
  if (current.xy.x >= grid[0].length - 1) break;
  const right = grid[current.xy.y][current.xy.x + 1];
  current = right;
  steps++;
}

// Cycle until start
while (true) {
  if (current.xy.x === 1 && current.xy.y === 0) break;
  steps += 5;
  // swaps.push([current, grid[current.xy.y + 1][current.xy.x]]);
  // swaps.push([
  //   grid[current.xy.y + 1][current.xy.x],
  //   grid[current.xy.y + 1][current.xy.x - 1],
  // ]);
  // swaps.push([
  //   grid[current.xy.y + 1][current.xy.x - 1],
  //   grid[current.xy.y + 1][current.xy.x - 2],
  // ]);
  // swaps.push([
  //   grid[current.xy.y + 1][current.xy.x - 2],
  //   grid[current.xy.y][current.xy.x - 2],
  // ]);
  // swaps.push([
  //   grid[current.xy.y][current.xy.x - 2],
  //   grid[current.xy.y][current.xy.x - 1],
  // ]);
  current = grid[current.xy.y][current.xy.x - 1];
}

console.log(`Answer 1: ${steps}`);
