#!/usr/bin/env -S deno run --allow-read

import { assert } from "jsr:@std/assert/assert";

const inputText = await Deno.readTextFile(
  new URL("input.txt", import.meta.url),
);

type XYZ = { x: number; y: number; z: number };

type Moon = { name: string; position: XYZ; velocity: XYZ };

const moonArray: Array<Moon> = [];

// Parse input
const names = ["Io", "Europa", "Ganymede", "Callisto"];
for (const line of inputText.split("\n")) {
  const match = line.match(/^<x=(-?\d+), y=(-?\d+), z=(-?\d+)>$/);
  if (!match) continue;
  const [x, y, z] = match.slice(1, 4).map(Number);
  assert(Number.isInteger(x), "Bad X input");
  assert(Number.isInteger(y), "Bad Y input");
  assert(Number.isInteger(z), "Bad Z input");
  moonArray.push({
    name: names[moonArray.length],
    position: { x, y, z },
    velocity: { x: 0, y: 0, z: 0 },
  });
}
assert(moonArray.length === 4, "Wrong number of moons!");

const pairSet: Set<string> = new Set();
for (let i = 0; i < moonArray.length; i++) {
  for (let j = i + 1; j < moonArray.length; j++) {
    pairSet.add(
      [moonArray[i].name, moonArray[j].name]
        .sort((a, b) => a.localeCompare(b))
        .join(","),
    );
  }
}

const moonPairs = Array.from(pairSet).map((p) =>
  p.split(",").map((name) => moonArray.find((moon) => moon.name === name)!)
);

const moonDefaults = moonArray.map((moon) => structuredClone<Moon>(moon));
const resetMoons = () => {
  moonArray.forEach((_, i) => {
    moonArray[i].position = { ...moonDefaults[i].position };
    moonArray[i].velocity = { ...moonDefaults[i].velocity };
  });
};

const step = () => {
  for (const [m1, m2] of moonPairs) {
    for (const prop of ["x", "y", "z"] as Array<keyof XYZ>) {
      if (m1.position[prop] < m2.position[prop]) {
        m1.velocity[prop]++;
        m2.velocity[prop]--;
      }
      if (m2.position[prop] < m1.position[prop]) {
        m2.velocity[prop]++;
        m1.velocity[prop]--;
      }
    }
  }
  for (const moon of moonArray) {
    moon.position.x += moon.velocity.x;
    moon.position.y += moon.velocity.y;
    moon.position.z += moon.velocity.z;
  }
};

const potential = (moon: Moon): number => {
  const { x, y, z } = moon.position;
  return Math.abs(x) + Math.abs(y) + Math.abs(z);
};

const kinetic = (moon: Moon): number => {
  const { x, y, z } = moon.velocity;
  return Math.abs(x) + Math.abs(y) + Math.abs(z);
};

const energy = (): number => {
  let energy = 0;
  for (const moon of moonArray) {
    energy += potential(moon) * kinetic(moon);
  }
  return energy;
};

resetMoons();
for (let i = 0; i < 1000; i++) step();
const answerOne = energy();
console.log(`Answer 1: ${answerOne}`);

/*************
 * PART TWO! *
 *************/

const key = (prop: keyof XYZ) =>
  moonArray.map((moon) => (
    moon.position[prop] + "," + moon.velocity[prop]
  )).join(",");

resetMoons();
const startX = key("x");
const startY = key("y");
const startZ = key("z");

let xnum = 0;
let ynum = 0;
let znum = 0;

resetMoons();
while (++xnum) {
  step();
  if (key("x") === startX) break;
}

resetMoons();
while (++ynum) {
  step();
  if (key("y") === startY) break;
}

resetMoons();
while (++znum) {
  step();
  if (key("z") === startZ) break;
}

const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));

const lcm = (a: number, b: number): number => (a * b) / gcd(a, b);

let multiple = 1;
[xnum, ynum, znum].forEach((n) => multiple = lcm(multiple, n));

const answerTwo = multiple;
console.log(`Answer 2: ${answerTwo}`);
