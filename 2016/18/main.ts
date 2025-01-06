#!/usr/bin/env -S deno run --allow-read

const inputText = (await Deno.readTextFile(
  new URL("input.txt", import.meta.url),
)).trim();

const tiles = inputText.split("");

const next = (tiles: Array<string>) => {
  const row: Array<string> = [];
  for (let i = 0; i < tiles.length; i++) {
    const L = tiles[i - 1] ?? ".";
    const R = tiles[i + 1] ?? ".";
    row.push(L !== R ? "^" : ".");
    // const C = tiles[i];
    // row.push(
    //   [
    //       L === "^" && C === "^" && R === ".",
    //       L === "." && C === "^" && R === "^",
    //       L === "^" && C === "." && R === ".",
    //       L === "." && C === "." && R === "^",
    //     ].filter(Boolean).length === 1
    //     ? "^"
    //     : ".",
    // );
  }
  return row;
};

{
  const floor = [[...tiles]];
  while (floor.length < 40) floor.push(next(floor.at(-1)!));
  const safe = floor.flat().join("").replaceAll("^", "").length;
  console.log(`Answer 1: ${safe}`);
}

{
  const floor = [[...tiles]];
  while (floor.length < 400_000) floor.push(next(floor.at(-1)!));
  const safe = floor.flat().join("").replaceAll("^", "").length;
  console.log(`Answer 2: ${safe}`);
}
