#!/usr/bin/env -S deno run --allow-read

const inputText = await Deno.readTextFile(
  new URL("input.txt", import.meta.url),
);

type Grid = Array<Array<string>>;

const cache = new Map<string, Grid>();

// Starting grid
let state: Grid = ".#.\n..#\n###".split("\n")
  .map((line) => line.split(""));

// Parse input patterns
const patterns: Array<[Grid, Grid]> = inputText.trim().split("\n").map((line) =>
  line.split(" => ").map((rows) =>
    rows.split("/").map((row) => row.split(""))
  ) as [Grid, Grid]
);

// Rotate 90deg clocksize
const rotate = (grid: Grid) =>
  grid[0].map((_, i) => grid.map((row) => row[i]).reverse());

// Flip horizontal axis
const flip = (grid: Grid) => grid.map((row) => [...row].reverse());

// Copy sub-grid
const subgrid = (grid: Grid, x: number, y: number, size: number): Grid => {
  return grid.slice(y, y + size).map((row) => row.slice(x, x + size));
};

// Find pattern
const match = (grid: Grid): Grid => {
  const key = grid.flat().join("");
  if (cache.has(key)) return cache.get(key)!;
  const variations = [grid];
  for (let i = 0; i < 3; i++) {
    variations.push(rotate(variations.at(-1)!));
  }
  for (let i = 0; i < 4; i++) {
    variations.push(flip(variations[i]));
  }
  for (const v of variations) {
    for (const p of patterns) {
      if (v.flat().join("") === p[0].flat().join("")) {
        cache.set(key, p[1]);
        return p[1];
      }
    }
  }
  throw new Error(`Missing pattern`);
};

const enhance = (grid: Grid): Grid => {
  const output: Grid = [[]];
  const size = (grid.length % 2 === 0) ? 2 : 3;
  for (let sy = 0, my = 0; sy < grid.length; sy += size, my++) {
    for (let sx = 0, mx = 0; sx < grid.length; sx += size, mx++) {
      const pattern = match(subgrid(grid, sx, sy, size));
      for (let py = 0; py < pattern.length; py++) {
        const oy = py + (my * pattern.length);
        output[oy] ??= [];
        for (let px = 0; px < pattern.length; px++) {
          output[oy][px + (mx * pattern.length)] = pattern[py][px];
        }
      }
    }
  }
  return output;
};

{
  for (let i = 0; i < 5; i++) state = enhance(state);
  console.log(`Answer 1: ${state.flat().filter((c) => c === "#").length}`);
  for (let i = 0; i < 13; i++) state = enhance(state);
  console.log(`Answer 2: ${state.flat().filter((c) => c === "#").length}`);
}
