#!/usr/bin/env -S deno run --allow-read
import { assertEquals } from "jsr:@std/assert";

const inputText = await Deno.readTextFile(
  new URL("input.txt", import.meta.url),
);

const leftList: Array<number> = [];
const rightList: Array<number> = [];

// Parse input into two lists
for (const inputLine of inputText.split("\n")) {
  const match = inputLine.trim().match(/^(\d+)\s+(\d+)$/);
  if (match === null) continue;
  const [, leftNum, rightNum] = match;
  leftList.push(Number.parseInt(leftNum));
  rightList.push(Number.parseInt(rightNum));
}

assertEquals(leftList.length, rightList.length, "Lists must be same length");

// Sort smallest to largest
leftList.sort((a, b) => a - b);
rightList.sort((a, b) => a - b);

// Calculate total distance between pairs
let totalDistance = 0;
for (let i = 0; i < leftList.length; i++) {
  totalDistance += Math.abs(leftList[i] - rightList[i]);
}

console.log(`Answer 1: ${totalDistance}`);

// Calculate similarity score between left and right list
let similarityScore = 0;
for (let i = 0; i < leftList.length; i++) {
  const leftNum = leftList[i];
  const rightAppearances = rightList.filter((rightNum) => rightNum === leftNum);
  similarityScore += leftNum * rightAppearances.length;
}

console.log(`Answer 2: ${similarityScore}`);
