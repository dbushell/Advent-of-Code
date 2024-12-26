#!/usr/bin/env -S deno run --allow-read

const inputText = await Deno.readTextFile(
  new URL("input.txt", import.meta.url),
);

const modules = inputText.trim().split("\n").map(Number);

const calcFuel = (mass: number) => Math.max(0, Math.floor(mass / 3) - 2);

const answerOne = modules.reduce((total, mass) => total += calcFuel(mass), 0);
console.log(`Answer 1: ${answerOne}`);

/*************
 * PART TWO! *
 *************/

const cache = new Map<number, number>();

const memoFuel = (mass: number): number => {
  if (cache.has(mass)) return cache.get(mass)!;
  let fuel = Math.max(0, Math.floor(mass / 3) - 2);
  if (fuel > 0) fuel += memoFuel(fuel);
  cache.set(mass, fuel);
  return fuel;
};

const answerTwo = modules.reduce((total, mass) => total += memoFuel(mass), 0);
console.log(`Answer 2: ${answerTwo}`);
