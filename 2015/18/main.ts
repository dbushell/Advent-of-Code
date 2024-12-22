#!/usr/bin/env -S deno run --allow-read

import { assert } from "jsr:@std/assert/assert";

const inputText = await Deno.readTextFile(
  new URL("input.txt", import.meta.url),
);

type XY = [number, number];

type Grid = Array<Array<number>>;

const isXY = (grid: Grid, [x, y]: XY): boolean => {
  if (x < 0 || y < 0) return false;
  if (y >= grid.length) return false;
  if (x >= grid[y].length) return false;
  return true;
};

const getXY = (grid: Grid, [x, y]: XY): number => {
  assert(isXY(grid, [x, y]), "getXY out of bounds");
  return grid[y][x];
};

const setXY = (grid: Grid, [x, y]: XY, value: number) => {
  assert(isXY(grid, [x, y]), "setXY out of bounds");
  grid[y][x] = value;
};

const upXY = ([x, y]: XY): XY => [x, y - 1];
const downXY = ([x, y]: XY): XY => [x, y + 1];
const leftXY = ([x, y]: XY): XY => [x - 1, y];
const rightXY = ([x, y]: XY): XY => [x + 1, y];
const upLeftXY = ([x, y]: XY): XY => [x - 1, y - 1];
const upRightXY = ([x, y]: XY): XY => [x + 1, y - 1];
const downLeftXY = ([x, y]: XY): XY => [x - 1, y + 1];
const downRightXY = ([x, y]: XY): XY => [x + 1, y + 1];

const adjacentXY = (
  xy: XY,
): Array<XY> => [
  upXY(xy),
  downXY(xy),
  leftXY(xy),
  rightXY(xy),
];

const neighbourXY = (
  xy: XY,
): Array<XY> => [
  ...adjacentXY(xy),
  upLeftXY(xy),
  upRightXY(xy),
  downLeftXY(xy),
  downRightXY(xy),
];

const grid: Grid = [];
for (const line of inputText.trim().split("\n")) {
  grid.push(
    line.split("").map((char) => char === "#" ? 1 : 0),
  );
}

const step = (grid: Grid) => {
  const snapshot = structuredClone(grid);
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[y].length; x++) {
      const state = getXY(snapshot, [x, y]);
      const neighbours = neighbourXY([x, y]);
      const on = neighbours
        .filter((xy) => isXY(grid, xy))
        .map((xy) => getXY(snapshot, xy))
        .reduce((count, state) => (count + state), 0);
      if (state === 1) {
        if (on < 2 || on > 3) setXY(grid, [x, y], 0);
      } else {
        if (on === 3) setXY(grid, [x, y], 1);
      }
    }
  }
};

{
  // Part 1
  const grid1 = structuredClone(grid);
  for (let i = 0; i < 100; i++) step(grid1);
  const answerOne = grid1.flat().reduce((count, state) => (count + state), 0);
  console.log(`Answer 1: ${answerOne}`);
}

{
  const grid2 = structuredClone(grid);
  // Part 1
  const stuck = () => {
    setXY(grid2, [0, 0], 1);
    setXY(grid2, [0, 99], 1);
    setXY(grid2, [99, 99], 1);
    setXY(grid2, [99, 0], 1);
  };
  stuck();
  for (let i = 0; i < 100; i++) {
    step(grid2);
    stuck();
  }

  const answerTwo = grid2.flat().reduce((count, state) => (count + state), 0);
  console.log(`Answer 1: ${answerTwo}`);
}

// const print = (grid: Grid) => {
//   console.log(
//     grid
//       .map((line) =>
//         line.map((state) => state ? "#" : ".")
//           .join("")
//       ).join("\n") + "\n",
//   );
// };
