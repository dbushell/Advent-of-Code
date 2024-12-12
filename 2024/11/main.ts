#!/usr/bin/env -S deno run --allow-read

const inputText = await Deno.readTextFile(
  new URL("input.txt", import.meta.url),
);

let stones = inputText.split(/\s+/)
  .filter((s) => s.trim() !== "")
  .map((s) => Number.parseInt(s));

const blink = () => {
  const newStones: Array<number> = [];
  for (let i = 0; i < stones.length; i++) {
    if (stones[i] === 0) {
      newStones.push(1);
      continue;
    }
    const digits = String(stones[i]);
    if (digits.length % 2 === 0) {
      newStones.push(
        Number.parseInt(digits.substring(0, digits.length / 2)),
      );
      newStones.push(
        Number.parseInt(digits.substring(digits.length / 2)),
      );
      continue;
    }
    newStones.push(stones[i] * 2024);
  }
  stones = newStones;
};

for (let i = 0; i < 25; i++) {
  blink();
}
const answerOne = stones.length;

console.log(`Answer 1: ${answerOne}`);
