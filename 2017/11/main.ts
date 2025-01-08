#!/usr/bin/env -S deno run --allow-read

const inputText = await Deno.readTextFile(
  new URL("input.txt", import.meta.url),
);

type XYZ = { x: number; y: number; z: number };

enum Hex {
  Start = "",
  N = "n",
  NE = "ne",
  NW = "nw",
  SE = "se",
  S = "s",
  SW = "sw",
}

const input = inputText.trim().split(",") as Array<Hex>;
const xyz: XYZ = { x: 0, y: 0, z: 0 };
let furthest = 0;
let distance = 0;

for (const direction of input) {
  switch (direction) {
    case Hex.N:
      xyz.y++;
      xyz.z--;
      break;
    case Hex.NE:
      xyz.x++;
      xyz.z--;
      break;
    case Hex.NW:
      xyz.x--;
      xyz.y++;
      break;
    case Hex.S:
      xyz.y--;
      xyz.z++;
      break;
    case Hex.SE:
      xyz.x++;
      xyz.y--;
      break;
    case Hex.SW:
      xyz.x--;
      xyz.z++;
      break;
  }
  distance = Math.max(Math.abs(xyz.x), Math.abs(xyz.y), Math.abs(xyz.z));
  furthest = Math.max(furthest, distance);
}

console.log(`Answer 1: ${distance}`);
console.log(`Answer 2: ${furthest}`);
