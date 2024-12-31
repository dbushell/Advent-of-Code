#!/usr/bin/env -S deno run --allow-read

import { type Memory, newVM, proxyVM, runVM } from "../intcode.ts";
import { Color, color, screen, write } from "../debug.ts";
import { assert } from "jsr:@std/assert/assert";
import { adjacentXY, keyXY, sameXY, setXY } from "../helpers.ts";

const inputText = await Deno.readTextFile(
  new URL("input.txt", import.meta.url),
);

enum Move {
  North = 1,
  South = 2,
  West = 3,
  East = 4,
}

enum Status {
  Wall = 0,
  Moved = 1,
  Found = 2,
}

enum Cell {
  Empty = ".",
  Visited = "•",
  Oxygen = "◦",
  Wall = "■",
  Droid = "●",
  Start = "☆",
  End = "★",
}

type XY = { x: number; y: number };

const moveXY = ({ x, y }: XY, direction: Move) => {
  switch (direction) {
    case Move.North:
      return { x, y: y - 1 };
    case Move.South:
      return { x, y: y + 1 };
    case Move.East:
      return { x: x + 1, y };
    case Move.West:
      return { x: x - 1, y };
  }
};

const targetXY = (
  visited: Map<string, XY>,
  blocked: Map<string, XY>,
  xy: XY,
  min: XY,
  max: XY,
  end?: XY,
): XY | null => {
  const surround = new Map<string, XY>();
  let border = new Map<string, XY>();
  surround.set(keyXY(xy), xy);
  border.set(keyXY(xy), xy);
  while (true) {
    const nextBorder = new Map<string, XY>();
    for (const b of border.values()) {
      for (const c of adjacentXY(b)) {
        if (end) {
          if (c.x < min.x || c.x > max.x) continue;
          if (c.y < min.y || c.y > max.y) continue;
        }
        const key = keyXY(c);
        if (!visited.has(key)) {
          const trapped = adjacentXY(c).every((n) => visited.has(keyXY(n)));
          if (trapped) {
            visited.set(keyXY(c), c);
            blocked.set(keyXY(c), c);
          } else {
            return c;
          }
        }
        if (!surround.has(key)) {
          surround.set(key, c);
          nextBorder.set(key, c);
        }
      }
    }
    if (nextBorder.size === 0) {
      return null;
    }
    border = nextBorder;
  }
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
      const neighbor = { x, y };
      const key = keyXY(neighbor);
      if (blocked.has(key)) continue;
      if (visited.has(key)) continue;
      if (allowed && !allowed.has(key)) continue;
      visited.set(key, current);
      queue.push(neighbor);
    }
  }
  return [];
};

const memory: Memory = inputText.trim().split(",").map(Number);
const vm = newVM(memory);

let answerOne = 0;
let answerTwo = 0;

let framerate = 1000 / 60;

let now = { x: 0, y: 0 };
let end: XY | undefined;
let move: Move = Move.North;
let nextRoute: Array<XY> = [];
let min: XY = { x: 0, y: 0 };
let max: XY = { x: 0, y: 0 };
let grid: Array<Array<string>> = [[Cell.Empty]];
const allowed = new Map<string, XY>();
const blocked = new Map<string, XY>();
const visited = new Map<string, XY>();
const oxygend = new Map<string, XY>();

visited.set(keyXY(now), now);

const normalize = ({ x, y }: XY) => ({
  x: x - min.x,
  y: y - min.y,
});

const frame = () => {
  const points = [...blocked.values(), ...allowed.values()];
  for (const { x, y } of points) {
    min = { x: Math.min(x, min.x), y: Math.min(y, min.y) };
    max = { x: Math.max(x, max.x), y: Math.max(y, max.y) };
  }
  const height = (max.y - min.y) + 1;
  const width = (max.x - min.x) + 1;
  grid = Array.from(
    { length: height },
    () => new Array(width).fill(color(Cell.Empty, Color.Dim)),
  );
  for (const xy of visited.values()) {
    const { x, y } = normalize(xy);
    setXY(grid, { x, y }, color(Cell.Visited, Color.Green));
  }
  for (const xy of oxygend.values()) {
    setXY(grid, normalize(xy), color(Cell.Oxygen, Color.Cyan));
  }
  for (const xy of blocked.values()) {
    setXY(grid, normalize(xy), color(Cell.Wall, Color.Purple));
  }
  setXY(grid, normalize(points.at(-1)!), color(Cell.Droid, Color.Yellow));
  setXY(grid, normalize({ x: 0, y: 0 }), color(Cell.Start, Color.Yellow));
  if (end) setXY(grid, normalize(end), color(Cell.End, Color.Yellow));
  screen.hideCursor();
  screen.clear();
  write(grid.map((layer) => layer.join(" ")).join("\n"));
  write("\n");
  screen.showCursor();
};

const nextMove = (): boolean => {
  if (!nextRoute.length) {
    while (!nextRoute.length) {
      const target = targetXY(visited, blocked, now, min, max, end);
      if (target === null) {
        return false;
      }
      nextRoute = findXY(blocked, now, target);
      if (!nextRoute.length) {
        visited.set(keyXY(target), target);
        blocked.set(keyXY(target), target);
      }
    }
    if (sameXY(now, nextRoute[0])) {
      nextRoute.shift();
    }
  }
  const next = nextRoute.shift()!;
  if (next.y === now.y - 1 && next.x === now.x) move = Move.North;
  if (next.y === now.y + 1 && next.x === now.x) move = Move.South;
  if (next.x === now.x - 1 && next.y === now.y) move = Move.West;
  if (next.x === now.x + 1 && next.y === now.y) move = Move.East;
  setTimeout(() => vm.input.push(move), framerate);
  return true;
};

nextMove();

const oxygen = async () => {
  assert(end, "Part one did not end!");
  framerate = 1000 / 60;
  let border = new Map<string, XY>();
  oxygend.set(keyXY(end), end);
  border.set(keyXY(end), end);
  while (border.size) {
    const nextBorder = new Map<string, XY>();
    for (const b of border.values()) {
      for (const c of adjacentXY(b)) {
        const key = keyXY(c);
        if (!visited.has(key)) continue;
        if (blocked.has(key)) continue;
        if (!oxygend.has(key)) {
          oxygend.set(key, c);
          nextBorder.set(key, c);
        }
      }
    }
    frame();
    await new Promise((resolve) => setTimeout(resolve, framerate));
    border = nextBorder;
    answerTwo++;
  }
  console.log(`Answer 1: ${answerOne}`);
  console.log(`Answer 2: ${answerTwo}`);
  Deno.exit();
};

proxyVM(vm, undefined, () => {
  const status = vm.output.at(-1)!;
  assert(status >= 0 && status <= 2, "Bad status report");
  if (status === Status.Found) {
    end = { ...now };
    const route = findXY(blocked, { x: 0, y: 0 }, now, allowed);
    answerOne = route.length;
    framerate = 1000 / 240;
  }
  let moving = true;
  if (status === Status.Found || status === Status.Moved) {
    now = moveXY(now, move);
    visited.set(keyXY(now), now);
    let key = keyXY(now);
    while (allowed.has(key)) key += "+";
    allowed.set(key, now);
    moving = nextMove();
  }
  if (status === Status.Wall) {
    const wall = moveXY(now, move);
    visited.set(keyXY(wall), wall);
    blocked.set(keyXY(wall), wall);
    nextRoute.length = 0;
    moving = nextMove();
  }
  frame();
  if (moving === false) {
    oxygen();
  }
});

await runVM(vm);
