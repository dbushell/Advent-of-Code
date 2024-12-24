#!/usr/bin/env -S deno run --allow-read

import { assert } from "jsr:@std/assert/assert";

const inputText = await Deno.readTextFile(
  new URL("input.txt", import.meta.url),
);

const MAX_ROBOTS = 25;

type Keypad = Array<Array<string>>;
type XY = [number, number];

const codes: Array<string> = [];
for (const line of inputText.split("\n")) {
  const code = Array.from(
    line.matchAll(/([\d|A])/g).map((m) => m[1]),
  );
  if (code.length !== 4) continue;
  codes.push(code.join(""));
}

const cache = new Map<string, number>();

const nPad: Keypad = [
  ["7", "8", "9"],
  ["4", "5", "6"],
  ["1", "2", "3"],
  ["", "0", "A"],
];

const dPad: Keypad = [
  ["", "^", "A"],
  ["<", "v", ">"],
];

const xyFind = (pad: Keypad, value: string): XY => {
  for (let y = 0; y < pad.length; y++) {
    for (let x = 0; x < pad[y].length; x++) {
      if (pad[y][x] === value) return [x, y];
    }
  }
  assert(false, "xyFind missing");
};

const encode = (code: string, pad: Keypad, depth = 0) => {
  let a1 = xyFind(pad, "A");
  let sequence = "";
  for (const char of code) {
    const a2 = xyFind(pad, char);
    let aU = Math.max(0, a1[1] - a2[1]);
    let aD = Math.max(0, a2[1] - a1[1]);
    let aL = Math.max(0, a1[0] - a2[0]);
    let aR = Math.max(0, a2[0] - a1[0]);
    while (aR--) sequence += ">";
    while (aU--) sequence += "^";
    while (aD--) sequence += "v";
    while (aL--) sequence += "<";
    sequence += "A";
    a1 = a2;
  }
  while (depth--) {
    sequence = encode(sequence, pad, 0);
  }
  return sequence;
};

const mixParts = (str: string): Array<string> => {
  const result = new Set<string>();
  const next = (s: string, prefix: string) => {
    if (s.length === 0) {
      result.add(prefix);
      return;
    }
    for (let i = 0; i < s.length; i++) {
      next(s.slice(0, i) + s.slice(i + 1), prefix + s[i]);
    }
  };
  next(str, "");
  return [...result];
};

const genSequence = (groups: Array<Array<string>>): Array<Array<string>> =>
  groups.length === 0
    ? [[]]
    : groups[0].flatMap((item) =>
      genSequence(groups.slice(1)).map((comb) => [item, ...comb])
    );

const allVariations = (code: string): Array<string> => {
  const mix = code.split("A").map(mixParts);
  const gen = genSequence(mix);
  const all = gen.map((seq) => seq.join("A"));
  return all;
};

const recurse = (sequence: string, depth = 0) => {
  if (sequence.length === 0) return 0;

  // Check cache
  if (cache.has(`${depth}-${sequence}`)) {
    return cache.get(`${depth}-${sequence}`)!;
  }

  // Mind the gap (number pad)
  if (depth === 0) {
    const p = xyFind(nPad, "A");
    for (const char of sequence) {
      if (char === "^") p[1]--;
      if (char === "v") p[1]++;
      if (char === "<") p[0]--;
      if (char === ">") p[0]++;
      if (p[0] === 0 && p[1] === 3) {
        return Infinity;
      }
    }
  }

  // Generate all
  const variations = allVariations(sequence);

  // Find shortest
  const bestLength = Math.min(...variations.map((variation) => {
    // Mind the gap (directional pad)
    const p = xyFind(dPad, "A");
    for (const char of variation) {
      if (char === "^") p[1]--;
      if (char === "v") p[1]++;
      if (char === "<") p[0]--;
      if (char === ">") p[0]++;
      if (p[0] === 0 && p[1] === 0) {
        return Infinity;
      }
    }
    if (depth === MAX_ROBOTS) {
      return variation.length;
    }
    let length = 0;
    variation.split("A").forEach((p, i, arr) => {
      if (i === arr.length - 1) return;
      const code = encode(p + "A", dPad);
      length += recurse(code, depth + 1);
    });
    return length;
  }));

  // Cache length
  cache.set(`${depth}-${sequence}`, bestLength);
  return bestLength;
};

const complexities: Array<number> = [];

for (const code of codes) {
  const variations = allVariations(encode(code, nPad));
  const length = Math.min(
    ...variations.map((vari) => recurse(vari, 0)),
  );
  const complexity = Number.parseInt(code.slice(0, -1)) * length;
  complexities.push(complexity);
  console.log(`Code: ${code} Best: ${length} (${complexity})\n`);
}

const answerTwo = complexities.reduce((v, c) => v += c, 0);
console.log(`Answer 2: ${answerTwo}`);
