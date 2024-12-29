#!/usr/bin/env -S deno run --allow-read

import { assert } from "jsr:@std/assert/assert";

const inputText = await Deno.readTextFile(
  new URL("input.txt", import.meta.url),
);

enum Cell {
  Empty = ".",
  Asteroid = "#",
}

type XY = { x: number; y: number };

type Grid = Array<Array<Cell>>;

type Asteroid = {
  xy: XY;
  inView: Asteroids;
  blockedView: Asteroids;
  distance: number;
  angle: number;
};

type Asteroids = Array<Asteroid>;

const grid: Grid = [];
for (const line of inputText.trim().split("\n")) {
  grid.push(line.split("") as Array<Cell>);
}

const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));

const distance = ({ x: ax, y: ay }: XY, { x: bx, y: by }: XY) =>
  Math.abs(ax - bx) + Math.abs(ay - by);

const angle = ({ x: ax, y: ay }: XY, { x: bx, y: by }: XY) => {
  const rad = Math.atan2(by - ay, bx - ax);
  return (rad * (180 / Math.PI)) + 90;
};

const keyXY = ({ x, y }: XY) => (`${x}-${y}`);

const isXY = (grid: Grid, { x, y }: XY): boolean => {
  if (x < 0 || y < 0) return false;
  if (y >= grid.length) return false;
  if (x >= grid[y].length) return false;
  return true;
};

const getXY = (grid: Grid, { x, y }: XY): Cell => {
  assert(isXY(grid, { x, y }), "getXY out of bounds");
  return grid[y][x];
};

const reduceXY = ({ x, y }: XY): XY => {
  const divide = gcd(Math.abs(x), Math.abs(y));
  x /= divide;
  y /= divide;
  return { x, y };
};

const vectorXY = (a: XY, b: XY) => reduceXY({ x: b.x - a.x, y: b.y - a.y });

// Parse input grid
const asteroidMap = new Map<string, Asteroid>();
for (let y = 0; y < grid.length; y++) {
  for (let x = 0; x < grid[y].length; x++) {
    if (getXY(grid, { x, y }) === Cell.Asteroid) {
      asteroidMap.set(keyXY({ x, y }), {
        xy: { x, y },
        inView: [],
        blockedView: [],
        distance: 0,
        angle: 0,
      });
    }
  }
}

// Find lines of sight
asteroidMap.forEach((a1) => {
  for (const [, a2] of asteroidMap) {
    if (a1 === a2) continue;
    if (a1.inView.includes(a2)) continue;
    if (a1.blockedView.includes(a2)) continue;
    const xy = { ...a1.xy };
    const vector = vectorXY(a1.xy, a2.xy);
    let lineOfSight = true;
    while (isXY(grid, xy)) {
      const candidate = asteroidMap.get(keyXY(xy));
      xy.x += vector.x;
      xy.y += vector.y;
      if (!candidate) continue;
      if (candidate === a1) continue;
      if (a1.inView.includes(candidate)) {
        lineOfSight = false;
        continue;
      }
      if (a1.blockedView.includes(candidate)) {
        lineOfSight = false;
        continue;
      }
      if (lineOfSight) {
        a1.inView.push(candidate);
        if (!candidate.inView.includes(a1)) {
          candidate.inView.push(a1);
        }
      } else {
        a1.blockedView.push(candidate);
        if (!candidate.blockedView.includes(a1)) {
          candidate.blockedView.push(a1);
        }
      }
      lineOfSight = false;
    }
  }
});

// Find base station with best line of sight
const asteroids = Array.from(asteroidMap.values());
asteroids.sort((a, b) => a.inView.length - b.inView.length);
const station = asteroids.at(-1)!;
const answerOne = station.inView.length;
console.log(`Answer 1: ${answerOne}`);

/*************
 * PART TWO! *
 *************/

// Remove base station
asteroids.splice(asteroids.indexOf(station));

// Add angles from base station
asteroidMap.forEach((asteroid) => {
  asteroid.angle = angle(station.xy, asteroid.xy);
  asteroid.distance = distance(station.xy, asteroid.xy);
  if (asteroid.angle < 0) asteroid.angle += 360;
});

// Sort by angle and distance
asteroids.sort((a, b) => {
  if (a.angle !== b.angle) return a.angle - b.angle;
  return a.distance - b.distance;
});

const vaporized: Asteroids = [];
let rotation: Asteroids = [];
for (let i = 0; vaporized.length < asteroids.length; i++) {
  if (i >= asteroids.length) {
    i = 0;
    rotation = [];
  }
  const target = asteroids[i];
  if (vaporized.includes(target)) continue;
  if (rotation.length) {
    const v1 = vectorXY(station.xy, target.xy);
    const v2 = vectorXY(station.xy, vaporized.at(-1)!.xy);
    if (v1.x === v2.x && v1.y === v2.y) continue;
  }
  vaporized.push(target);
  rotation.push(target);
}

const target = vaporized.at(199)!.xy;
const answerTwo = target.x * 100 + target.y;
console.log(`Answer 2: ${answerTwo}`);
