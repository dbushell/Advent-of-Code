#!/usr/bin/env -S deno run --allow-read --allow-write
import { assert } from "jsr:@std/assert/assert";

const inputText = (await Deno.readTextFile(
  new URL("test2.txt", import.meta.url),
)).trim();

assert(inputText.length % 2, "Input must be odd");

const setCharAt = (input: string, i: number, char: string) =>
  input.substring(0, i) + char + input.substring(i + char.length);

// Step one generate id string
let diskText = "";
for (let i = 0, id = 0; i < inputText.length; i++) {
  diskText += new Array(Number.parseInt(inputText[i]))
    .fill(i % 2 ? "." : id++)
    .join("");
}

await Deno.writeTextFile(new URL("step1.txt", import.meta.url), diskText);

// Step two: condense block files
while (!/^[0-9]+\.+$/.test(diskText)) {
  const spaceIndex = diskText.indexOf(".");
  assert(spaceIndex > -1, "Out of space");
  let fileIndex = diskText.length - 1;
  while (diskText[fileIndex] === ".") {
    fileIndex--;
    assert(fileIndex >= 0, "No files");
  }
  diskText = setCharAt(diskText, spaceIndex, diskText[fileIndex]);
  diskText = setCharAt(diskText, fileIndex, ".");
}

await Deno.writeTextFile(new URL("step2.txt", import.meta.url), diskText);

// Step three: calculate checksum
let answerOne = 0;
for (let i = 0; i < diskText.length; i++) {
  if (diskText[i] === ".") break;
  answerOne += Number.parseInt(diskText[i]) * i;
}

console.log(`Answer 1: ${answerOne}`);
