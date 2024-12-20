#!/usr/bin/env -S deno run --allow-read

import { assert } from "jsr:@std/assert/assert";

const inputText = await Deno.readTextFile(
  new URL("input.txt", import.meta.url),
);

type Aunt = {
  number: number;
  children?: number;
  cats?: number;
  samoyeds?: number;
  pomeranians?: number;
  akitas?: number;
  vizslas?: number;
  goldfish?: number;
  trees?: number;
  cars?: number;
  perfumes?: number;
};

const allAunts: Array<Aunt> = [];

for (const line of inputText.split("\n")) {
  const match = line.match(/^Sue (\d+):(.+?)$/);
  if (!match) continue;
  const [, number, props] = match;
  const sue: Aunt = { number: Number.parseInt(number) };
  for (const prop of props.matchAll(/(\w+): (\d+)/g)) {
    sue[prop[1] as keyof Aunt] = Number.parseInt(prop[2]);
  }
  allAunts.push(sue);
}

const target = {
  children: 3,
  cats: 7,
  samoyeds: 2,
  pomeranians: 3,
  akitas: 0,
  vizslas: 0,
  goldfish: 5,
  trees: 3,
  cars: 2,
  perfumes: 1,
};

// Part 1
const matchAunts = allAunts.filter((sue) => {
  for (const [k, v] of Object.entries(sue)) {
    if (k === "number") continue;
    if (target[k as keyof typeof target] !== v) return false;
  }
  return true;
});
assert(matchAunts.length, "Failed to find Sue!");
const answerOne = matchAunts[0].number;
console.log(`Answer 1: ${answerOne}`);
