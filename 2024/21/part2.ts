#!/usr/bin/env -S deno run --allow-read

import { assert } from "jsr:@std/assert/assert";

const inputText = await Deno.readTextFile(
  new URL("test1.txt", import.meta.url),
);

const MAX_ROBOTS = 2;

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

const mixSequence = (sequence: Array<string>) =>
  sequence.filter((p) => p.length)
    .map(mixParts)
    .reduce(
      (acc, part) => acc.flatMap((str) => part.map((el) => str + el + "A")),
      [""],
    );

for (const line of inputText.split("\n")) {
  const code = Array.from(
    line.matchAll(/([\d|A])/g).map((m) => m[1]),
  );
  if (code.length !== 4) continue;
  codes.push(code.join(""));
}

{
  const calcs: Array<[number, number, number]> = [];

  for (const code of codes) {
    // Start positions
    let a1 = xyFind(nPad, "A");

    let bS: Array<string> = [];

    let bestLen: number = 0;

    for (const char of code) {
      const a2 = xyFind(nPad, char);
      const [aU, aD, aL, aR] = [
        Math.max(0, a1[1] - a2[1]),
        Math.max(0, a2[1] - a1[1]),
        Math.max(0, a1[0] - a2[0]),
        Math.max(0, a2[0] - a1[0]),
      ];
      bS.push(
        ...Array(aR).fill(">"),
        ...Array(aU).fill("^"),
        ...Array(aD).fill("v"),
        ...Array(aL).fill("<"),
      );
      bS.push("A");
      a1 = a2;
    }

    const combos = mixSequence(bS.join("").split("A"));

    comboLoop: for (const combo of combos) {
      bS = combo.split("");

      // Mind the gap!
      const p = xyFind(nPad, "A");
      for (const e of bS) {
        if (e === "^") p[1]--;
        if (e === "v") p[1]++;
        if (e === "<") p[0]--;
        if (e === ">") p[0]++;
        if (p[0] === 0 && p[1] === 3) {
          continue comboLoop;
        }
      }

      const cache = new Map<string, number>();

      const recurse = (seq: string, depth = 0) => {
        if (seq.length === 0) return 0;
        // console.log(depth);
        if (cache.has(`${seq}-${depth}`)) {
          return cache.get(`${seq}-${depth}`)!;
        }

        let b1 = xyFind(dPad, "A");

        let length = 0;
        let nextSeq = "";

        for (const char of seq) {
          let buffer = "";
          const b2 = xyFind(dPad, char);
          let bU = Math.max(0, b1[1] - b2[1]);
          let bD = Math.max(0, b2[1] - b1[1]);
          let bL = Math.max(0, b1[0] - b2[0]);
          let bR = Math.max(0, b2[0] - b1[0]);

          while (bR--) {
            buffer += ">";
            length++;
          }
          while (bU--) {
            buffer += "^";
            length++;
          }
          while (bD--) {
            buffer += "v";
            length++;
          }
          while (bL--) {
            buffer += "<";
            length++;
          }
          // if (buffer.length === 0) {
          // nextSeq += "A";
          // length++;
          // }
          if (buffer.length) {
            nextSeq += buffer;
            // nextSeq += "A";
            // length++;
          }
          nextSeq += "A";
          length++;
          b1 = b2;
        }

        assert(length === nextSeq.length);

        cache.set(`${seq}-${depth}`, length);

        if (depth < MAX_ROBOTS - 1) {
          nextSeq.split("A").forEach((p) => {
            length += recurse(p, depth + 1);
            length += recurse("A", depth + 1);
          });
        }
        return length;
      };

      let length = 0;

      // console.log(combo, combo.split("A"));

      combo.split("A").forEach((p) => {
        length += recurse(p);
        length += recurse("A");
        cache.clear();
      });

      if (bestLen === 0 || length < bestLen) {
        bestLen = length;
      }
    }
    const codeNum = Number.parseInt(code.slice(0, -1));
    console.log(bestLen, codeNum, codeNum * bestLen);
    calcs.push([codeNum, bestLen, codeNum * bestLen]);
  }
  const complexity = calcs.reduce<number>((v, c) => (v + c[2]), 0);
  const answerTwo = complexity;

  console.log(`Answer 2: ${answerTwo}`);
}
