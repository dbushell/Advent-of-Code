#!/usr/bin/env -S deno run --allow-read

import { Color, color } from "../debug.ts";
import { adjacentXY, isXY, keyXY } from "../helpers.ts";

const inputText = (await Deno.readTextFile(
  new URL("input.txt", import.meta.url),
)).trim();

type XY = { x: number; y: number };

const size: XY = { x: 45, y: 45 };
const maze: Array<Array<string>> = [];
const blocked = new Map<string, XY>();

const calc = (x: number, y: number) => {
  let value = (x * x) + (3 * x) + (2 * x * y) + y + (y * y);
  value += Number.parseInt(inputText);
  const bits = value.toString(2).replaceAll("0", "").length;
  const empty = bits % 2 === 0;
  if (!empty) blocked.set(`${x},${y}`, { x, y });
  return empty ? "." : "#";
};

const findXY = (
  blocked: Map<string, XY>,
  start: XY,
  end: XY,
  allowed?: Map<string, XY>,
): Array<XY> => {
  const visited = new Map<string, XY | null>();
  const queue: Array<XY> = [start];
  visited.set(keyXY(start), null);
  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current.x === end.x && current.y === end.y) {
      const route: Array<XY> = [];
      let step: XY | null = current;
      while (step) {
        route.push(step);
        step = visited.get(keyXY(step)) || null;
      }
      return route.reverse();
    }
    for (const { x, y } of adjacentXY(current)) {
      const neighbour = { x, y };
      const key = keyXY(neighbour);
      if (!isXY(maze, neighbour)) continue;
      if (blocked.has(key)) continue;
      if (visited.has(key)) continue;
      if (allowed && !allowed.has(key)) continue;
      visited.set(key, current);
      queue.push(neighbour);
    }
  }
  return [];
};

for (let y = 0; y < size.y; y++) {
  maze[y] ??= [];
  for (let x = 0; x < size.x; x++) {
    maze[y][x] = calc(x, y);
  }
}

const path = findXY(blocked, { x: 1, y: 1 }, { x: 31, y: 39 });
for (const { x, y } of path) maze[y][x] = "•";

maze[1][1] = color("☆", Color.Yellow);
maze[39][31] = color("★", Color.Yellow);

let answerTwo = 0;
const possible: Array<XY> = [];
for (let y = 0; y < size.y; y++) {
  for (let x = 0; x < size.x; x++) {
    const { length } = findXY(blocked, { x: 1, y: 1 }, { x, y });
    if (length && length <= 51) {
      possible.push({ x, y });
      answerTwo++;
    }
  }
}

for (const { x, y } of possible) maze[y][x] = "*";
let out = maze.map((layer) => layer.join(" ")).join("\n");
out = out.replaceAll(".", color(".", Color.Dim));
out = out.replaceAll("•", color("•", Color.Green));
out = out.replaceAll("#", color("■", Color.Red));
out = out.replaceAll("*", color("*", Color.Cyan));
console.log(out);

console.log(`Answer 1: ${path.length - 1}`);
console.log(`Answer 2: ${answerTwo}`);
