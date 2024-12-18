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
  performance.mark("a");
  for (let i = 0; i < 50; i++) {
    input = next(input);
    if (i === 39) answerOne = input.length;
  }
  performance.mark("b");
  const answerTwo = input.length;
  console.log(`Answer 1: ${answerOne}`);
  console.log(`Answer 2: ${answerTwo}`);
  const { duration } = performance.measure("c", "a", "b");
  console.log(`${duration.toFixed(2)}ms`);
}

{
  let input = inputText.trim();
  let answerOne = 0;
  performance.mark("a");
  for (let i = 0; i < 50; i++) {
    input = input.replaceAll(/(\d)\1*/g, (match) => (match.length + match[0]));
    if (i === 39) answerOne = input.length;
  }
  performance.mark("b");
  const answerTwo = input.length;
  console.log(`Answer 1: ${answerOne}`);
  console.log(`Answer 2: ${answerTwo}`);
  const { duration } = performance.measure("c", "a", "b");
  console.log(`${duration.toFixed(2)}ms`);
}
