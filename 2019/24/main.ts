#!/usr/bin/env -S deno run --allow-read

import { assert } from "jsr:@std/assert/assert";

const inputText = await Deno.readTextFile(
  new URL("input.txt", import.meta.url),
);

const bitIndex = (x: number, y: number) => (y * 5 + x);

const setBit = (n: number, x: number, y: number, b: 0 | 1) => {
  const index = bitIndex(x, y);
  return b ? n | (1 << index) : n & ~(1 << index);
};

const getBit = (n: number, x: number, y: number) => {
  if (x < 0 || y < 0 || x >= 5 || y >= 5) return 0;
  const index = bitIndex(x, y);
  return (n & (1 << index)) >> index;
};

const adjacentBits = (n: number, x: number, y: number) => {
  return [[x, y - 1], [x, y + 1], [x - 1, y], [x + 1, y]].map(([nx, ny]) =>
    getBit(n, nx, ny)
  );
};

let inputNumber = 0;
const lines = inputText.trim().split("\n");
for (let y = 0; y < lines.length; y++) {
  const chars = lines[y].trim().split("");
  for (let x = 0; x < chars.length; x++) {
    inputNumber = setBit(inputNumber, x, y, chars[x] === "#" ? 1 : 0);
  }
}

{
  let number = inputNumber;
  const layouts = new Set<number>();
  while (layouts.has(number) === false) {
    layouts.add(number);
    let next = number;
    for (let y = 0; y < 5; y++) {
      for (let x = 0; x < 5; x++) {
        const bug = getBit(number, x, y);
        const bits = adjacentBits(number, x, y);
        const adjacent = bits.reduce((c, v) => (c + v), 0);
        if (bug && adjacent !== 1) next = setBit(next, x, y, 0);
        else if (!bug && [1, 2].includes(adjacent)) {
          next = setBit(next, x, y, 1);
        }
      }
    }
    number = next;
  }
  const answerOne = number;
  console.log(`Answer 1: ${answerOne}`);
}

/*************
 * PART TWO! *
 *************/

/*

0,0  1,0  2,0  3,0  4,0

0,1  1,1  2,1  3,1  4,1

0,2  1,2   ?   3,2  4,2

0,3  1,3  2,3  3,3  4,3

0,4  1,4  2,4  3,4  4,4

*/

{
  const update = (level: number, below = 0, above = 0) => {
    let next = level;
    next = setBit(next, 2, 2, 0);

    for (let y = 0; y < 5; y++) {
      for (let x = 0; x < 5; x++) {
        // Skip center
        if (x === 2 && y === 2) continue;
        const bug = getBit(level, x, y);
        const bits = adjacentBits(level, x, y);
        // Top side
        if (y === 0 && [1, 2, 3].includes(x)) {
          bits.push(getBit(above, 2, 1));
        }
        // Bottom side
        if (y === 4 && [1, 2, 3].includes(x)) {
          bits.push(getBit(above, 2, 3));
        }
        // Left side
        if (x === 0 && [1, 2, 3].includes(y)) {
          bits.push(getBit(above, 1, 2));
        }
        // Right side
        if (x === 4 && [1, 2, 3].includes(y)) {
          bits.push(getBit(above, 3, 2));
        }
        // Top left corner
        if (x === 0 && y === 0) {
          bits.push(getBit(above, 2, 1), getBit(above, 1, 2));
        }
        // Top right corner
        if (x === 4 && y === 0) {
          bits.push(getBit(above, 2, 1), getBit(above, 3, 2));
        }
        // Bottom left corner
        if (x === 0 && y === 4) {
          bits.push(getBit(above, 1, 2), getBit(above, 2, 3));
        }
        // Bottom right corner
        if (x === 4 && y === 4) {
          bits.push(getBit(above, 3, 2), getBit(above, 2, 3));
        }
        // Inside top
        if (x === 2 && y === 1) {
          for (let i = 0; i < 5; i++) bits.push(getBit(below, i, 0));
        }
        // Inside bottom
        if (x === 2 && y === 3) {
          for (let i = 0; i < 5; i++) bits.push(getBit(below, i, 4));
        }
        // Inside left
        if (x === 1 && y === 2) {
          for (let i = 0; i < 5; i++) bits.push(getBit(below, 0, i));
        }
        // Inside right
        if (x === 3 && y === 2) {
          for (let i = 0; i < 5; i++) bits.push(getBit(below, 4, i));
        }
        const adjacent = bits.reduce((c, v) => (c + v), 0);
        if (bug && adjacent !== 1) next = setBit(next, x, y, 0);
        else if (!bug && [1, 2].includes(adjacent)) {
          next = setBit(next, x, y, 1);
        }
      }
    }
    return next;
  };

  let depths = [inputNumber];

  for (let i = 0; i < 200; i++) {
    const newDepths: Array<number> = [];
    for (let d = 0; d < depths.length; d++) {
      if (d === 0) newDepths.push(update(0, 0, depths[d]));
      newDepths.push(update(depths[d], depths[d - 1], depths[d + 1]));
      if (d === depths.length - 1) newDepths.push(update(0, depths[d], 0));
    }
    depths = newDepths;
  }

  let answerTwo = 0;
  for (const layer of depths) {
    answerTwo += Array.from({ length: 25 }, (_, i) => i).reduce((c, i) => {
      return c += getBit(layer, i % 5, Math.floor(i / 5));
    }, 0);
  }

  console.log(`Answer 2: ${answerTwo}`);
}
