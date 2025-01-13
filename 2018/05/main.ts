#!/usr/bin/env -S deno run --allow-read

const inputText = (await Deno.readTextFile(
  new URL("input.txt", import.meta.url),
)).trim();

const collapse = (polymer: string): number => {
  for (let i = 0; i < polymer.length - 1; i++) {
    if (i < 0) i = 0;
    const c1 = polymer[i];
    const c2 = polymer[i + 1];
    if (c1.toLowerCase() !== c2.toLowerCase()) continue;
    if (/[a-z]/.test(c1) && /[a-z]/.test(c2)) continue;
    if (/[A-Z]/.test(c1) && /[A-Z]/.test(c2)) continue;
    polymer = polymer.replaceAll(c1 + c2, "");
    polymer = polymer.replaceAll(c2 + c1, "");
    i -= 2;
  }
  return polymer.length;
};

const shortest = Math.min(
  ..."abcdefghijklmnopqrstuvwxyz".split("").map((char) => {
    let input = inputText.replaceAll(char, "");
    input = input.replaceAll(char.toUpperCase(), "");
    return collapse(input);
  }),
);

console.log(`Answer 1: ${collapse(inputText)}`);
console.log(`Answer 2: ${shortest}`);
