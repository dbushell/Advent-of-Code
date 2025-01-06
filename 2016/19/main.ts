#!/usr/bin/env -S deno run --allow-read

const inputText = (await Deno.readTextFile(
  new URL("input.txt", import.meta.url),
)).trim();

const maxElves = Number.parseInt(inputText);

{
  const offset = 1 << Math.floor(Math.log2(maxElves));
  console.log(`Answer 1: ${1 + (maxElves - offset) * 2}`);
}

{
  const offset = Math.pow(3, Math.floor(Math.log(maxElves) / Math.log(3)));
  console.log(`Answer 2: ${maxElves - offset}`);
}

// {
//   const circle = Array.from({ length: maxElves }, (_, i) => i + 1);
//   while (circle.length > 1) {
//     circle.push(circle.shift()!);
//     circle.shift();
//   }
//   console.log(`Answer 1: ${circle[0]}`);
// }

// {
//   const circle = Array.from({ length: maxElves }, (_, i) => i + 1);
//   while (circle.length > 1) {
//     circle.splice(Math.floor(circle.length / 2), 1);
//     circle.push(circle.shift()!);
//   }
//   console.log(`Answer 2: ${circle[0]}`);
// }
