#!/usr/bin/env -S deno run --allow-read

const inputText = await Deno.readTextFile(
  new URL("input.txt", import.meta.url),
);

enum Node {
  Clean = ".",
  Infected = "#",
  Weakened = "W",
  Flagged = "F",
}

enum Direction {
  Up = 0,
  Left = 1,
  Down = 2,
  Right = 3,
}

type XY = { x: number; y: number };

const grid = inputText.trim().split("\n");
const state = new Map<string, { n: Node; x: number; y: number }>();
const virus: XY & { d: Direction } = { x: 0, y: 0, d: 0 };

const reset = () => {
  state.clear();
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[y].length; x++) {
      state.set(`${x},${y}`, { x, y, n: grid[y][x] as Node });
    }
  }
  virus.x = Math.floor(grid.length / 2);
  virus.y = Math.floor(grid[0].length / 2);
  virus.d = Direction.Up;
};

{
  reset();
  let infected = 0;
  for (let i = 0; i < 10_000; i++) {
    const key = `${virus.x},${virus.y}`;
    const node = state.get(key) ?? { x: virus.x, y: virus.y, n: Node.Clean };
    virus.d += node.n === Node.Clean ? 1 : -1;
    node.n = node.n === Node.Clean ? Node.Infected : Node.Clean;
    if (virus.d >= 4) virus.d = 0;
    if (virus.d < 0) virus.d = 3;
    state.set(key, node);
    if (virus.d === Direction.Up) virus.y--;
    else if (virus.d === Direction.Left) virus.x--;
    else if (virus.d === Direction.Down) virus.y++;
    else if (virus.d === Direction.Right) virus.x++;
    if (node.n === Node.Infected) infected++;
  }
  console.log(`Answer 1: ${infected}`);
}

{
  reset();
  let infected = 0;
  for (let i = 0; i < 10_000_000; i++) {
    const key = `${virus.x},${virus.y}`;
    const node = state.get(key) ?? { x: virus.x, y: virus.y, n: Node.Clean };
    switch (node.n) {
      case Node.Clean:
        node.n = Node.Weakened;
        virus.d++;
        break;
      case Node.Weakened:
        node.n = Node.Infected;
        break;
      case Node.Infected:
        node.n = Node.Flagged;
        virus.d--;
        break;
      case Node.Flagged:
        node.n = Node.Clean;
        virus.d = (virus.d + 2) % 4;
        break;
    }
    if (virus.d >= 4) virus.d = 0;
    if (virus.d < 0) virus.d = 3;
    state.set(key, node);
    if (virus.d === Direction.Up) virus.y--;
    else if (virus.d === Direction.Left) virus.x--;
    else if (virus.d === Direction.Down) virus.y++;
    else if (virus.d === Direction.Right) virus.x++;
    if (node.n === Node.Infected) infected++;
  }
  console.log(`Answer 2: ${infected}`);
}

// const frame = () => {
//   let min = { x: virus.x, y: virus.y };
//   let max = { x: virus.x, y: virus.y };
//   for (const key of state.keys()) {
//     const [x, y] = key.split(",").map(Number);
//     min = { x: Math.min(x, min.x), y: Math.min(y, min.y) };
//     max = { x: Math.max(x, max.x), y: Math.max(y, max.y) };
//   }
//   const normalize = (x: number, y: number) => ({
//     x: x - min.x,
//     y: y - min.y,
//   });
//   const height = (max.y - min.y) + 1;
//   const width = (max.x - min.x) + 1;
//   const grid = Array.from({ length: height }, () => new Array(width).fill("."));
//   for (const node of state.values()) {
//     const { x, y } = normalize(node.x, node.y);
//     grid[y][x] = node.n;
//   }
//   const { x, y } = normalize(virus.x, virus.y);
//   grid[y][x] = virus.d;
//   console.clear();
//   console.log(grid.map((layer) => layer.join(" ")).join("\n"));
//   console.log(virus);
// };
