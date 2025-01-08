#!/usr/bin/env -S deno run --allow-read

const inputText = await Deno.readTextFile(
  new URL("input.txt", import.meta.url),
);

enum State {
  Garbage = 0,
  Group = 1,
}

let state = State.Group;
let score = 0;
let depth = 0;
let garbage = 0;

for (let i = 0; i < inputText.length; i++) {
  const char = inputText[i];
  // Skip next character
  if (char === "!") {
    i++;
    continue;
  }
  if (state === State.Garbage) {
    // End garbage state
    if (char === ">") {
      state = State.Group;
    } else {
      garbage++;
    }
  } else if (state === State.Group) {
    // Start garbage state
    if (char === "<") {
      state = State.Garbage;
    } // Enter group
    else if (char === "{") {
      depth++;
      score += depth;
    } // Leave group
    else if (char === "}") {
      depth--;
    }
  }
}

console.log(`Answer 1: ${score}`);
console.log(`Answer 2: ${garbage}`);
