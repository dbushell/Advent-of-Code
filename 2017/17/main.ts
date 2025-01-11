#!/usr/bin/env -S deno run --allow-read

const inputText = (await Deno.readTextFile(
  new URL("input.txt", import.meta.url),
)).trim();

const steps = Number.parseInt(inputText);

{
  const buffer = [0];
  let position = 0;
  for (let i = 1; i < 2018; i++) {
    position = ((position + steps) % i) + 1;
    buffer.splice(position, 0, i);
  }
  console.log(`Answer 1: ${buffer[position + 1]}`);
}

{
  let first = 0;
  let position = 0;
  for (let i = 0; i < 50_000_000; i++) {
    position = ((position + steps) % (i + 1)) + 1;
    if (position === 1) first = i + 1;
  }
  console.log(`Answer 2: ${first}`);
}
