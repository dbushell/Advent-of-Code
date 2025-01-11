#!/usr/bin/env -S deno run --allow-read

import { getXY, isXY, sameXY } from "../../2016/helpers.ts";

const inputText = await Deno.readTextFile(
  new URL("input.txt", import.meta.url),
);

enum Direction {
  North = "N",
  South = "S",
  East = "E",
  West = "W",
}

type XY = { x: number; y: number };

const grid: Array<Array<string>> = [];
for (const line of inputText.split("\n")) {
  grid[grid.length] = line.split("");
}

// Grid positions
const sp = ({ x, y }: XY): XY => ({ x, y: y + 1 });
const np = ({ x, y }: XY): XY => ({ x, y: y - 1 });
const ep = ({ x, y }: XY): XY => ({ x: x + 1, y });
const wp = ({ x, y }: XY): XY => ({ x: x - 1, y });

// Grid characters
const sc = (xy: XY) => isXY(grid, sp(xy)) ? getXY(grid, sp(xy)) : " ";
const nc = (xy: XY) => isXY(grid, np(xy)) ? getXY(grid, np(xy)) : " ";
const ec = (xy: XY) => isXY(grid, ep(xy)) ? getXY(grid, ep(xy)) : " ";
const wc = (xy: XY) => isXY(grid, wp(xy)) ? getXY(grid, wp(xy)) : " ";

const start: XY = { x: grid[0].indexOf("|"), y: 0 };
let dir = Direction.South as Direction;
let now = { ...start };
let letters = "";
let steps = 0;

// Move up/down
const vertical = () => {
  if (nc(now) !== " ") {
    dir = Direction.North;
    now = np(now);
  } else if (sc(now) !== " ") {
    dir = Direction.South;
    now = sp(now);
  }
};

// Move left/right
const horizontal = () => {
  if (ec(now) !== " ") {
    dir = Direction.East;
    now = ep(now);
  } else if (wc(now) !== " ") {
    dir = Direction.West;
    now = wp(now);
  }
};

while (true) {
  steps++;
  const previous = { ...now };
  if (dir === Direction.North) {
    if (nc(now) !== " ") now = np(now);
    else horizontal();
  } else if (dir === Direction.South) {
    if (sc(now) !== " ") now = sp(now);
    else horizontal();
  } else if (dir === Direction.East) {
    if (ec(now) !== " ") now = ep(now);
    else vertical();
  } else if (dir === Direction.West) {
    if (wc(now) !== " ") now = wp(now);
    else vertical();
  }
  if (sameXY(now, previous)) break;
  const char = getXY(grid, now) as string;
  if (/[A-Z]/.test(char)) letters += char;
}

console.log(`Answer 1: ${letters}`);
console.log(`Answer 2: ${steps}`);
