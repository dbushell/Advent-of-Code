#!/usr/bin/env -S deno run --allow-read
import { assert } from "jsr:@std/assert/assert";

const inputText = await Deno.readTextFile(
  new URL("input.txt", import.meta.url),
);

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

// Returns visted positions or null if looping
const walkMap = (map: LabMap): Set<string> | null => {
  let guard: XY = getPosition(map);
  let direction = 0 as Direction;
  const history: Array<string> = [key(guard)];
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
      history.push(key(guard));
      if (history.length < 4) continue;
      // Check if stuck in a loop
      const previous = history.slice(-2);
      const index = history.indexOf(previous[0]);
      if (index > -1 && index < history.length - 2) {
        if (history[index + 1] === previous[1]) {
          return null;
        }
      }
    }
  }
  // Return unique positions
  return new Set(history);
};

const map: LabMap = inputText.trim().split("\n");
const visited = walkMap(map);
assert(visited !== null, "Initial map stuck in loop");
const answerOne = visited.size;

let answerTwo = 0;
// Iterate all unique visited positions after starting point
for (const key of [...visited].slice(1)) {
  const newMap = structuredClone(map);
  // Insert obstacle at visited position
  const [x, y] = key.split("-").map((n) => Number.parseInt(n));
  const row = newMap[y].split("");
  assert(row[x] === ".", "Visited area must be empty");
  row[x] = "#";
  newMap[y] = row.join("");
  // Test if new map gets stuck in loop
  if (walkMap(newMap) === null) {
    answerTwo++;
  }
}

console.log(`Answer 1: ${answerOne}`);
console.log(`Answer 2: ${answerTwo}`);
