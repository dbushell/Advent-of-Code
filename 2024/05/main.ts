#!/usr/bin/env -S deno run --allow-read

import { assert } from "jsr:@std/assert/assert";

const inputText = await Deno.readTextFile(
  new URL("input.txt", import.meta.url),
);

const rulesRaw = new Set<string>();
const rules: Array<[number, number]> = [];
const updates: Array<Array<number>> = [];

// Parse input
for (const line of inputText.split("\n")) {
  // Parse rule line
  const ruleParts = line.match(/^((\d+)\|(\d+))\s?$/);
  if (ruleParts) {
    assert(!rulesRaw.has(ruleParts[1]), "Rule is not unique");
    rulesRaw.add(ruleParts[1]);
    rules.push([Number.parseInt(ruleParts[2]), Number.parseInt(ruleParts[3])]);
    continue;
  }
  // Parse update line
  const updateStr = line.match(/^\d+(?:,\d+)*\s?$/);
  if (updateStr) {
    const update = line.split(",").map((str) => Number.parseInt(str.trim()));
    assert(update.length > 1, "Update not multiple pages");
    assert(update.length % 2 === 1, "Update not odd number of pages");
    updates.push(update);
  }
}

// Returns true if update pages match all rules
const isOrdered = (update: Array<number>): boolean => {
  for (
    const [x, y] of rules.filter(([x, y]) =>
      update.includes(x) && update.includes(y)
    )
  ) {
    if (update.indexOf(x) > update.indexOf(y)) {
      return false;
    }
  }
  return true;
};

let answerOne = 0;
let answerTwo = 0;

for (const update of updates) {
  if (isOrdered(update)) {
    answerOne += update[(update.length - 1) / 2];
  } else {
    const sorted = update.toSorted((a, b) => isOrdered([a, b]) ? -1 : 1);
    answerTwo += sorted[(sorted.length - 1) / 2];
  }
}

console.log(`Total rules: ${rules.length}`);
console.log(`Total updates: ${updates.length}`);

console.log(`Answer 1: ${answerOne}`);
console.log(`Answer 2: ${answerTwo}`);
