#!/usr/bin/env -S deno run --allow-read

import { assert } from "jsr:@std/assert/assert";

const inputText = await Deno.readTextFile(
  new URL("input.txt", import.meta.url),
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

const dirCache: Array<string> = [];
const dirIndex = new Map<string, number>();

const generateDirs = (
  arr: Array<string>,
  len: number,
  tmp: Array<string>,
  out: Array<Array<string>>,
): void => {
  if (tmp.length === len) {
    out.push([...tmp]);
    return;
  }

  for (let i = 0; i < arr.length; i++) {
    tmp.push(arr[i]);
    generateDirs(arr, len, tmp, out);
    tmp.pop();
  }
};

const allDirs: Array<Array<string>> = [];
for (let i = 1; i <= 4; i++) {
  generateDirs(["^", "v", "<", ">"], i, [], allDirs);
}

dirCache.push("A");
dirIndex.set("A", 0);

allDirs.map((dir) => dir.join("")).forEach((dir) => {
  dirCache.push(dir + "A");
  dirIndex.set(dir + "A", dirCache.length - 1);
});

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

      const firstSeq: Array<number> = [];

      combo.split("A").forEach((p) => {
        if (p.length === 0) return;
        assert(dirIndex.has(p + "A"));
        firstSeq.push(dirIndex.get(p + "A")!);
      });

      let lastSeq = firstSeq;
      let lastLen = firstSeq.length;

      for (let i = 0; i < MAX_ROBOTS; i++) {
        const cacheParts = new Map<string, [number, Array<number>]>();
        let b1 = xyFind(dPad, "A");

        let nextLength = 0;
        const nextSeq: Array<number> = [];

        for (let j = 0; j < lastSeq.length; j++) {
          const part = dirCache[lastSeq[j]];

          const cached = cacheParts.get(part);
          if (cached) {
            const [length, indexes] = cached;
            nextLength += length;
            indexes.forEach((index) => nextSeq.push(index));
            continue;
          }

          let buffer = "";

          const partIndexes = [];
          let partLength = 0;

          for (const char of part) {
            const b2 = xyFind(dPad, char);
            let bU = Math.max(0, b1[1] - b2[1]);
            let bD = Math.max(0, b2[1] - b1[1]);
            let bL = Math.max(0, b1[0] - b2[0]);
            let bR = Math.max(0, b2[0] - b1[0]);

            while (bR--) {
              if (i < MAX_ROBOTS - 1) {
                buffer += ">";
              }
              nextLength++;
              partLength++;
            }
            while (bU--) {
              if (i < MAX_ROBOTS - 1) {
                buffer += "^";
              }
              nextLength++;
              partLength++;
            }
            while (bD--) {
              if (i < MAX_ROBOTS - 1) {
                buffer += "v";
              }
              nextLength++;
              partLength++;
            }
            while (bL--) {
              if (i < MAX_ROBOTS - 1) {
                buffer += "<";
              }
              nextLength++;
              partLength++;
            }
            if (buffer.length === 0) {
              nextLength++;
              nextSeq.push(0);
              partLength++;
              partIndexes.push(0);
            }

            if (i < MAX_ROBOTS - 1) {
              if (buffer.length) {
                assert(buffer !== "A");
                buffer += "A";
                assert(dirIndex.has(buffer));
                const index = dirIndex.get(buffer);
                assert(index && index >= 0, `Unknown part ${buffer}`);
                nextLength++;
                nextSeq.push(index);
                partLength++;
                partIndexes.push(index);
                buffer = "";
              }
            }

            assert(buffer.length === 0, "Buffer not empty");
            b1 = b2;
          }
          cacheParts.set(part, [partLength, partIndexes]);
        }
        lastSeq = nextSeq;
        lastLen = nextLength;
      }

      if (bestLen === 0 || lastLen < bestLen) {
        bestLen = lastLen;
      }
    }
    const codeNum = Number.parseInt(code.slice(0, -1));
    calcs.push([codeNum, bestLen, codeNum * bestLen]);
  }
  const complexity = calcs.reduce<number>((v, c) => (v + c[2]), 0);
  const answerOne = complexity;

  console.log(`Answer 1: ${answerOne}`);
}
