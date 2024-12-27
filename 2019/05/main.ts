#!/usr/bin/env -S deno run --allow-read

import { assert } from "jsr:@std/assert/assert";

const inputText = await Deno.readTextFile(
  new URL("input.txt", import.meta.url),
);
const inputProgram: Array<number> = inputText.trim().split(",").map(Number);

enum Opcode {
  Add = 1,
  Multiply = 2,
  Input = 3,
  Output = 4,
  JumpTrue = 5,
  JumpFalse = 6,
  LessThan = 7,
  Equals = 8,
  Halt = 99,
}

enum Mode {
  Position = 0,
  Immediate = 1,
}

type Machine = {
  pointer: number;
  memory: Array<number>;
  output: Array<number>;
  input: Array<number>;
};

export const newVM = (): Machine => ({
  pointer: 0,
  memory: [...inputProgram],
  output: [],
  input: [],
});

const execute = (vm: Machine): number | null => {
  // Read address
  const at = (position: number) => vm.memory[position];
  // Get instruction opcode and parameter modes
  const digits = String(at(vm.pointer)).padStart(5, "0");
  const opcode = Number(digits.slice(3));
  // Return parameter write address
  const write = (position: number): number => {
    const parameter = at(vm.pointer + position);
    return parameter;
  };
  // Return parameter read address
  const read = (position: number): number => {
    const mode: Mode = Number(digits.at(3 - position));
    const parameter = at(vm.pointer + position);
    switch (mode) {
      case Mode.Position:
        return at(parameter);
      case Mode.Immediate:
        return parameter;
      default:
        assert(false, "Bad parameter mode!");
    }
  };
  switch (opcode) {
    case Opcode.Add:
      vm.memory[write(3)] = read(1) + read(2);
      return 4;
    case Opcode.Multiply:
      vm.memory[write(3)] = read(1) * read(2);
      return 4;
    case Opcode.Input:
      assert(vm.input.length, "Out of input!");
      vm.memory[write(1)] = vm.input.shift()!;
      return 2;
    case Opcode.Output:
      vm.output.push(read(1));
      return 2;
    case Opcode.JumpTrue:
      if (read(1) !== 0) {
        vm.pointer = read(2);
        return 0;
      }
      return 3;
    case Opcode.JumpFalse:
      if (read(1) === 0) {
        vm.pointer = read(2);
        return 0;
      }
      return 3;
    case Opcode.LessThan:
      vm.memory[write(3)] = read(1) < read(2) ? 1 : 0;
      return 4;
    case Opcode.Equals:
      vm.memory[write(3)] = read(1) === read(2) ? 1 : 0;
      return 4;
    case Opcode.Halt:
      return null;
    default:
      console.log(vm);
      assert(false, "Bad intcode!");
  }
};

export const runVM = (vm: Machine): Machine => {
  vm = structuredClone(vm);
  while (true) {
    const increment = execute(vm);
    if (increment === null) break;
    vm.pointer += increment;
  }
  return vm;
};

if (import.meta.main) {
  const inVM: Machine = newVM();
  inVM.input = [1];
  const outVM = runVM(inVM);
  const answerOne = outVM.output.at(-1);
  console.log(`Answer 1: ${answerOne}`);
}

// /*************
//  * PART TWO! *
//  *************/

if (import.meta.main) {
  const inVM: Machine = newVM();
  inVM.input = [5];
  const outVM = runVM(inVM);
  const answerOne = outVM.output.at(-1);
  console.log(`Answer 1: ${answerOne}`);
}
