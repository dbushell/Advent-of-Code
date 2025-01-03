#!/usr/bin/env -S deno run --allow-read

const inputText = await Deno.readTextFile(
  new URL("input.txt", import.meta.url),
);

type Set = [number, number, number];

const numbers: Array<Array<number>> = inputText.trim().split("\n").map((line) =>
  line.split(/\s+/).map(Number).filter((n) => n > 0)
);

const possible = (set: Set): boolean => {
  const [a, b, c] = set.toSorted((a, b) => a - b);
  return a + b > c;
};

// Count horizontal triangles
const answerOne = numbers.filter((n) => possible(n as Set)).length;
console.log(`Answer 1: ${answerOne}`);

// Count vertical triangles
let answerTwo = 0;
for (let i = 0; i < numbers.length - 2; i += 3) {
  const n1 = numbers[i + 0];
  const n2 = numbers[i + 1];
  const n3 = numbers[i + 2];
  if (possible([n1[0], n2[0], n3[0]])) answerTwo++;
  if (possible([n1[1], n2[1], n3[1]])) answerTwo++;
  if (possible([n1[2], n2[2], n3[2]])) answerTwo++;
}
console.log(`Answer 2: ${answerTwo}`);
