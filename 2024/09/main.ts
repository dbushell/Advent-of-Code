#!/usr/bin/env -S deno run --allow-read
import { assert } from "jsr:@std/assert/assert";

const inputText = (await Deno.readTextFile(
  new URL("input.txt", import.meta.url),
)).trim();

assert(inputText.length % 2, "Input must be odd");

const diskArray: Array<number | string> = [];

const checksum = (array: typeof diskArray): number => {
  let sum = 0;
  for (let i = 0; i < array.length; i++) {
    const value = array[i];
    if (typeof value === "string") continue;
    sum += value * i;
  }
  return sum;
};

// Generate disk from map
for (let i = 0, id = 0; i < inputText.length; i++) {
  diskArray.push(
    ...new Array(Number.parseInt(inputText[i])).fill(i % 2 ? "." : id++),
  );
}

// Part 1
const diskOne = [...diskArray];
for (let i = diskOne.length - 1; i > 0; i--) {
  if (diskOne[i] === ".") continue;
  const spaceIndex = diskOne.indexOf(".");
  if (spaceIndex > i) break;
  diskOne[spaceIndex] = diskOne[i];
  diskOne[i] = ".";
}
const answerOne = checksum(diskOne);

// Part 2
const diskTwo = [...diskArray];
for (let i = diskTwo.length - 1, size = 1; i > 1; i--, size++) {
  const id = diskTwo[i];
  // Reset and look for next file
  if (id === ".") {
    size = 0;
    continue;
  }
  // Continue until entire file is found
  if (diskTwo[i - 1] === id) continue;
  // Look for free space
  for (let j = 0, free = 0; j < i; j++) {
    if (diskTwo[j] !== ".") {
      free = 0;
      continue;
    }
    // Move file into free space
    if (++free === size) {
      // I hope this works because I've lost track...
      for (let k = 0; size; k++, size--) {
        diskTwo[1 + (j - size)] = id;
        diskTwo[k + i] = ".";
      }
      break;
    }
  }
  // Reset
  size = 0;
}
const answerTwo = checksum(diskTwo);

console.log(`Answer 1: ${answerOne}`);
console.log(`Answer 2: ${answerTwo}`);
