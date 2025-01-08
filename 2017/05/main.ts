#!/usr/bin/env -S deno run --allow-read

const inputText = await Deno.readTextFile(
  new URL("input.txt", import.meta.url),
);

const input = inputText.trim().split("\n").map((n) => [Number(n), 0]);

{
  const numbers = structuredClone(input);
  let i = 0;
  let steps = 0;
  while (i < numbers.length) {
    const jump = numbers[i][0] + numbers[i][1];
    numbers[i][1]++;
    i += jump;
    steps++;
  }
  console.log(`Answer 1: ${steps}`);
}

{
  const numbers = structuredClone(input);
  let i = 0;
  let steps = 0;
  while (i < numbers.length) {
    const jump = numbers[i][0] + numbers[i][1];
    if (jump >= 3) numbers[i][1]--;
    else numbers[i][1]++;
    i += jump;
    steps++;
  }
  console.log(`Answer 2: ${steps}`);
}
