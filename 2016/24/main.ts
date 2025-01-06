#!/usr/bin/env -S deno run --allow-read

import { adjacentXY, getXY, isXY, keyXY, sortXY } from "../helpers.ts";

const inputText = await Deno.readTextFile(
  new URL("input.txt", import.meta.url),
);

type XY = { x: number; y: number };

const robot: XY = { x: 0, y: 0 };
const targets: Array<XY> = [];
const blocked = new Map<string, XY>();
const paths = new Map<string, Array<XY>>();
const multiverse: Array<{ route: Array<XY>; distance: number }> = [];

const maze: Array<Array<string>> = inputText.trim().split("\n")
  .map((line) => line.split(""));

for (let y = 0; y < maze.length; y++) {
  for (let x = 0; x < maze[y].length; x++) {
    if (getXY(maze, { x, y }) === "#") {
      blocked.set(keyXY({ x, y }), { x, y });
    } else if (getXY(maze, { x, y }) === "0") {
      [robot.x, robot.y] = [x, y];
    } else {
      if (/\d+/.test(getXY(maze, { x, y }) as string)) {
        targets.push({ x, y });
      }
    }
  }
}

const keyPair = (a: XY, b: XY): string =>
  [a, b].sort(sortXY).map(keyXY).join("-");

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
      const neighbour = { x, y };
      const key = keyXY(neighbour);
      if (!isXY(maze, neighbour)) continue;
      if (blocked.has(key)) continue;
      if (visited.has(key)) continue;
      if (allowed && !allowed.has(key)) continue;
      visited.set(key, current);
      queue.push(neighbour);
    }
  }
  return [];
};

for (const t1 of targets) {
  const p1 = findXY(blocked, robot, t1);
  paths.set(keyPair(robot, t1), p1);
  for (const t2 of targets) {
    if (t1 === t2) continue;
    const key = keyPair(t1, t2);
    if (!paths.has(key)) {
      paths.set(key, findXY(blocked, t1, t2));
    }
  }
}

const diverge = (route: Array<XY>, next: Array<XY>, home?: boolean) => {
  if (next.length === 0) {
    if (home) route.push(robot);
    let distance = 0;
    for (let i = 1; i < route.length; i++) {
      const key = keyPair(...route.slice(i - 1, i + 1) as [XY, XY]);
      distance += paths.get(key)!.length - 1;
    }
    multiverse.push({ route, distance });
    return;
  }
  for (const n1 of next) {
    diverge([...route, n1], next.filter((n2) => n2 !== n1), home);
  }
};

for (const t1 of targets) {
  diverge([robot, t1], targets.filter((t2) => t2 !== t1));
}
multiverse.sort((a, b) => (a.distance - b.distance));
console.log(`Answer 1: ${multiverse.at(0)!.distance}`);

multiverse.length = 0;
for (const t1 of targets) {
  diverge([robot, t1], targets.filter((t2) => t2 !== t1), true);
}
multiverse.sort((a, b) => (a.distance - b.distance));
console.log(`Answer 2: ${multiverse.at(0)!.distance}`);
