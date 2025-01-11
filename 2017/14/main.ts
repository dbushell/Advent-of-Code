#!/usr/bin/env -S deno run --allow-read

import { adjacentXY, isXY, keyXY } from "../../2016/helpers.ts";
import { knotHash } from "../10/main.ts";

const inputText = (await Deno.readTextFile(
  new URL("input.txt", import.meta.url),
)).trim();

type XY = { x: number; y: number };

const grid: Array<Array<number>> = Array.from({ length: 128 });

const inputHash = (str: string): Array<number> => {
  return str.split("").map((n) => n.codePointAt(0)!);
};

for (let y = 0; y < grid.length; y++) {
  const input = inputHash(`${inputText}-${y}`);
  grid[y] = knotHash(input).map((n) =>
    Array.from({ length: 8 }, (_, i) => (n & (1 << i)) >> i)
  ).reverse().flat();
}

const count = grid.flat().reduce((c, v) => (c += v), 0);
console.log(`Answer 1: ${count}`);

const visited = new Set<string>();

const flood = (start: XY) => {
  visited.add(keyXY(start));
  const queue: Array<XY> = [start];
  while (queue.length) {
    const current = queue.shift()!;
    for (const { x, y } of adjacentXY(current)) {
      if (!isXY(grid, { x, y })) continue;
      const key = keyXY({ x, y });
      if (visited.has(key)) continue;
      visited.add(key);
      if (grid[y][x]) queue.push({ x, y });
    }
  }
};

let regions = 0;
for (let y = 0; y < grid.length; y++) {
  for (let x = 0; x < grid[y].length; x++) {
    if (visited.has(keyXY({ x, y }))) continue;
    if (grid[y][x] === 0) continue;
    flood({ x, y });
    regions++;
  }
}
console.log(`Answer 2: ${regions}`);
