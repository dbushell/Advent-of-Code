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

/*************
 * PART TWO! *
 *************/

const stone2 = inputText.split(/\s+/)
  .filter((s) => s.trim() !== "")
  .map((s) => Number.parseInt(s));

const cache2 = new Map<string, number>();

const blink2 = (value: number, times: number): number => {
  const key = `${value}-${times}`;
  if (cache2.has(key)) return cache2.get(key)!;
  if (times === 0) return 1;
  times--;
  let newValue = 0;
  if (value === 0) {
    newValue = blink2(1, times);
  } else if (String(value).length % 2 !== 0) {
    newValue = blink2(value * 2024, times);
  } else {
    const digits = String(value);
    const v1 = Number.parseInt(digits.substring(0, digits.length / 2));
    const v2 = Number.parseInt(digits.substring(digits.length / 2));
    newValue = blink2(v1, times) + blink2(v2, times);
  }
  cache2.set(key, newValue);
  return newValue;
};

let answerTwo = 0;
for (const stone of stone2) {
  answerTwo += blink2(stone, 75);
}

console.log(`Answer 1: ${answerOne}`);
console.log(`Answer 2: ${answerTwo}`);
