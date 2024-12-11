#!/usr/bin/env -S deno run --allow-read

const inputText = await Deno.readTextFile(
  new URL("input.txt", import.meta.url),
);

const regexp = /mul\((\d{1,3}),(\d{1,3})\)/g;

let answerOne = 0;
for (const [, n1, n2] of inputText.matchAll(regexp)) {
  answerOne += Number.parseInt(n1) * Number.parseInt(n2);
}

console.log(`Answer 1: ${answerOne}`);

// Darn they tricked me...

let answerTwo = 0;
let enabled = true;
let buffer = "";

// Iterate input character by character
for (let i = 0; i < inputText.length; i++) {
  buffer += inputText[i];
  // Look for instructions and clear buffer
  if (buffer.substring(buffer.length - 4) === "do()") {
    enabled = true;
    buffer = "";
    continue;
  }
  if (buffer.substring(buffer.length - 7) === "don't()") {
    enabled = false;
    buffer = "";
    continue;
  }
  // Dont look for matches whilst `don't()` is enabled
  if (enabled === false) {
    continue;
  }
  // Match end of buffer and clear
  const match = buffer.match(/mul\((\d{1,3}),(\d{1,3})\)$/);
  if (match) {
    const [, n1, n2] = match;
    answerTwo += Number.parseInt(n1) * Number.parseInt(n2);
    buffer = "";
  }
}

console.log(`Answer 2: ${answerTwo}`);
