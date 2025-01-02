#!/usr/bin/env -S deno run --allow-read

import { screen, write } from "../debug.ts";
import { type Memory, newVM, proxyVM, runVM } from "../intcode.ts";

const inputText = await Deno.readTextFile(
  new URL("input.txt", import.meta.url),
);

enum State {
  Explore = 1,
  Checkpoint = 2,
  PressureFloor = 3,
  Proceed = 4,
}

const commands = [
  "north",
  "take easter egg",
  "east",
  "take astrolabe",
  "south",
  "take space law space brochure",
  "north",
  "north",
  "north",
  "take fuel cell",
  "south",
  "south",
  "west",
  "north",
  "take manifold",
  "north",
  "north",
  "take hologram",
  "north",
  "take weather machine",
  "north",
  "take antenna",
  "west",
  "inv",
];

const items = commands
  .filter((c) => c.includes("take"))
  .map((c) => c.replace("take ", ""));

const memory: Memory = inputText.trim().split(",").map(Number);
const vm = newVM(memory);
const checkpoint: Array<string> = [...items];
const history = [];
let state = State.Explore;
let output = "";
let input = "";

const generate = function (
  start: number,
  length: number,
): Array<Array<string>> {
  if (length === 0) return [[]];
  const result: Array<Array<string>> = [];
  for (let i = start; i <= checkpoint.length - length; i++) {
    for (const combo of generate(i + 1, length - 1)) {
      for (let j = 0; j < combo.length - 3; j++) {
        const prefix = combo[j].slice(0, 3);
        if (combo.slice(j).every((value) => value.startsWith(prefix))) {
          return result;
        }
      }
      result.push([checkpoint[i], ...combo]);
    }
  }
  return result;
};

const variations: Array<Array<string>> = [];
for (let length = 1; length <= checkpoint.length; length++) {
  variations.push(...generate(0, length));
}

const command = (command: string) => {
  vm.input.push(...command.split("").map((c) => c.charCodeAt(0)), 10);
};

if (!Deno.args.includes("--free")) {
  commands.map(command);
}

const frame = () => {
  screen.clear();
  write(`${output.slice(-1000)}\n`);
  write(`-> ${input}`);
};

proxyVM(vm, undefined, () => {
  const code = vm.output.at(-1)!;
  if (code < 255) {
    output += String.fromCodePoint(code);
  }
  if (Deno.args.includes("--free")) {
    frame();
    return;
  }
  if (state === State.Proceed) {
    frame();
    return;
  }
  if (state === State.Explore) {
    if (output.endsWith("== Security Checkpoint ==")) {
      state = State.Checkpoint;
    }
  }
  if (state === State.PressureFloor) {
    if (output.includes("Analysis complete! You may proceed.")) {
      state = State.Proceed;
    } else if (output.endsWith("== Security Checkpoint ==")) {
      state = State.Checkpoint;
    }
  }
  if (state === State.Checkpoint) {
    state = State.PressureFloor;
    checkpoint.map((item) => command(`drop ${item}`));
    checkpoint.length = 0;
    checkpoint.push(...variations.pop()!);
    checkpoint.map((item) => command(`take ${item}`));
    command(`south`);
  }
});

runVM(vm);

Deno.stdin.setRaw(true);
const decoder = new TextDecoder();
for await (const code of Deno.stdin.readable) {
  if (code[0] === 3 || code[0] === 4) {
    console.log(history);
    Deno.exit();
  }
  if (code[0] === 13) {
    vm.input.push(...input.split("").map((c) => c.codePointAt(0)!));
    vm.input.push(10);
    history.push(input);
    input = "";
  } else if (code[0] === 127) {
    input = input.slice(0, -1);
  } else {
    input += decoder.decode(code);
  }
  frame();
}
