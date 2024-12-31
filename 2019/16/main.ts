#!/usr/bin/env -S deno run --allow-read

const inputText = await Deno.readTextFile(
  new URL("input.txt", import.meta.url),
);

const baseSignal = inputText.trim().split("").map(Number);

const basePattern = [0, 1, 0, -1];

// Store addition values
const cache = new Map<number, number>();

const nextPhase = (input: Array<number>, addition = false): Array<number> => {
  const output: Array<number> = [];
  cache.clear();
  for (let i = 0; i < input.length; i++) {
    let value = 0;
    addition ||= (i + i) >= input.length - 1;
    if (addition) {
      if (cache.has(i)) {
        value += cache.get(i)!;
      } else {
        for (let k = input.length - 1; k >= i; k--) {
          value += input[k];
          cache.set(k, value);
        }
      }
    } else {
      for (let k = i; k < input.length; k++) {
        let multi = basePattern[(Math.floor((k + 1) / (i + 1))) % 4];
        if (k === 0) multi = 0;
        if (i === 0 && k === 0) multi = 1;
        value += input[k] * multi;
      }
    }
    output.push(Math.abs(value % 10));
  }
  return output;
};

{
  let next = baseSignal;
  for (let i = 0; i < 100; i++) {
    next = nextPhase(next);
  }
  const answerOne = next.join("").substring(0, 8);
  console.log(`Answer 1: ${answerOne}`);
}

/*************
 * PART TWO! *
 *************/

{
  // Get offset
  const signal: Array<number> = [];
  for (let i = 0; i < 10_000; i++) signal.push(...baseSignal);
  const offset = Number(signal.slice(0, 7).join(""));
  // Setup first phase
  let next: Array<number> = new Array(signal.length - offset);
  for (let i = 0; i < next.length; i++) {
    next[i] = signal[i + offset] % next.length;
  }
  for (let i = 0; i < 100; i++) {
    next = nextPhase(next, true);
  }
  const answerTwo = next.join("").substring(0, 8);
  console.log(`Answer 2: ${answerTwo}`);
}
