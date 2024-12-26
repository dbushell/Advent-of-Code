#!/usr/bin/env -S deno run --allow-read

const inputText = await Deno.readTextFile(
  new URL("input.txt", import.meta.url),
);

const [, ROW, COLUMN] = inputText
  .match(/(\d+),[^\d]+(\d+)\./)!
  .map(Number);

let row = 1;
let column = 1;
let increment = 2;
let code = 20151125n;

while (true) {
  column++;
  if (--row === 0) {
    row = increment++;
    column = 1;
  }
  code = (code * 252533n) % 33554393n;
  if (column === COLUMN && row === ROW) break;
}

console.log(`Answer 1: ${code}`);
