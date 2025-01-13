#!/usr/bin/env -S deno run --allow-read

const inputText = await Deno.readTextFile(
  new URL("input.txt", import.meta.url),
);

const ids = inputText.trim().split("\n");

{
  let double = 0;
  let triple = 0;
  for (const id of ids) {
    // Count duplicate characters in ID
    const characters: { [key: string]: number } = {};
    for (const char of id) {
      characters[char] ??= 0;
      characters[char]++;
    }
    // Increment if ID has double or triple
    let d = false;
    let t = false;
    for (const n of Object.values(characters)) {
      if (n === 2) d = true;
      if (n === 3) t = true;
    }
    if (d) double++;
    if (t) triple++;
  }
  console.log(`Answer 1: ${(double * triple)}`);
}

{
  // Compare all IDs
  for (let a = 0; a < ids.length; a++) {
    for (let b = a; b < ids.length; b++) {
      // Find single difference
      const difference: Array<number> = [];
      for (let c = 0; c < ids[0].length; c++) {
        if (ids[a][c] !== ids[b][c]) difference.push(c);
        if (difference.length > 1) break;
      }
      if (difference.length === 1) {
        console.log(`Answer 2: ${ids[a].replace(ids[a][difference[0]], "")}`);
        Deno.exit();
      }
    }
  }
}
