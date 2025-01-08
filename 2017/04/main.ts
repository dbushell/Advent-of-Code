#!/usr/bin/env -S deno run --allow-read

const inputText = await Deno.readTextFile(
  new URL("input.txt", import.meta.url),
);

const phrases = inputText.trim().split("\n");

{
  // Check for no duplicates
  let valid = 0;
  for (const phrase of phrases) {
    const words = phrase.split(/\s+/);
    if (words.length === new Set(words).size) valid++;
  }
  console.log(`Answer 1: ${valid}`);
}

{
  // Check for no anagrams
  let valid = 0;
  for (const phrase of phrases) {
    const words = phrase.split(/\s+/);
    words.forEach((word, i) => {
      words[i] = word.split("").sort((a, b) => a.localeCompare(b)).join("");
    });
    if (words.length === new Set(words).size) valid++;
  }
  console.log(`Answer 2: ${valid}`);
}
