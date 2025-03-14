#!/usr/bin/env -S deno run --allow-read

const inputText = await Deno.readTextFile(
  new URL("input.txt", import.meta.url),
);

export const knot = (
  input: Array<number>,
  list: Array<number>,
  position = 0,
  skip = 0,
): [number, number] => {
  for (const length of input) {
    // Get items (wrap around)
    const tail = list.slice(position, position + length);
    const head = list.slice(0, length - tail.length);
    const reverse = [...tail, ...head].reverse();
    // Replace reversed items
    list.splice(position, tail.length, ...reverse.slice(0, tail.length));
    list.splice(0, head.length, ...reverse.slice(tail.length));
    // Increment pointers
    position += length + skip;
    if (position >= list.length) position %= list.length;
    skip++;
  }
  return [position, skip];
};

export const denseHash = (list: Array<number>): Array<number> => {
  const dense: Array<number> = [];
  for (let i = 0; i < list.length; i += 16) {
    const block = list.slice(i, i + 16);
    let value = block.shift()!;
    while (block.length) value ^= block.shift()!;
    dense.push(value);
  }
  return dense;
};

export const knotHash = (input: Array<number>) => {
  input.push(17, 31, 73, 47, 23);
  const list = Array.from({ length: 256 }, (_, i) => i);
  let position = 0;
  let skip = 0;
  for (let i = 0; i < 64; i++) {
    [position, skip] = knot(input, list, position, skip);
  }
  return denseHash(list);
};

if (import.meta.main) {
  const input = inputText.trim().split(",").map(Number);
  const list = Array.from({ length: 256 }, (_, i) => i);
  knot(input, list);
  console.log(`Answer 1: ${list[0] * list[1]}`);
}

if (import.meta.main) {
  const input = inputText.trim().split("").map((n) => n.codePointAt(0)!);
  const hash = knotHash(input).map((n) => n.toString(16).padStart(2, "0"));
  console.log(`Answer 2: ${hash.join("")}`);
}
