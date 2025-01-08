#!/usr/bin/env -S deno run --allow-read

const inputText = (await Deno.readTextFile(
  new URL("input.txt", import.meta.url),
)).trim();

const numbers = inputText.split("").map(Number);
const { length } = numbers;

{
  // Add start to end for circular final sum
  numbers.push(numbers[0]);
  let sum = 0;
  for (let i = 0; i < length - 1; i++) {
    if (numbers[i] === numbers[i + 1]) {
      sum += numbers[i];
    }
  }
  console.log(`Answer 1: ${sum}`);
  numbers.pop();
}

{
  let sum = 0;
  for (let i = 0; i < length; i++) {
    let j = i + (length / 2);
    if (j >= length) j = j % length;
    if (numbers[i] === numbers[j]) {
      sum += numbers[i];
    }
  }
  console.log(`Answer 2: ${sum}`);
}
