#!/usr/bin/env -S deno run --allow-read

const inputText = await Deno.readTextFile(
  new URL("input.txt", import.meta.url),
);

let answerOne = 0;
let answerTwo = 0;

for (const line of inputText.split("\n")) {
  const match = line.match(/^(\d+)x(\d+)x(\d+)$/);
  if (!match) continue;
  const [, L, W, H] = match.map((n) => Number.parseInt(n));
  const sides = [
    2 * (L * W),
    2 * (W * H),
    2 * (H * L),
  ];
  const dimensions = [L, W, H].sort((a, b) => (a - b));
  sides.forEach((side) => (answerOne += side));
  answerOne += Math.min(...sides) / 2;
  answerTwo += (dimensions[0] * 2) + (dimensions[1] * 2);
  answerTwo += L * W * H;
}

console.log(`Answer one: ${answerOne}`);
console.log(`Answer two: ${answerTwo}`);
