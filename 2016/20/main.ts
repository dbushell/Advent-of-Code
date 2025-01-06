#!/usr/bin/env -S deno run --allow-read

const inputText = await Deno.readTextFile(
  new URL("input.txt", import.meta.url),
);

const blocked: Array<[number, number]> = [];

for (const line of inputText.trim().split("\n")) {
  const [a, b] = line.split("-").map(Number);
  blocked.push([a, b]);
}

blocked.sort((a, b) => (a[0] - b[0]));

const merged: Array<[number, number]> = [blocked[0]];

for (let i = 1; i < blocked.length; i++) {
  if (blocked[i][0] <= merged.at(-1)![1] + 1) {
    if (blocked[i][1] > merged.at(-1)![1]) merged.at(-1)![1] = blocked[i][1];
  } else {
    merged.push(blocked[i]);
  }
}

let allowed = 0;
for (let i = 1; i < merged.length; i++) {
  allowed += (merged[i][0] - merged[i - 1][1]) - 1;
}

console.log(`Answer 1: ${merged[0][1] + 1}`);
console.log(`Answer 2: ${allowed}`);
