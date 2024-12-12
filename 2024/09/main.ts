#!/usr/bin/env -S deno run --allow-read --allow-write
import { assert } from "jsr:@std/assert/assert";

const inputText = (await Deno.readTextFile(
  new URL("test2.txt", import.meta.url),
)).trim();

assert(inputText.length % 2, "Input must be odd");

const diskArray: Array<number | string> = [];

const checksum = (array: typeof diskArray): number => {
  let sum = 0;
  for (let i = 0; i < array.length; i++) {
    const value = array[i];
    if (typeof value === "string") break;
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

console.log(`Answer 1: ${answerOne}`);
