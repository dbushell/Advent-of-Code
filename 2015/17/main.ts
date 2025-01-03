#!/usr/bin/env -S deno run --allow-read

import { assert } from "jsr:@std/assert/assert";

const inputText = await Deno.readTextFile(
  new URL("input.txt", import.meta.url),
);

// Parse input
const containers: Array<number> = inputText
  .split("\n")
  .filter((line) => /\d/.test(line))
  .map(Number);
assert(containers.length === 20);

// Add prefix digits to allow duplicate numbers
const numbers = containers.map((c, i) => c += 100_000 + ((i + 1) * 1000));

const group = (
  numbers: Array<number>,
  groups: Array<Array<number>> = [],
  seen = new Set<string>(),
): number[][] => {
  if (numbers.length === 0) return [];
  const key = numbers.sort((a, b) => (a - b)).join(",");
  if (seen.has(key)) return [];
  seen.add(key);
  // Minimum total
  const sum = numbers.reduce((sum, num) => {
    // Remove dedupe prefix
    return (sum + Number(num.toString().slice(3)));
  }, 0);
  if (sum < 150) return [];
  // Maximum total
  if (sum <= 150) groups.push(numbers);
  // Reduce sub-groups
  for (let i = 0; i < numbers.length; i++) {
    const newNumbers = numbers.slice(0, i).concat(numbers.slice(i + 1));
    group(newNumbers, groups, seen);
  }
  return groups;
};

const groups = group(numbers);
const answerOne = groups.length;
console.log(`Answer 1: ${answerOne}`);

// Count all smallest groups
groups.sort((a, b) => b.length - a.length);
const answerTwo =
  groups.filter((g) => g.length === groups.at(-1)!.length).length;

console.log(`Answer 2: ${answerTwo}`);
