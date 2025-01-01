#!/usr/bin/env -S deno run --allow-read

import { assert } from "jsr:@std/assert/assert";

import { Color, color, screen, write } from "../debug.ts";
import { adjacentXY, getXY, isXY, keyXY, setXY } from "../helpers.ts";

const inputText = await Deno.readTextFile(
  new URL("input.txt", import.meta.url),
);

type XY = { x: number; y: number };

type Grid = Array<Array<string>>;

type Portal = { key: string; xy: XY; outer?: boolean; inner?: boolean };

type State = {
  grid: [Grid, Grid];
  start: XY;
  end: XY;
  portals: Map<string, XY>;
  outer: Map<string, XY>;
  inner: Map<string, XY>;
  recursive?: boolean;
};

const getDepth = (xy: XY) => Math.floor(xy.x / 1000);

const normalXY = (xy: XY): XY => ({ x: xy.x % 1000, y: xy.y % 1000 });

const findXY = (state: State, start: XY, end: XY): Array<XY> => {
  const visited = new Map<string, XY | null>();
  const queue: Array<XY> = [start];
  visited.set(keyXY(start), null);
  while (queue.length > 0) {
    const current = queue.shift()!;
    const depth = getDepth(current);
    if (current.x === end.x && current.y === end.y) {
      const route: Array<XY> = [];
      let step: XY | null = current;
      while (step) {
        route.push(step);
        step = visited.get(keyXY(step)) || null;
      }
      return route.reverse();
    }
    const adjacent = adjacentXY(normalXY(current));
    // Adjust neighbours for depth
    if (state.recursive && depth) {
      adjacent.forEach((xy) => {
        xy.x += depth * 1000;
        xy.y += depth * 1000;
      });
    }
    let portals = state.portals;
    // Top level zero only has inner portals
    if (state.recursive && depth === 0) portals = state.inner;
    const pkey = keyXY(normalXY(current));
    const portal = portals.get(pkey);
    // Adjust portal XY for depth
    if (state.recursive && portal) {
      const inner = state.inner.has(pkey);
      const multi = (depth + (inner ? 1 : -1)) * 1000;
      const pxy = { x: portal.x + multi, y: portal.y + multi };
      adjacent.push(pxy);
    } else if (portal) {
      adjacent.push(portal);
    }
    for (const { x, y } of adjacent) {
      const neighbour = { x, y };
      let grid = state.grid[0];
      // Use second grid for deeper levels
      if (state.recursive && getDepth(neighbour)) {
        grid = state.grid[1];
      }
      if (!isXY(grid, normalXY(neighbour))) continue;
      if (getXY(grid, normalXY(neighbour)) === "#") continue;
      const key = keyXY(neighbour);
      if (visited.has(key)) continue;
      visited.set(key, current);
      queue.push(neighbour);
    }
  }
  return [];
};

