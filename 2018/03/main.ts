#!/usr/bin/env -S deno run --allow-read

const inputText = await Deno.readTextFile(
  new URL("input.txt", import.meta.url),
);

type Claim = {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
};

// Parse input
const claims: Array<Claim> = inputText.trim().split("\n").map((line) => {
  const [id, x, y, width, height] = line.match(
    /^#(\d+) @ (\d+),(\d+): (\d+)x(\d+)$/,
  )!.slice(1, 6).map(Number);
  return { id, x, y, width, height };
});

const fabric = Array.from({ length: 1000 }, () => Array(1000).fill(0));

// Count overlapping inches
const multiple = new Set<string>();
for (const c of claims) {
  for (let y = c.y; y < c.y + c.height; y++) {
    for (let x = c.x; x < c.x + c.width; x++) {
      if (++fabric[y][x] >= 2) multiple.add(`${x},${y}`);
    }
  }
}
console.log(`Answer 1: ${multiple.size}`);

// Find non-overlapping claim
main: for (const c of claims) {
  for (let y = c.y; y < c.y + c.height; y++) {
    for (let x = c.x; x < c.x + c.width; x++) {
      if (fabric[y][x] >= 2) continue main;
    }
  }
  console.log(`Answer 2: ${c.id}`);
  break;
}
