#!/usr/bin/env -S deno run --allow-read

import { assert } from "jsr:@std/assert/assert";

const inputText = await Deno.readTextFile(
  new URL("input.txt", import.meta.url),
);

enum Tech {
  Cut = "Cut",
  Deal = "Deal",
  Stack = "Stack",
}

const techniques: Array<{ tech: Tech; number: number }> = [];

for (const line of inputText.trim().split("\n")) {
  const cut = line.match(/^cut (-?\d+)/);
  const deal = line.match(/^deal with increment (\d+)$/);
  const stack = line.includes("new stack");
  if (cut) {
    techniques.push({ tech: Tech.Cut, number: Number.parseInt(cut[1]) });
  } else if (deal) {
    techniques.push({ tech: Tech.Deal, number: Number.parseInt(deal[1]) });
  } else if (stack) {
    techniques.push({ tech: Tech.Stack, number: 0 });
  } else assert(false, "Bad input");
}
assert(techniques.length === 100, "Not enough techniques");

const deck = Array.from({ length: 10007 }, (_, i) => i);

for (const { tech, number } of techniques) {
  switch (tech) {
    case Tech.Cut: {
      deck.splice(
        0,
        deck.length,
        ...deck.slice(number),
        ...deck.slice(0, number),
      );
      break;
    }
    case Tech.Deal: {
      let i = 0;
      for (const card of [...deck]) {
        deck[i] = card;
        if ((i += number) >= deck.length) i -= deck.length;
      }
      break;
    }
    case Tech.Stack: {
      deck.reverse();
      break;
    }
  }
}

const check = new Set<number>(deck);
assert(check.size === deck.length, "Bad shuffle");

const answerOne = deck.indexOf(2019);
console.log(`Answer 1: ${answerOne}`);
