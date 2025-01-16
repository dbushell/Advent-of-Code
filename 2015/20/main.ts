#!/usr/bin/env -S deno run --allow-read

const inputText = (await Deno.readTextFile(
  new URL("input.txt", import.meta.url),
)).trim();

const input = Number(inputText);

const factors = (n: number): Array<number> => {
  const f: Array<number> = [];
  for (let i = 1; i <= Math.sqrt(n); i++) {
    if (n % i !== 0) continue;
    f.push(i);
    const c = n / i;
    if (c !== i) f.push(c);
  }
  return f;
};

let answerOne = 0;
for (let i = 1; i < 1_000_000; i++) {
  let presents = 0;
  for (const elf of factors(i)) presents += elf * 10;
  if (presents >= input) {
    answerOne = i;
    break;
  }
}
console.log(`Answer 1: ${answerOne}`);

let answerTwo = 0;
const elves: Array<number> = [];
for (let house = 1; house < 1_000_000; house++) {
  let presents = 0;

  for (const elf of factors(house)) {
    if (elves[elf] === 50) continue;
    // if (house % elf !== 0) continue;
    presents += elf * 11;
    elves[elf] ??= 0;
    elves[elf]++;
  }
  if (presents >= input) {
    answerTwo = house;
    break;
  }
}

console.log(`Answer 2: ${answerTwo}`);
