#!/usr/bin/env -S deno run --allow-read

import { assert } from "jsr:@std/assert/assert";

const inputText = await Deno.readTextFile(
  new URL("input.txt", import.meta.url),
);

type XY = [number, number];

type Wire = Array<["U" | "D" | "L" | "R", number]>;

// Manhattan distance
const distance = ([ax, ay]: XY, [bx, by]: XY) =>
  Math.abs(ax - bx) + Math.abs(ay - by);

// Parse input
const parse = (input = inputText): [Wire, Wire] => {
  const wires: Array<Wire> = [];
  for (const line of input.trim().split("\n")) {
    wires.push(
      line.split(",").map((w) =>
        w.match(/(\w)(\d+)/)!.slice(1, 3).map((v, i) => (i ? Number(v) : v))
      ) as Wire,
    );
  }
  return [wires[0], wires[1]];
};

// Get wire positions
const route = (wire: Wire): Map<string, XY> => {
  // Start route at center
  const path = new Map<string, XY>();
  path.set("0,0", [0, 0]);
  let prev = [0, 0];
  const key = ([x, y]: XY): string => {
    let k = `${x},${y}`;
    // Different key if route crosses own path
    while (path.has(k)) k += "+";
    return k;
  };
  // Add all positions for each move
  for (let i = 0; i < wire.length; i++) {
    const offset = wire[i][1];
    for (let j = 0; j < offset; j++) {
      let v: XY;
      switch (wire[i][0]) {
        case "U": {
          v = [prev[0], prev[1] - 1];
          path.set(key(v), v);
          break;
        }
        case "D": {
          v = [prev[0], prev[1] + 1];
          path.set(key(v), v);
          break;
        }
        case "L": {
          v = [prev[0] - 1, prev[1]];
          path.set(key(v), v);
          break;
        }
        case "R": {
          v = [prev[0] + 1, prev[1]];
          path.set(key(v), v);
          break;
        }
        default:
          assert(false, "Bad direction");
      }
      prev = v;
    }
  }
  return path;
};

{
  const [w1, w2] = parse();
  const r1 = route(w1);
  const r2 = route(w2);

  // Find closest intersection
  const intersects = Array.from(r1).filter(([key]) => r2.has(key));
  intersects.sort((a, b) => distance([0, 0], a[1]) - distance([0, 0], b[1]));
  const closest = intersects[1];
  const answerOne = distance([0, 0], closest[1]);
  console.log(`Answer 1: ${answerOne}`);

  // Count shortest steps
  const steps: Array<number> = [];
  for (let i = 0; i < intersects.length; i++) {
    const inter = intersects[i];
    steps[i] ??= 0;
    Array.from(r1.values()).some(([x, y]) => {
      if (inter[1][0] === x && inter[1][1] === y) return true;
      steps[i]++;
    });
    Array.from(r2.values()).some(([x, y]) => {
      if (inter[1][0] === x && inter[1][1] === y) return true;
      steps[i]++;
    });
  }
  const answerTwo = steps.toSorted((a, b) => a - b).at(1);
  console.log(`Answer 2: ${answerTwo}`);
}
