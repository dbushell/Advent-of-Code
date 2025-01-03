#!/usr/bin/env -S deno run --allow-read

import { Color, color } from "../debug.ts";

const inputText = await Deno.readTextFile(
  new URL("input.txt", import.meta.url),
);

type Operation = {
  type: "rect" | "row" | "column";
  a: number;
  b: number;
};

const operations: Array<Operation> = [];
for (const line of inputText.split("\n")) {
  const match = line.match(/\w*?(rect|row|column).+?(\d+).+?(\d+)$/);
  if (!match) continue;
  operations.push({
    type: match[1] as Operation["type"],
    a: Number.parseInt(match[2]),
    b: Number.parseInt(match[3]),
  });
}

const screen: Array<Array<string>> = Array.from(
  { length: 6 },
  () => new Array(50).fill("."),
);

const rect = (width: number, height: number): void => {
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      screen[y][x] = "#";
    }
  }
};

// Rotate row right to left
const row = (y: number, times: number): void => {
  while (times--) screen[y].unshift(screen[y].pop()!);
};

// Rotate column bottom to top
const column = (x: number, times: number): void => {
  const column = screen.map((row) => row[x]);
  while (times--) column.unshift(column.pop()!);
  column.forEach((c, i) => screen[i][x] = c);
};

// Apply operations in order
for (const { type, a, b } of operations) {
  if (type === "rect") rect(a, b);
  else if (type === "row") row(a, b);
  else if (type === "column") column(a, b);
}

const answerOne = screen.flat().filter((c) => c === "#").length;
console.log(`Answer 1: ${answerOne}`);
console.log(`Answer 2:`);
let out = screen.map((layer) => layer.join(" ")).join("\n");
out = out.replaceAll(".", color(".", Color.Dim));
out = out.replaceAll("#", color("■", Color.Green));
console.log(out);
