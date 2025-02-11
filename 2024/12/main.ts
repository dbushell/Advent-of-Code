#!/usr/bin/env -S deno run --allow-read

import { assert } from "jsr:@std/assert/assert";

const inputText = await Deno.readTextFile(
  new URL("input.txt", import.meta.url),
);

type XY = [number, number];

type Region = {
  label: string;
  plots: Array<XY>;
  perimeter: number;
  sides: number;
};

type Map = {
  data: Array<Array<string>>;
  xSize: number;
  ySize: number;
};

// Map [0, 0] top-left
const data = inputText.trim().split("\n").map((row) => row.split(""));
const map: Map = {
  data,
  ySize: data.length,
  xSize: data[0].length,
};

const at = (map: Map, x: number, y: number): string | undefined => {
  if (x < 0 || x >= map.xSize) return undefined;
  if (y < 0 || y >= map.ySize) return undefined;
  return map.data[y][x];
};

const has = (plots: Array<XY>, [x, y]: XY) =>
  plots.some((p) => (p[0] === x && p[1] === y));

const countSides = ({ plots }: Region): number => {
  let sides = 0;
  // Count the corners
  for (const [x, y] of plots) {
    const a: XY = [x, y - 1];
    const b: XY = [x, y + 1];
    const c: XY = [x - 1, y];
    const d: XY = [x + 1, y];
    const e: XY = [x - 1, y - 1];
    const f: XY = [x + 1, y - 1];
    const g: XY = [x - 1, y + 1];
    const h: XY = [x + 1, y + 1];
    // Outside corners
    if (!has(plots, a) && !has(plots, c)) sides++;
    if (!has(plots, a) && !has(plots, d)) sides++;
    if (!has(plots, b) && !has(plots, c)) sides++;
    if (!has(plots, b) && !has(plots, d)) sides++;
    // Inside corners
    if (has(plots, a) && has(plots, c) && !has(plots, e)) sides++;
    if (has(plots, a) && has(plots, d) && !has(plots, f)) sides++;
    if (has(plots, b) && has(plots, c) && !has(plots, g)) sides++;
    if (has(plots, b) && has(plots, d) && !has(plots, h)) sides++;
  }
  return sides;
};

const getRegions = (map: Map) => {
  const regions: Array<Region> = [];
  const visited = new Set<string>();
  for (let y = 0; y < map.ySize; y++) {
    for (let x = 0; x < map.xSize; x++) {
      // Setup possible region
      const label = at(map, x, y);
      assert(label, "Plot is empty");
      const region: Region = { label, plots: [], perimeter: 0, sides: 0 };
      // Find plots
      const walk = (x: number, y: number) => {
        if (at(map, x, y) !== label) {
          region.perimeter++;
          return;
        }
        // Only visit once
        const key = `${x}-${y}`;
        if (visited.has(key)) return;
        visited.add(key);
        region.plots.push([x, y]);
        // Check up, down, left, right
        walk(x, y - 1);
        walk(x, y + 1);
        walk(x - 1, y);
        walk(x + 1, y);
      };
      walk(x, y);
      if (region.plots.length) {
        region.sides = countSides(region);
        regions.push(region);
      }
    }
  }
  return regions;
};

const regions = getRegions(map);

let answerOne = 0;
let answerTwo = 0;
for (const region of regions) {
  answerOne += region.plots.length * region.perimeter;
  answerTwo += region.plots.length * region.sides;
}

console.log(`Answer 1: ${answerOne}`);
console.log(`Answer 2: ${answerTwo}`);
