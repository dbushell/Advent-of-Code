#!/usr/bin/env -S deno run --allow-read

const inputText = await Deno.readTextFile(
  new URL("input.txt", import.meta.url),
);

let answerOne = 0;
let answerTwo = 0;

for (const char of inputText) {
  if (char === "(") {
    answerOne++;
  }
  if (char === ")") {
    answerOne--;
  }
}

for (let i = 0; i < inputText.length; i++) {
  if (inputText[i] === "(") {
    answerTwo++;
  }
  if (inputText[i] === ")") {
    answerTwo--;
  }
  if (answerTwo === -1) {
    answerTwo = i + 1;
    break;
  }
}

console.log(`Answer one: ${answerOne}`);
console.log(`Answer two: ${answerTwo}`);
