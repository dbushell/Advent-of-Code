#!/usr/bin/env -S deno run --allow-read

import { assert } from "jsr:@std/assert/assert";

const inputText = await Deno.readTextFile(
  new URL("input.txt", import.meta.url),
);

type State = {
  patterns: Set<string>;
  designs: Array<string>;
};

// Parse input
const parse = (input: string, state?: State): State => {
  state ??= {} as State;
  const lines = input.split("\n");
  state.patterns = new Set(lines.shift()?.split(",")?.map((s) => s.trim()));
  assert(state.patterns.size, "No patterns parsed");
  state.designs = lines.filter((line) => /^[wubrg]+$/.test(line));
  assert(state.designs.length, "No designs parsed");
  return state;
};

{
  const state = parse(inputText);

  // Track bad sub-patterns
  const impossible = new Set<string>();

  // Match sub-pattern
  const match = (design: string): boolean => {
    if (state.patterns.has(design)) return true;
    if (impossible.has(design)) return false;
    if (design.length === 1) {
      impossible.add(design);
      return false;
    }
    for (let i = 1; i < design.length; i++) {
      const prefix = design.substring(0, i);
      if (!match(prefix)) continue;
      if (match(design.substring(i))) return true;
    }
    impossible.add(design);
    return false;
  };

  // Match designs
  const matches = new Map<string, boolean>();
  for (const design of state.designs) {
    matches.set(design, match(design));
  }

  // Part 1
  const answerOne = matches.values().toArray().filter((v) => v).length;
  console.log(`Patterns: ${state.patterns.size}`);
  console.log(`Designs: ${state.designs.length}`);
  console.log(`Answer 1: ${answerOne}`);
}
