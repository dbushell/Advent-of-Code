#!/usr/bin/env -S deno run --allow-read

const input = Number.parseInt(
  await Deno.readTextFile(
    new URL("input.txt", import.meta.url),
  ),
);

const power_levels: number[][] = Array.from(
  { length: 301 },
  () => Array(301).fill(undefined),
);

const powerLevel = (x: number, y: number): number => {
  if (power_levels[y][x] !== undefined) return power_levels[y][x];
  const rack_id = x + 10;
  let level = rack_id * y;
  level += input;
  level *= rack_id;
  level = Math.floor(level / 100) % 10;
  level -= 5;
  power_levels[y][x] = level;
  return level;
};

const sumLevel = (x1: number, y1: number, x2: number, y2: number): number => {
  let total: number = 0;
  for (let y = y1; y < y2; y++) {
    for (let x = x1; x < x2; x++) {
      total += powerLevel(x, y);
    }
  }
  return total;
};

const best_point = [0, 0];
let best_power = -Infinity;
for (let y = 1; y < 299; y++) {
  for (let x = 1; x < 299; x++) {
    const power = sumLevel(x, y, x + 3, y + 3);
    if (power > best_power) {
      best_point[0] = x;
      best_point[1] = y;
      best_power = power;
    }
  }
}
console.log(`Answer 1: ${best_point[0]},${best_point[1]}`);

let best_size = -Infinity;
best_power = 0;

for (let y = 1; y < 291; y++) {
  for (let x = 1; x < 291; x++) {
    // Assume best size is below 30
    const max_size = Math.min(30, Math.min(300 - x, 300 - y));
    for (let size = 3; size < (max_size + 1); size++) {
      const power = sumLevel(x, y, x + size, y + size);
      if (power > best_power) {
        best_point[0] = x;
        best_point[1] = y;
        best_power = power;
        best_size = size;
      }
    }
  }
}
console.log(`Answer 2: ${best_point[0]},${best_point[1]},${best_size}`);
