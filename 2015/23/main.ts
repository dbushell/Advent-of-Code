#!/usr/bin/env -S deno run --allow-read

import { assert } from "jsr:@std/assert/assert";

const inputText = await Deno.readTextFile(
  new URL("input.txt", import.meta.url),
);

enum Opcode {
  HLF = "hlf",
  TPL = "tpl",
  INC = "inc",
  JMP = "jmp",
  JIE = "jie",
  JIO = "jio",
}

type Machine = {
  a: number;
  b: number;
  pointer: number;
  instructions: Array<[Opcode, "a" | "b", number]>;
};

const execute = (
  vm: Machine,
  code: Opcode,
  register: "a" | "b" = "a",
  offset: number = 0,
): number => {
  if (code !== Opcode.JMP) {
    assert(register, "Register not specified");
  }
  if (code.startsWith("j")) {
    assert(offset !== 0, "Offset not specified");
  }
  switch (code) {
    case Opcode.HLF:
      assert(vm[register] % 2 === 0, "HLR register not even?");
      vm[register] /= 2;
      break;
    case Opcode.TPL:
      vm[register] *= 3;
      break;
    case Opcode.INC:
      vm[register] += 1;
      break;
    case Opcode.JMP:
      return offset;
    case Opcode.JIE:
      if (vm[register] % 2 === 0) return offset;
      break;
    case Opcode.JIO:
      if (vm[register] === 1) return offset;
      break;
  }
  return 1;
};

const run = (vm: Machine): number => {
  while (vm.pointer < vm.instructions.length) {
    const next = execute(vm, ...vm.instructions[vm.pointer]);
    vm.pointer += next;
  }
  return vm.b;
};

const parse = (input: string = inputText): Machine => {
  const vm: Machine = { a: 0, b: 0, pointer: 0, instructions: [] };
  for (const line of input.split("\n")) {
    const match = line.match(/^([a-z]{3,})\s?(?:(a|b))?(?:, )?(?:([-+]?\d+))?/);
    if (!match) continue;
    const [code, register, jump] = match.slice(1, 4);
    vm.instructions.push([
      code as Opcode,
      register as "a" | "b",
      Number.parseInt(jump ?? 0),
    ]);
  }
  return vm;
};

{
  const vm = parse();
  console.log(`Answer 1: ${run(vm)}`);
}
{
  const vm = parse();
  vm.a = 1;
  console.log(`Answer 2: ${run(vm)}`);
}
