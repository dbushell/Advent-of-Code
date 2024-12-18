#!/usr/bin/env -S deno run --allow-read

import { assert } from "jsr:@std/assert/assert";

const inputText = await Deno.readTextFile(
  new URL("input.txt", import.meta.url),
);

let midLength = 0;
let minLength = 0;
let maxLength = 0;

const decode = (value: string): string => {
  let out = "";
  for (let i = 0; i < value.length; i++) {
    const char = value[i];
    const peek1 = value[i + 1];
    const peek2 = value[i + 2];
    const peek3 = value[i + 3];
    if (i === 0 && char === '"') continue;
    if (i === value.length - 1 && char === '"') continue;
    if (char === "\\") {
      if (peek1 === "\\" || peek1 === '"') {
        out += peek1;
        i++;
        continue;
      }
      if (peek1 === "x") {
        assert(peek2, "Invalid hexadecimal");
        assert(peek3, "Invalid hexadecimal");
        out += String.fromCharCode(Number.parseInt(peek2 + peek3, 16));
        i += 3;
        continue;
      }
    }
    out += char;
  }
  return out;
};

const encode = (value: string): string => {
  let out = "";
  for (let i = 0; i < value.length; i++) {
    const char = value[i];
    if (char === '"') {
      out += '\\"';
      continue;
    }
    if (char === "\\") {
      out += "\\\\";
      continue;
    }
    out += char;
  }
  return `"${out}"`;
};

for (let line of inputText.split("\n")) {
  line = line.trim();
  if (line.length === 0) continue;
  midLength += line.length;
  assert(/^".+"$/.test(line), "Invalid line input");
  minLength += decode(line).length;
  maxLength += encode(line).length;
}

const answerOne = midLength - minLength;
const answerTwo = maxLength - midLength;

console.log(`Answer 1: ${answerOne}`);
console.log(`Answer 2: ${answerTwo}`);
