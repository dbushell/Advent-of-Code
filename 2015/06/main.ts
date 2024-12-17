#!/usr/bin/env -S deno run --allow-read

const inputText = await Deno.readTextFile(
  new URL("input.txt", import.meta.url),
);

type XY = {
  x: number;
  y: number;
};

{
  const grid: Array<Array<number>> = Array.from(
    { length: 1000 },
    () => new Array(1000).fill(0),
  );

  const lights = (action: string, start: XY, end: XY) => {
    for (let y = start.y; y <= end.y; y++) {
      for (let x = start.x; x <= end.x; x++) {
        switch (action) {
          case "turn on":
            grid[y][x] = 1;
            break;
          case "turn off":
            grid[y][x] = 0;
            break;
          case "toggle":
            grid[y][x] = +!grid[y][x];
            break;
        }
      }
    }
  };

  for (const line of inputText.trim().split("\n")) {
    const match = line.match(/^([\w\s]+?)\s+(\d+),(\d+)\s+\w+\s+(\d+),(\d+)$/);
    if (!match) continue;
    const [, action, sx, sy, ex, ey] = match;
    const start = {
      x: Number.parseInt(sx),
      y: Number.parseInt(sy),
    };
    const end = {
      x: Number.parseInt(ex),
      y: Number.parseInt(ey),
    };
    lights(action, start, end);
  }

  const answerOne = grid.flat().reduce((a, b) => (a + b), 0);
  console.log(`Answer 1: ${answerOne}`);
}

{
  const grid: Array<Array<number>> = Array.from(
    { length: 1000 },
    () => new Array(1000).fill(0),
  );

  const lights = (action: string, start: XY, end: XY) => {
    for (let y = start.y; y <= end.y; y++) {
      for (let x = start.x; x <= end.x; x++) {
        switch (action) {
          case "turn on":
            grid[y][x] += 1;
            break;
          case "turn off":
            grid[y][x] = Math.max(0, grid[y][x] - 1);
            break;
          case "toggle":
            grid[y][x] += 2;
            break;
        }
      }
    }
  };

  for (const line of inputText.trim().split("\n")) {
    const match = line.match(/^([\w\s]+?)\s+(\d+),(\d+)\s+\w+\s+(\d+),(\d+)$/);
    if (!match) continue;
    const [, action, sx, sy, ex, ey] = match;
    const start = {
      x: Number.parseInt(sx),
      y: Number.parseInt(sy),
    };
    const end = {
      x: Number.parseInt(ex),
      y: Number.parseInt(ey),
    };
    lights(action, start, end);
  }

  const answerTwo = grid.flat().reduce((a, b) => (a + b), 0);
  console.log(`Answer 2: ${answerTwo}`);
}