const parse = (recursive = false): State => {
  const state: State = {
    grid: [[], []],
    start: { x: 0, y: 0 },
    end: { x: 0, y: 0 },
    portals: new Map(),
    outer: new Map(),
    inner: new Map(),
    recursive,
  };
  const grid = state.grid[0];
  for (const line of inputText.split("\n")) {
    if (line.trim().length === 0) continue;
    grid.push(line.split(""));
  }
  const height = grid.length;
  const width = Math.max(...grid.map((layer) => layer.length));
  const portals: Array<Portal> = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      grid[y][x] ??= " ";
      const xy = { x, y };
      const c1 = getXY(grid, xy) as string;
      if (/[A-Z]/.test(c1)) {
        const portal: Portal = {
          key: "",
          xy: { x: -1, y: -1 },
          outer: x === 0 || y === 0,
        };
        const a1 = { x, y: y - 1 };
        const b1 = { x, y: y + 1 };
        const b2 = { x, y: y + 2 };
        const l1 = { x: x - 1, y };
        const r1 = { x: x + 1, y };
        const r2 = { x: x + 2, y };
        const cb2 = isXY(grid, b1) ? getXY(grid, b1) as string : "";
        const cr2 = isXY(grid, r1) ? getXY(grid, r1) as string : "";
        // Top and bottom sides
        if (isXY(grid, b1) && /[A-Z]/.test(cb2)) {
          // Bottom sides
          if (isXY(grid, a1) && getXY(grid, a1) === ".") {
            setXY(grid, xy, "#");
            setXY(grid, b1, " ");
            setXY(grid, a1, c1 + cb2);
            if (c1 + cb2 === "AA") state.start = a1;
            else if (c1 + cb2 === "ZZ") state.end = a1;
            else {
              portal.key = c1 + cb2;
              portal.xy = a1;
              portal.outer = xy.y === height - 2;
            }
            if (xy.y === height - 1) portal.outer = true;
          } // Top sides
          else {
            setXY(grid, xy, " ");
            setXY(grid, b1, "#");
            setXY(grid, b2, c1 + cb2);
            if (c1 + cb2 === "AA") state.start = b2;
            else if (c1 + cb2 === "ZZ") state.end = b2;
            else {
              portal.key = c1 + cb2;
              portal.xy = b2;
            }
          }
          // Left and right sides
        } else if (isXY(grid, r1) && /[A-Z]/.test(cr2)) {
          // Right sides
          if (isXY(grid, r2) && getXY(grid, r2) === ".") {
            setXY(grid, xy, " ");
            setXY(grid, r1, "#");
            setXY(grid, r2, c1 + cr2);
            if (c1 + cr2 === "AA") state.start = r2;
            else if (c1 + cr2 === "ZZ") state.end = r2;
            else {
              portal.key = c1 + cr2;
              portal.xy = r2;
            }
          } // Left sides
          else {
            setXY(grid, xy, "#");
            setXY(grid, r1, " ");
            setXY(grid, l1, c1 + cr2);
            if (c1 + cr2 === "AA") state.start = l1;
            else if (c1 + cr2 === "ZZ") state.end = l1;
            else {
              portal.key = c1 + cr2;
              portal.xy = l1;
              portal.outer = xy.x === width - 2;
            }
          }
        }
        if (isXY(grid, portal.xy)) {
          portal.inner = !portal.outer;
          portals.push(portal);
        }
      }
    }
  }
  portals.sort((a, b) => a.key.localeCompare(b.key));
  assert(portals.length % 2 == 0, "Odd number of portals");
  while (portals.length) {
    const p1 = portals.pop()!;
    const p2 = portals.pop()!;
    const k1 = keyXY(p1.xy);
    const k2 = keyXY(p2.xy);
    state.portals.set(k1, p2.xy);
    state.portals.set(k2, p1.xy);
    if (p1.outer) state.outer.set(k1, p2.xy);
    else state.inner.set(k1, p2.xy);
    if (p2.outer) state.outer.set(k2, p1.xy);
    else state.inner.set(k2, p1.xy);
  }
  // Second level
  if (recursive) {
    state.grid[1] = structuredClone<Grid>(state.grid[0]);
    setXY(state.grid[1], state.start, "#");
    setXY(state.grid[1], state.end, "#");
    // First level (inner maps to outer)
    state.inner.forEach((portal) => {
      setXY(state.grid[0], portal, "#");
    });
  }
  return state;
};

const print = (state: State) => {
  const cell = (c: string) => {
    if (c === ".") return color(". ", Color.Dim);
    if (c === "*") return color("* ", Color.Green);
    if (c === "#") return color("■ ", Color.Purple);
    if (c === "AA") return color("☆ ", Color.Yellow);
    if (c === "ZZ") return color("★ ", Color.Yellow);
    if (/[A-Z]/.test(c)) return color(c, Color.Cyan);
    return c.padEnd(2, " ");
  };
  // Print levels side by side
  let out = "";
  for (let y = 0; y < state.grid[0].length; y++) {
    out += state.grid[0][y].map(cell).join("");
    if (state.grid[1].length) {
      out += " ";
      out += state.grid[1][y].map(cell).join("");
    }
    out += "\n";
  }
  screen.hideCursor();
  screen.clear();
  write(`${out}\n`);
  screen.showCursor();
};

let answerOne = 0;
let answerTwo = 0;

{
  const state = parse();
  const path = findXY(state, state.start, state.end);
  // for (const xy of path) {
  //   if (getXY(state.grid[0], xy) === ".") {
  //     setXY(state.grid[0], xy, "*");
  //   }
  // }
  // print(state);
  answerOne = path.length - 1;
}

{
  const state = parse(true);
  const path = findXY(state, state.start, state.end);
  // for (const xy of path) {
  //   const grid = getDepth(xy) ? state.grid[1] : state.grid[0];
  //   if (getXY(grid, normalXY(xy)) === ".") {
  //     setXY(grid, normalXY(xy), "*");
  //   }
  // }
  // print(state);
  answerTwo = path.length - 1;
}

console.log(`Answer 1: ${answerOne}`);
console.log(`Answer 2: ${answerTwo}`);
