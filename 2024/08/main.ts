#!/usr/bin/env -S deno run --allow-read
import { assert } from "jsr:@std/assert/assert";

const inputText = await Deno.readTextFile(
  new URL("input.txt", import.meta.url),
);

type Antenna = {
  frequency: string;
  x: number;
  y: number;
};

const isAntenna = (char: string) => /[a-zA-Z0-9]/.test(char);

const frequencies = new Set<string>(inputText.split("").filter(isAntenna));

const antennaByFrequency = new Map<string, Array<Antenna>>();
frequencies.forEach((frequency) => antennaByFrequency.set(frequency, []));

// Map [0, 0] top-left
const grid = inputText.trim().split("\n");
const rowCount = grid.length;
const colCount = grid[0].length;

// XY is within map bounds
const inBounds = (x: number, y: number): boolean => {
  if (x < 0) return false;
  if (y < 0) return false;
  if (y >= rowCount) return false;
  if (x >= colCount) return false;
  return true;
};

// Iterate rows and columns to create map of antennas
for (let y = 0; y < rowCount; y++) {
  for (let x = 0; x < colCount; x++) {
    const frequency = grid[y][x];
    if (isAntenna(frequency)) {
      const array = antennaByFrequency.get(frequency);
      assert(array, "Unknown freqency");
      array.push({ frequency, x, y });
    }
  }
}

// Order top-left most (is this necessary?)
const orderAntennas = (a: Antenna, b: Antenna): [Antenna, Antenna] => {
  assert(!(a.x === b.x && a.y === b.y), "Should not be same location");
  if (a.y < b.y) return [a, b];
  if (b.y < a.y) return [b, a];
  if (a.x < b.x) return [a, b];
  return [b, a];
};

// Calculate unique positions for part 1
const answerOne = new Set<string>();
for (const freqency of frequencies) {
  const array = antennaByFrequency.get(freqency)!;
  // Track antennas to avoid duplicate pairs
  const processed = new WeakSet();
  for (let a of array) {
    processed.add(a);
    for (let b of array) {
      if (a === b || processed.has(b)) continue;
      [a, b] = orderAntennas(a, b);
      const cx = a.x + (a.x - b.x);
      const cy = a.y + (a.y - b.y);
      const dx = b.x + (b.x - a.x);
      const dy = b.y + (b.y - a.y);
      if (inBounds(cx, cy)) {
        answerOne.add(`${cx}-${cy}`);
      }
      if (inBounds(dx, dy)) {
        answerOne.add(`${dx}-${dy}`);
      }
    }
  }
}

// Calculate unique positions for part 1
const answerTwo = new Set<string>();
for (const freqency of frequencies) {
  const array = antennaByFrequency.get(freqency)!;
  // Track antennas to avoid duplicate pairs
  const processed = new WeakSet();
  for (let a of array) {
    processed.add(a);
    for (let b of array) {
      if (a === b || processed.has(b)) continue;
      [a, b] = orderAntennas(a, b);
      // Move in one direction until out of bounds
      let cx = a.x + (a.x - b.x);
      let cy = a.y + (a.y - b.y);
      while (true) {
        if (inBounds(cx, cy)) {
          answerTwo.add(`${cx}-${cy}`);
          cx += a.x - b.x;
          cy += a.y - b.y;
        } else {
          break;
        }
      }
      // Retrace steps back until out of bounds the other way
      cx -= a.x - b.x;
      cy -= a.y - b.y;
      while (true) {
        if (inBounds(cx, cy)) {
          answerTwo.add(`${cx}-${cy}`);
          cx -= a.x - b.x;
          cy -= a.y - b.y;
        } else {
          break;
        }
      }
    }
  }
}

console.log(`Answer 1: ${answerOne.size}`);
console.log(`Answer 2: ${answerTwo.size}`);
