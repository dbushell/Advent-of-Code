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

  const matches = new Map<string, boolean>();
  for (const design of state.designs) {
    matches.set(design, match(design));
  }

  console.log(`Patterns: ${state.patterns.size}`);
  console.log(`Designs: ${state.designs.length}`);

  const answerOne = matches.values().toArray().filter((v) => v).length;
  console.log(`\nAnswer 1: ${answerOne}\n`);
}

{
  const state = parse(inputText);
  const cache = new Map<string, number>();

  const match = (
    design: string,
    part: string,
    parts: Array<string> = [],
  ): number => {
    let count = 0;
    if (state.patterns.has(part)) {
      if ([part, ...parts].join("") === design) count++;
    }
    // Work backwards
    for (let i = part.length - 1; i > 0; i--) {
      const end = part.substring(i);
      if (!state.patterns.has(end)) {
        continue;
      }
      const start = part.substring(0, i);
      if (cache.has(start)) {
        count += cache.get(start)!;
        continue;
      }
      const subCount = match(design, start, [end, ...parts]);
      cache.set(start, subCount);
      count += subCount;
    }
    return count;
  };

  let answerTwo = 0;
  for (const design of state.designs) {
    answerTwo += match(design, design);
  }
  console.log(`Answer 2: ${answerTwo}\n`);
}
