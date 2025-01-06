#!/usr/bin/env -S deno run --allow-read

import { assert } from "jsr:@std/assert/assert";

const inputText = await Deno.readTextFile(
  new URL("input.txt", import.meta.url),
);

type Operation = {
  type: "move" | "reverse" | "rotate" | "swap";
  x: number | string;
  y: number | string;
};

const operations: Array<Operation> = [];

for (const line of inputText.split("\n")) {
  if (line.startsWith("move")) {
    const [, x, y] = line.match(/(\d+).+?(\d+)/)!;
    operations.push({ type: "move", x, y });
  } else if (line.startsWith("reverse")) {
    const [, x, y] = line.match(/(\d+).+?(\d+)/)!;
    operations.push({ type: "reverse", x, y });
  } else if (line.startsWith("swap")) {
    const [, x, y] = line.match(/(\w) with (?:position|letter) (\w)/)!;
    operations.push({ type: "swap", x, y });
  } else if (line.startsWith("rotate based")) {
    const [, x] = line.match(/letter (\w+)/)!;
    operations.push({ type: "rotate", x, y: "" });
  } else if (line.startsWith("rotate")) {
    const [, x, y] = line.match(/(left|right) (\d+) /)!;
    operations.push({ type: "rotate", x, y });
  }
}

operations.forEach((op) => {
  if (!Number.isNaN(Number(op.x))) op.x = Number(op.x);
  if (!Number.isNaN(Number(op.y))) op.y = Number(op.y);
});

const isNumber = (n: number | string): n is number => {
  return Number.isInteger(n);
};

const scramble = (input: Array<string>): string => {
  for (const op of operations) {
    switch (op.type) {
      case "move": {
        assert(isNumber(op.x) && isNumber(op.y));
        const char = input[op.x];
        input.splice(op.x, 1);
        input.splice(op.y, 0, char);
        break;
      }
      case "reverse": {
        assert(isNumber(op.x) && isNumber(op.y));
        input.splice(
          op.x,
          0,
          ...input.splice(op.x, (op.y + 1) - op.x).reverse(),
        );
        break;
      }
      case "rotate": {
        if (op.x === "left") {
          assert(isNumber(op.y));
          let times = op.y;
          while (times--) input.push(input.shift()!);
        } else if (op.x === "right") {
          assert(isNumber(op.y));
          let times = op.y;
          while (times--) input.unshift(input.pop()!);
        } else {
          assert(!isNumber(op.x));
          let times = input.indexOf(op.x);
          times += times >= 4 ? 2 : 1;
          while (times--) input.unshift(input.pop()!);
        }
        break;
      }
      case "swap": {
        if (isNumber(op.x) && isNumber(op.y)) {
          [input[op.x], input[op.y]] = [input[op.y], input[op.x]];
        } else if (!isNumber(op.x) && !isNumber(op.y)) {
          const xi = input.indexOf(op.x);
          const yi = input.indexOf(op.y);
          [input[xi], input[yi]] = [input[yi], input[xi]];
        }
        break;
      }
    }
  }
  return input.join("");
};

console.log(`Answer 1: ${scramble("abcdefgh".split(""))}`);

const permutations = (input: Array<string>): Array<string> => {
  if (input.length === 0) return [""];
  return input.flatMap((_, i) => {
    const next = [...input];
    const char = next.splice(i, 1)[0];
    return permutations(next).map((perm) => char + perm);
  });
};

for (const input of permutations("abcdefgh".split(""))) {
  if (scramble(input.split("")) === "fbgdceah") {
    console.log(`Answer 2: ${input}`);
  }
}
