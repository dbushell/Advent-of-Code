#!/usr/bin/env -S deno run --allow-read

const inputText = await Deno.readTextFile(
  new URL("input.txt", import.meta.url),
);

// Map [0, 0] top-left
const map = inputText.trim().split("\n").map((row) =>
  row.split("").map((n) => Number.parseInt(n))
);
const ySize = map.length;
const xSize = map[0].length;

// Returns 0-9 (or -1 of out of bounds)
const heightAt = (x: number, y: number) => {
  if (x < 0 || x >= xSize) return -1;
  if (y < 0 || y >= ySize) return -1;
  return map[y][x];
};

// Find all starting positions
const allTrailheads: Array<[number, number]> = [];
for (let y = 0; y < ySize; y++) {
  for (let x = 0; x < xSize; x++) {
    if (heightAt(x, y) === 0) {
      allTrailheads.push([x, y]);
    }
  }
}

// Climb a trail following all paths
const walkTrail = (zeroX: number, zeroY: number): number => {
  const peaks = new Set<string>();
  // Climb one level at a time
  const walk = (x: number, y: number) => {
    const current = heightAt(x, y);
    if (current === 9) {
      peaks.add(`${x}-${y}`);
      return;
    }
    const next = current + 1;
    // Walk up, down, left, right
    if (heightAt(x, y - 1) === next) walk(x, y - 1);
    if (heightAt(x, y + 1) === next) walk(x, y + 1);
    if (heightAt(x - 1, y) === next) walk(x - 1, y);
    if (heightAt(x + 1, y) === next) walk(x + 1, y);
  };
  walk(zeroX, zeroY);
  return peaks.size;
};

let answerOne = 0;
for (const [x, y] of allTrailheads) {
  answerOne += walkTrail(x, y);
}

console.log(`Answer 1: ${answerOne}`);
