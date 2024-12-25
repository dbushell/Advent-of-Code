#!/usr/bin/env -S deno run --allow-read

const inputText = (await Deno.readTextFile(
  new URL("input.txt", import.meta.url),
)).trim();

const input = Number(inputText);

// Brute force!
let answerOne = 0;
for (let i = 1_000_000; i > 0; i--) {
  let presents = 0;
  for (let j = 1; j < i + 1; j++) if (i % j === 0) presents += j * 10;
  if (presents >= input) answerOne = i;
}
console.log(`Answer 1: ${answerOne}`);

// More bruce force...
let answerTwo = 0;
const elves: Array<number> = [];
for (let house = 1; house < 1_000_000; house++) {
  let presents = 0;
  for (let elf = 1; elf <= house; elf++) {
    if (elves[elf] === 50) continue;
    if (house % elf !== 0) continue;
    elves[elf] ??= 0;
    presents += elf * 11;
    elves[elf]++;
  }
  if (presents >= input) {
    answerTwo = house;
    break;
  }
}

console.log(`Answer 2: ${answerTwo}`);
