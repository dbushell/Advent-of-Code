#!/usr/bin/env -S deno run --allow-read

const inputText = await Deno.readTextFile(
  new URL("input.txt", import.meta.url),
);

const codes = inputText.trim().split("\n");

// Count characters per position
const characters = new Map<string, number>();
codes.forEach((code) => {
  code.split("").forEach((c, i) => {
    const key = `${c}-${i}`;
    const count = characters.get(key) ?? 0;
    characters.set(key, count + 1);
  });
});

// Build message from characters
const message = (reverse = false): string => {
  let message = "";
  for (let i = 0; i < codes[0].length; i++) {
    const letters = Array.from(characters)
      .filter(([key]) => key.endsWith(`-${i}`))
      .sort((a, b) => a[1] - b[1])
      .map(([key]) => key.split("-")[0]);
    if (reverse) letters.reverse();
    message += letters.at(-1)!;
  }
  return message;
};

console.log(`Answer 1: ${message()}`);
console.log(`Answer 2: ${message(true)}`);
