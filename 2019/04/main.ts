#!/usr/bin/env -S deno run --allow-read

import { assert } from "jsr:@std/assert/assert";

const inputText = (await Deno.readTextFile(
  new URL("input.txt", import.meta.url),
)).trim();

const [lower, upper] = inputText.match(/(\d+)-(\d+)/)!.slice(1, 3).map(Number);
assert(Number.isInteger(lower), "Failed to parse lower range");
assert(Number.isInteger(upper), "Failed to parse upper range");

let answerOne = 0;
let answerTwo = 0;

for (let i = lower; i < upper; i++) {
  const number = String(i);
  // Skip if any digit decreases
  const digits = number.split("").map(Number);
  if (digits.some((n, i) => n < (digits[i - 1] ?? 0))) continue;
  // Find 2+ repeating digits
  const doubles = new Set([
    ...number.matchAll(/([0-9])\1/g).map((m) => m[1]),
  ]);
  if (!doubles.size) continue;
  answerOne++;
  // Find 3+ repeating digits
  const triples = new Set([
    ...number.matchAll(/([0-9])\1\1/g).map((m) => m[1]),
  ]);
  // Require alternate repeat number
  if (doubles.difference(triples).size) {
    answerTwo++;
  }
}

console.log(`Answer 1: ${answerOne}`);
console.log(`Answer 2: ${answerTwo}`);
