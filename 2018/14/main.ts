#!/usr/bin/env -S deno run --allow-read

const input = Number.parseInt(
  await Deno.readTextFile(
    new URL("input.txt", import.meta.url),
  ),
);

const recipes: number[] = [3, 7];

let e1 = 0;
let e2 = 1;

const next = () => {
  const sum = recipes[e1] + recipes[e2];
  if (sum >= 10) recipes.push(Math.floor((sum / 10) % 10));
  recipes.push(sum % 10);
  e1 = (e1 + 1 + recipes[e1]) % recipes.length;
  e2 = (e2 + 1 + recipes[e2]) % recipes.length;
};

for (let i = 0; i < input + 10; i++) next();
console.log(`Answer 1: ${recipes.slice(input, input + 10).join("")}`);

while (true) {
  const offset = Math.max(0, recipes.length - 10);
  const compare = recipes.slice(offset).join("");
  const index = compare.indexOf(String(input));
  if (index > -1) {
    console.log(`Answer 2: ${offset + index}`);
    break;
  }
  next();
}
