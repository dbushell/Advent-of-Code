#!/usr/bin/env -S deno run --allow-read

import { assert } from "jsr:@std/assert/assert";

const inputText = await Deno.readTextFile(
  new URL("input.txt", import.meta.url),
);

type Lockey = {
  type: "key" | "lock";
  pips: [number, number, number, number, number];
  number: number;
};

type State = {
  key: Array<Lockey>;
  lock: Array<Lockey>;
  map: Map<string, Lockey>;
};

const parse = (input = inputText, state?: State): State => {
  state ??= { key: [], lock: [], map: new Map() };
  const newLockey = (): Lockey => ({
    pips: [0, 0, 0, 0, 0],
    number: 0,
    type: "key",
  });
  let type: "key" | "lock" | undefined = undefined;
  let next: Lockey = newLockey();
  let length = 0;
  for (const line of input.split("\n")) {
    if (line === "") {
      assert(type, `Parse: type not defined`);
      next.number = Number(next.pips.join(""));
      const k = `${next.type}-${next.number}`;
      assert(!state.map.has(k), `Parse: duplicate ${type}`);
      state.map.set(k, next);
      state[type].push(next);
      next = newLockey();
      type = undefined;
      length = 0;
      continue;
    }
    if (type === undefined) {
      if (line === ".....") type = "key";
      else if (line === "#####") type = "lock";
      else assert(false, `Parse: No type parsed`);
      next.type = type;
      continue;
    }
    if (length++ === 5 && ["#####", "....."].includes(line)) {
      continue;
    }
    assert(line.length === 5, `Parse: bad line length`);
    for (let i = 0; i < line.length; i++) {
      if (line[i] === "#") next.pips[i]++;
      assert(next.pips[i] < 6, `Parse: out of bounds`);
    }
  }
  return state;
};

const state = parse();
console.log(`Keys: ${state.key.length}`, `Locks: ${state.lock.length}`);

/*************
 * PART ONE! *
 *************/
{
  let answerOne = 0;
  const seen = new Set<string>();
  for (const lock of state.lock) {
    for (const key of state.key) {
      const id = `${lock.number}-${key.number}`;
      if (seen.has(id)) assert(false, "Impossible?");
      seen.add(id);
      const overlap = [
        key.pips[0] + lock.pips[0],
        key.pips[1] + lock.pips[1],
        key.pips[2] + lock.pips[2],
        key.pips[3] + lock.pips[3],
        key.pips[4] + lock.pips[4],
      ];
      if (overlap.filter((n) => n < 6).length === 5) {
        answerOne++;
      }
    }
  }
  console.log(`\nAnswer 1: ${answerOne}\n`);
}
