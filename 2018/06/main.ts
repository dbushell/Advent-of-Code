#!/usr/bin/env -S deno run --allow-read

const inputText = await Deno.readTextFile(
  new URL("input.txt", import.meta.url),
);

type XY = [number, number];

const distance = ([ax, ay]: XY, [bx, by]: XY) =>
  Math.abs(ax - bx) + Math.abs(ay - by);

const coordinates: Array<XY> = inputText
  .trim().split("\n").map((line) =>
    line.match(/^(\d+), (\d+)$/)!.slice(1, 3).map(Number) as XY
  );

const allX = coordinates.map((n) => n[0]);
const allY = coordinates.map((n) => n[1]);
const min = [Math.min(...allX), Math.min(...allY)];
const max = [Math.max(...allX), Math.max(...allY)];

const infinite = new Set<XY>();
const areas = new Map<XY, number>();

for (let y = min[1]; y < max[1] + 1; y++) {
  for (let x = min[0]; x < max[0] + 1; x++) {
    let best: XY | null = null;
    let bestDistance = Infinity;
    for (const coord of coordinates) {
      const d = distance([x, y], [coord[0], coord[1]]);
      if (d === bestDistance) {
        best = null;
      } else if (d < bestDistance) {
        bestDistance = d;
        best = coord;
      }
    }
    if (best === null) continue;
    areas.set(best, (areas.get(best) ?? 0) + 1);
    if ([min[0], max[0]].includes(x) || [min[1], max[1]].includes(y)) {
      infinite.add(best);
    }
  }
}

// Sort finite sized regions
const valid = Array.from(areas)
  .filter(([xy]) => !infinite.has(xy))
  .sort((a, b) => b[1] - a[1]);

console.log(`Answer 1: ${valid[0][1]}`);

let locations = 0;
for (let y = min[1]; y < max[1] + 1; y++) {
  xloop: for (let x = min[0]; x < max[0] + 1; x++) {
    let d = 0;
    for (const c1 of coordinates) {
      d += distance([x, y], c1);
      if (d >= 10_000) continue xloop;
    }
    locations++;
  }
}
console.log(`Answer 2: ${locations}`);
