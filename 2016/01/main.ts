#!/usr/bin/env -S deno run --allow-read

import { Color, color } from "../debug.ts";

const inputText = await Deno.readTextFile(
  new URL("input.txt", import.meta.url),
);

enum Face {
  North = "N",
  South = "S",
  East = "E",
  West = "w",
}

enum Turn {
  Right = "R",
  Left = "L",
}

type XY = [number, number];

// Manhattan distance
const distance = ([ax, ay]: XY, [bx, by]: XY) =>
  Math.abs(ax - bx) + Math.abs(ay - by);

// Parse input commands
const commands: Array<[Turn, number]> = inputText.trim().split(", ")
  .map((cmd) => [cmd[0] as Turn, Number.parseInt(cmd.slice(1))]);

const path: Array<XY> = [[0, 0]];
let face: Face = Face.North;

// Walk the path
for (const [turn, distance] of commands) {
  const [x, y] = path.at(-1)!;
  const left = turn === Turn.Left ? 1 : -1;
  switch (face) {
    case Face.North: {
      face = left > 0 ? Face.West : Face.East;
      path.push([x + left * distance, y]);
      break;
    }
    case Face.South: {
      face = left > 0 ? Face.East : Face.West;
      path.push([x - left * distance, y]);
      break;
    }
    case Face.East: {
      face = left > 0 ? Face.North : Face.South;
      path.push([x, y - left * distance]);
      break;
    }
    case Face.West: {
      face = left > 0 ? Face.South : Face.North;
      path.push([x, y + left * distance]);
      break;
    }
  }
}

// Find the dimensions
const minX = Math.min(...path.map(([x, _]) => x));
const minY = Math.min(...path.map(([_, y]) => y));
const maxX = Math.max(...path.map(([x, _]) => x));
const maxY = Math.max(...path.map(([_, y]) => y));

// Normalise to 0,0 top left corner
path.forEach(([x, y], i) => path[i] = [x - minX, y - minY]);

// Create the grid
const image: Array<Array<string>> = Array.from(
  { length: Math.abs(minY) + maxY + 1 },
  () => new Array(Math.abs(minX) + maxX + 1).fill(color(".", Color.Dim)),
);

// Track all locations
const visited = new Set<string>();
let HQ: XY | undefined = undefined;

// Draw the route
for (let i = 0; i < path.length; i++) {
  const [x, y] = path[i];
  // Track visited path
  const keys = new Set<string>();
  keys.add(`${x},${y}`);
  // Draw path between turns
  if (i > 0) {
    // Sort highest first
    let [tx, ty, [px, py]] = [x, y, path[i - 1]];
    [tx, px] = tx < px ? [px, tx] : [tx, px];
    [ty, py] = ty < py ? [py, ty] : [ty, py];
    while (tx-- > px) {
      if (image[y][tx].includes(".")) image[y][tx] = color("*", Color.Blue);
      keys.add(`${tx},${y}`);
    }
    while (ty-- > py) {
      if (image[ty][x].includes(".")) image[ty][x] = color("*", Color.Blue);
      keys.add(`${x},${ty}`);
    }
    // Remove previous turn
    keys.delete(`${px},${py}`);
  }
  image[y][x] = color("*", Color.Cyan);
  // Check visted locations
  Array.from(keys).map((key) => {
    if (HQ === undefined && visited.has(key)) {
      HQ = key.split(",").map(Number) as XY;
    }
    visited.add(key);
  });
  if (i === path.length - 1) {
    image[y][x] = color("☆", Color.Red);
  }
}
// Add starting point
image[path[0][1]][path[0][0]] = color("★", Color.Yellow);

// Add real location
if (HQ) image[HQ[1]][HQ[0]] = color("★", Color.Yellow);

// console.log(image.map((layer) => layer.join(" ")).join("\n"));

const answerOne = distance(path.at(0)!, path.at(-1)!);
console.log(`Answer 1: ${answerOne}`);

const answerTwo = distance(path.at(0)!, HQ!);
console.log(`Answer 2: ${answerTwo}`);
