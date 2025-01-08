#!/usr/bin/env -S deno run --allow-read

const inputText = (await Deno.readTextFile(
  new URL("input.txt", import.meta.url),
)).trim();

type XY = [number, number];

type Grid = Array<Array<number>>;

enum Direction {
  Up = 0,
  Left = 1,
  Down = 2,
  Right = 3,
}

const distance = ([ax, ay]: XY, [bx, by]: XY) =>
  Math.abs(ax - bx) + Math.abs(ay - by);

const normalize = (grid: Grid, [x, y]: XY) => [
  x + Math.floor(grid[0].length / 2),
  y + Math.floor(grid.length / 2),
];

const grid: Grid = Array.from({ length: 10 }, () => Array(10));
grid.map((layer) => layer.fill(0));
const [x, y] = normalize(grid, [0, 0]);
grid[y][x] = 1;

let xy: XY = [1, 0];
let direction = Direction.Up;

let answerOne = 0;
let answerTwo = 0;

for (let i = 2, j = 0, turn = 1, step = 1; i < 320_000; i++, j++) {
  if (i > 2) {
    switch (direction) {
      case Direction.Up:
        xy = [xy[0], xy[1] - 1];
        break;
      case Direction.Left:
        xy = [xy[0] - 1, xy[1]];
        break;
      case Direction.Down:
        xy = [xy[0], xy[1] + 1];
        break;
      case Direction.Right:
        xy = [xy[0] + 1, xy[1]];
        break;
    }
  }
  if (i === Number(inputText)) {
    answerOne = distance([0, 0], xy);
  }
  if (answerTwo === 0) {
    const [x, y] = normalize(grid, xy);
    [
      [x - 1, y - 1],
      [x, y - 1],
      [x + 1, y - 1],
      [x - 1, y],
      [x + 1, y],
      [x - 1, y + 1],
      [x, y + 1],
      [x + 1, y + 1],
    ].forEach(([x2, y2]) => {
      if (!grid[y2] || !grid[y2][x2]) return;
      grid[y][x] += grid[y2][x2];
    });

    if (grid[y][x] > Number(inputText)) {
      answerTwo = grid[y][x];
    }
  }
  if (answerOne && answerTwo) {
    break;
  }
  if (j === turn) {
    j = 0;
    direction = (direction + 1) % 4;
  }
  if (step++ === (turn * 2)) {
    step = 1;
    turn++;
  }
}

console.log(`Answer 1: ${answerOne}`);
console.log(`Answer 2: ${answerTwo}`);
