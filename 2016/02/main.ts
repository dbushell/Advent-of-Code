#!/usr/bin/env -S deno run --allow-read

const inputText = await Deno.readTextFile(
  new URL("input.txt", import.meta.url),
);

type XY = [number, number];

const directions = inputText.trim().split("\n");

const codes: Array<string> = [];
let [x, y]: XY = [1, 1];

const xy = ([x, y]: XY, max: number, char: string): XY => {
  switch (char) {
    case "U":
      y = Math.max(y - 1, 0);
      break;
    case "D":
      y = Math.min(y + 1, max);
      break;
    case "L":
      x = Math.max(x - 1, 0);
      break;
    case "R":
      x = Math.min(x + 1, max);
      break;
  }
  return [x, y];
};

for (const [...sequence] of directions) {
  while (sequence.length) [x, y] = xy([x, y], 2, sequence.shift()!);
  codes.push(String((y * 3 + x) + 1));
}

console.log(`Answer 1: ${codes.join("")}`);

const keypad = [
  [" ", " ", "1", " ", " "],
  [" ", "2", "3", "4", " "],
  ["5", "6", "7", "8", "9"],
  [" ", "A", "B", "C", " "],
  [" ", " ", "D", " ", " "],
];

codes.length = 0;
[x, y] = [0, 2];

for (const [...sequence] of directions) {
  let [bx, by] = [x, y];
  while (sequence.length) {
    [bx, by] = xy([x, y], 4, sequence.shift()!);
    x = (keypad[by][bx] === " ") ? x : bx;
    y = (keypad[by][bx] === " ") ? y : by;
  }
  codes.push(keypad[y][x]);
}

console.log(`Answer 2: ${codes.join("")}`);
