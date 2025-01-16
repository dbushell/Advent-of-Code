#!/usr/bin/env -S deno run --allow-read

const input = Number.parseInt(
  await Deno.readTextFile(
    new URL("input.txt", import.meta.url),
  ),
);

const sum_table: number[][] = Array.from(
  { length: 301 },
  () => Array(301).fill(0),
);

const powerLevel = (x: number, y: number): number => {
  const rack_id = x + 10;
  let level = rack_id * y;
  level += input;
  level *= rack_id;
  level = Math.floor(level / 100) % 10;
  level -= 5;
  return level;
};

const sumLevel = (x1: number, y1: number, x2: number, y2: number): number => {
  return (
    sum_table[y1][x1] +
    sum_table[y2][x2] -
    sum_table[y1][x2] -
    sum_table[y2][x1]
  );
};

for (let y = 1; y < 301; y++) {
  for (let x = 1; x < 301; x++) {
    let level = powerLevel(x, y);
    level += sum_table[y][x - 1];
    level += sum_table[y - 1][x];
    level -= sum_table[y - 1][x - 1];
    sum_table[y][x] = level;
  }
}

const best_point = [0, 0];
let best_power = -Infinity;
for (let y = 1; y < 298; y++) {
  for (let x = 1; x < 298; x++) {
    const power = sumLevel(x, y, x + 3, y + 3);
    if (power > best_power) {
      best_point[0] = x + 1;
      best_point[1] = y + 1;
      best_power = power;
    }
  }
}
console.log(`Answer 1: ${best_point[0]},${best_point[1]}`);

let best_size = -Infinity;
best_power = 0;

for (let y = 1; y < 291; y++) {
  for (let x = 1; x < 291; x++) {
    const max_size = Math.min(300 - x, 300 - y);
    for (let size = 3; size < (max_size + 1); size++) {
      const power = sumLevel(x, y, x + size, y + size);
      if (power > best_power) {
        best_point[0] = x + 1;
        best_point[1] = y + 1;
        best_power = power;
        best_size = size;
      }
    }
  }
}
console.log(`Answer 2: ${best_point[0]},${best_point[1]},${best_size}`);
