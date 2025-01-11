#!/usr/bin/env -S deno run --allow-read

const inputText = await Deno.readTextFile(
  new URL("input.txt", import.meta.url),
);

const A = Number.parseInt(inputText.match(/^Generator A.+? (\d+)$/m)!.at(1)!);
const B = Number.parseInt(inputText.match(/^Generator B.+? (\d+)$/m)!.at(1)!);

const AF = 16807;
const BF = 48271;
const M = 2147483647;

{
  let a = A;
  let b = B;
  let pairs = 0;
  for (let i = 0; i < 40_000_000; i++) {
    a = (a * AF) % M;
    b = (b * BF) % M;
    if ((a & 65535) === (b & 65535)) pairs++;
  }
  console.log(`Answer 1: ${pairs}`);
}

const generator = function* (
  start: number,
  factor: number,
  multiple: number,
): Generator<number> {
  let num = start;
  while (true) {
    num = (num * factor) % M;
    if (num % multiple === 0) yield num;
  }
};

{
  let pairs = 0;
  const aGen = generator(A, AF, 4);
  const bGen = generator(B, BF, 8);
  for (let i = 0; i < 5_000_000; i++) {
    const a = aGen.next();
    const b = bGen.next();
    if (a.done && b.done) break;
    if ((a.value & 65535) === (b.value & 65535)) {
      pairs++;
    }
  }
  console.log(`Answer 2: ${pairs}`);
}
