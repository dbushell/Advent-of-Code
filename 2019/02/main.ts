#!/usr/bin/env -S deno run --allow-read

import { assert } from "jsr:@std/assert/assert";

const inputText = await Deno.readTextFile(
  new URL("input.txt", import.meta.url),
);
const inputProgram: Array<Opcode> = inputText.trim().split(",").map(Number);

enum Opcode {
  Add = 1,
  Multiply = 2,
  Halt = 99,
}

type Machine = {
  pointer: number;
  memory: Array<number>;
};

const execute = (vm: Machine): number => {
  // Read address
  const at = (position: number) => vm.memory[position];
  // Get parameters
  const p1 = at(vm.pointer + 1);
  const p2 = at(vm.pointer + 2);
  const p3 = at(vm.pointer + 3);
  // Next opcode
  const instruction = at(vm.pointer);
  switch (instruction) {
    case Opcode.Add:
      vm.memory[p3] = at(p1) + at(p2);
      return 4;
    case Opcode.Multiply:
      vm.memory[p3] = at(p1) * at(p2);
      return 4;
    case Opcode.Halt:
      return 0;
    default:
      console.log(vm);
      assert(false, "Bad intcode!");
  }
};

const run = (vm: Machine): Machine => {
  vm = structuredClone(vm);
  while (true) {
    const increment = execute(vm);
    if (increment === 0) break;
    vm.pointer += increment;
  }
  return vm;
};

{
  const inVM: Machine = { pointer: 0, memory: inputProgram };
  inVM.memory[1] = 12;
  inVM.memory[2] = 2;
  const outVM = run(inVM);
  const answerOne = outVM.memory[0];
  console.log(`Answer 1: ${answerOne}`);
}

/*************
 * PART TWO! *
 *************/

{
  let noun = 0;
  let verb = 0;
  loop: for (noun = 0; noun < 100; noun++) {
    for (verb = 0; verb < 100; verb++) {
      const inVM: Machine = { pointer: 0, memory: [...inputProgram] };
      inVM.memory[1] = noun;
      inVM.memory[2] = verb;
      const outVM = run(inVM);
      if (outVM.memory[0] === 19690720) {
        break loop;
      }
    }
  }
  const answerTwo = 100 * noun + verb;
  console.log(`Answer 2: ${answerTwo}`);
}
