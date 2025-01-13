#!/usr/bin/env -S deno run --allow-read

const inputText = await Deno.readTextFile(
  new URL("input.txt", import.meta.url),
);

const numbers = inputText.trim().split("\n").map((n) => Number.parseInt(n));

{
  let frequency = 0;
  numbers.forEach((n) => frequency += n);
  console.log(`Answer 1: ${frequency}`);
}

{
  const frequencies = new Set<number>([0]);
  let frequency = 0;
  while (true) {
    numbers.forEach((n) => {
      frequency += n;
      if (frequencies.has(frequency)) {
        console.log(`Answer 2: ${frequency}`);
        Deno.exit();
      }
      frequencies.add(frequency);
    });
  }
}
