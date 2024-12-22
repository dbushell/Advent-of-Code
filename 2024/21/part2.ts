#!/usr/bin/env -S deno run --allow-read

/**
 * NOT SOLVED !!
 */

import { assert } from "jsr:@std/assert/assert";

const inputText = await Deno.readTextFile(
  new URL("input.txt", import.meta.url),
);

const MAX_ROBOTS = 25;

type Keypad = Array<Array<string>>;
type XY = [number, number];

const codes: Array<string> = [];

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

for (const line of inputText.split("\n")) {
  const code = Array.from(
    line.matchAll(/([\d|A])/g).map((m) => m[1]),
  );
  if (code.length !== 4) continue;
  codes.push(code.join(""));
}

const allVariations = (code: string, pad: Keypad): Array<string> => {
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
  if (code === "A") {
    return ["A"];
  }
  const mix = sequence.split("A").map(mixParts);
  const gen = genSequence(mix);
  return gen.map((seq) => seq.join("A"));
};

const complexities: Array<number> = [];

const cache = new Map<string, number>();

const recurse = (seq: string, depth = 0) => {
  if (seq.length === 0) return 0;

  if (cache.has(`${seq}-${depth}`)) {
    return cache.get(`${seq}-${depth}`)!;
  }

  const variations = allVariations(seq, dPad);

  const bestLength = Math.min(...variations.map((vari) => {
    let varLen = vari.length;
    const p = xyFind(dPad, "A");
    for (const e of vari) {
      if (e === "^") p[1]--;
      if (e === "v") p[1]++;
      if (e === "<") p[0]--;
      if (e === ">") p[0]++;
      if (p[0] === 0 && p[1] === 0) {
        return Infinity;
      }
    }
    if (depth < MAX_ROBOTS - 1) {
      vari.split("A").forEach((p) => {
        varLen += recurse(p, depth + 1);
        varLen += recurse("A", depth + 1);
      });
    }
    return varLen;
  }));

  cache.set(`${seq}-${depth}`, bestLength);
  return bestLength;
};

for (const code of codes) {
  let bestLen = 0;

  const variations = allVariations(code, nPad);

  comboLoop: for (const sequence of variations) {
    // Mind the gap!
    const p = xyFind(nPad, "A");
    for (const e of sequence) {
      if (e === "^") p[1]--;
      if (e === "v") p[1]++;
      if (e === "<") p[0]--;
      if (e === ">") p[0]++;
      if (p[0] === 0 && p[1] === 3) {
        continue comboLoop;
      }
    }

    let length = 0;

    // let xA = 0;
    // for (let x = 0; x < sequence.length; x++) {
    //   if (sequence[x] === "A") {
    //     // console.log(sequence, sequence.slice(xA, x));
    //     length += recurse(sequence.slice(xA, x) + "A");
    //     // length += recurse("A");
    //     xA = x + 1;
    //   }
    //   cache.clear();
    // }
    sequence.split("A").forEach((p, i, arr) => {
      // if (i === arr.length - 1) return;
      length += recurse(p);
      length += recurse("A");
      // length += recurse(p + "A");
      cache.clear();
    });

    // console.log(`${code} ${sequence} ${length}`);

    if (bestLen === 0 || length < bestLen) {
      bestLen = length;
    }
  }

  const complexity = Number.parseInt(code.slice(0, -1)) * bestLen;
  complexities.push(complexity);
  console.log(`Code: ${code} Best: ${bestLen} (${complexity})\n`);
}

const complexity = complexities.reduce((v, c) => v += c, 0);
const answerTwo = complexity;

console.log(`Answer 2: ${answerTwo}`);
