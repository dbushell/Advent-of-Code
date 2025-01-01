#!/usr/bin/env -S deno run --allow-read

import { type Memory, newVM, proxyVM, runVM } from "../intcode.ts";
import { screen } from "../debug.ts";

const inputText = await Deno.readTextFile(
  new URL("input.txt", import.meta.url),
);

enum State {
  Input = "Input",
  Walking = "Walking",
}

// Toggle true for part 2
const RUN = false;

const getCommands = (run = false) => {
  const commands: Array<string> = [];
  for (const op of ["AND", "OR", "NOT"]) {
    const registers = ["A", "B", "C", "D", "T", "J"];
    if (run) registers.push("E", "F", "G", "H", "I");
    for (const r1 of registers) {
      for (const r2 of ["T", "J"].filter((r) => r !== r1)) {
        commands.push([op, r1, r2].join(" "));
      }
    }
  }
  return commands;
};

type Stringen = Generator<Array<string>>;

const combinations = function* (list: Array<string>): Stringen {
  if (list.length === 0) return;
  const generate = function* (start: number, length: number): Stringen {
    if (length === 0) {
      yield [];
      return;
    }
    loop: for (let i = start; i <= list.length - length; i++) {
      for (const combo of generate(i + 1, length - 1)) {
        for (let j = 0; j < combo.length - 3; j++) {
          const prefix = combo[j].slice(0, 3);
          if (combo.slice(j).every((value) => value.startsWith(prefix))) {
            break loop;
          }
        }
        yield [list[i], ...combo];
      }
    }
  };
  const min = RUN ? 7 : 5;
  const max = RUN ? 9 : 7;
  for (let length = min; length <= max; length++) {
    yield* generate(0, length);
  }
};

const shuffle = <T>(list: Array<T>) => {
  for (let i = list.length - 1; i >= 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
};

const commands = getCommands(RUN);
shuffle(commands);

for (const program of combinations(commands)) {
  const input = program
    .concat(`${RUN ? "RUN" : "WALK"}\n`)
    .join("\n")
    .split("")
    .map((c) => c.codePointAt(0)!);

  const memory: Memory = inputText.trim().split(",").map(Number);
  const vm = newVM(memory);
  let state = State.Input;
  let outputText = "";

  proxyVM(vm, undefined, () => {
    const code = vm.output.at(-1)!;
    if (code > 255) {
      console.log(input);
      console.log(program);
      console.log(`Answer ${RUN ? 2 : 1}: ${code}`);
      Deno.exit();
    }
    switch (state) {
      case State.Input:
        outputText += String.fromCodePoint(code);
        if (outputText.endsWith(":\n")) {
          vm.input.push(...input);
          state = State.Walking;
        }
        break;
      case State.Walking:
        outputText += String.fromCodePoint(code);
        break;
    }
  });
  await runVM(vm);

  screen.clear();
  // console.log(outputText);
  console.log(program);
}
