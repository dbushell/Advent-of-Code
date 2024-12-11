#!/usr/bin/env -S deno run --allow-read

import { assert } from "jsr:@std/assert/assert";

const inputText = await Deno.readTextFile(
  new URL("input.txt", import.meta.url),
);

// Maximum number of milliseconds before loop is declared
const TIMEOUT_MS = 100;

type XY = [number, number];
type LabMap = Array<string>;
type Direction = 0 | 1 | 2 | 3;

// Get marker position from top-left (0, 0)
const getPosition = (map: LabMap, marker = "^"): XY => {
  for (let y = 0; y < map.length; y++) {
    for (let x = 0; x < map[y].length; x++) {
      if (map[y][x] === marker) return [x, y];
    }
  }
  assert(false, "Guard not found");
};

// Convert XY to unique set key
const key = ([x, y]: XY): string => (`${x}-${y}`);

// XY is within map bounds
const inBounds = ([x, y]: XY, map: LabMap): boolean => {
  if (x < 0) return false;
  if (y < 0) return false;
  if (y >= map.length) return false;
  if (x >= map[0].length) return false;
  return true;
};

const walkMap = (map: LabMap): Set<string> => {
  const start = performance.now();
  let guard: XY = getPosition(map);
  let direction = 0 as Direction;
  const visited = new Set<string>([key(guard)]);
  // Walk the guard
  while (true) {
    // Calculate next position
    const next: XY = [...guard];
    if (direction === 0) next[1]--; // Move up
    if (direction === 1) next[0]++; // Move right
    if (direction === 2) next[1]++; // Move down
    if (direction === 3) next[0]--; // Move left
    // Escaped the map!
    if (!inBounds(next, map)) break;
    // Turn guard or move to next
    if (map[next[1]][next[0]] === "#") {
      if (++direction === 4) direction = 0;
    } else {
      guard = next;
      visited.add(key(guard));
    }
    // Give up and assume loop
    if ((performance.now() - start) > TIMEOUT_MS) {
      throw new Error("stuck in a loop!");
    }
  }
  return visited;
};

const map: LabMap = inputText.trim().split("\n");
const visited = walkMap(map);
const answerOne = visited.size;
let answerTwo = 0;

for (const key of [...visited].slice(1)) {
  const [x, y] = key.split("-").map((n) => Number.parseInt(n));
  const map: LabMap = inputText.trim().split("\n");
  const row = map[y].split("");
  assert(row[x] === ".", "Visited area must be empty");
  row[x] = "#";
  map[y] = row.join("");
  try {
    walkMap(map);
  } catch {
    answerTwo++;
  }
}

console.log(`Answer 1: ${answerOne}`);
console.log(`Answer 2: ${answerTwo}`);
