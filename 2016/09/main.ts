#!/usr/bin/env -S deno run --allow-read

const inputText = (await Deno.readTextFile(
  new URL("input.txt", import.meta.url),
)).trim();

const decompress = (input: string, depth = -1): number => {
  let length = 0;
  while (input.length) {
    // Skip to parentheses
    const offset = input.indexOf("(");
    if (offset === -1) {
      length += input.length;
      break;
    }
    // Look for sequence
    const match = input.match(/^\((\d+)x(\d+)\)/);
    if (!match) {
      // Skip character
      input = input.slice(1);
      length++;
      continue;
    }
    const [characters, repeat] = match.slice(1, 3).map(Number);
    // Skip match
    input = input.slice(match[0].length);
    // Add repeating length
    if (depth >= 0) {
      length += repeat * decompress(input.slice(0, characters), depth + 1);
    } else {
      length += repeat * characters;
    }
    // Skip characters
    input = input.slice(characters);
  }
  return length;
};

console.log(`Answer 1: ${decompress(inputText)}`);
console.log(`Answer 2: ${decompress(inputText, 0)}`);
