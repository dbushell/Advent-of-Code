#!/usr/bin/env -S deno run --allow-read

const inputText = await Deno.readTextFile(
  new URL("input.txt", import.meta.url),
);

const next = (input: string): string => {
  let out = "";
  let count = 0;
  let char = input[0];
  for (let i = 0; i < input.length; i++) {
    if (input[i] === char) {
      count++;
    } else {
      out += count + char;
      count = 1;
      char = input[i];
    }
  }
  return out + count + char;
};

{
  let input = inputText.trim();
  let answerOne = 0;
  for (let i = 0; i < 50; i++) {
    input = next(input);
    if (i === 39) answerOne = input.length;
  }
  const answerTwo = input.length;
  console.log(`Answer 1: ${answerOne}`);
  console.log(`Answer 2: ${answerTwo}`);
}
