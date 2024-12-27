#!/usr/bin/env -S deno run --allow-read

import { assert } from "jsr:@std/assert/assert";

export type Deferred<T> = ReturnType<typeof Promise.withResolvers<T>>;

export enum Opcode {
  Add = 1,
  Multiply = 2,
  Input = 3,
  Output = 4,
  JumpTrue = 5,
  JumpFalse = 6,
  LessThan = 7,
  Equals = 8,
  Relative = 9,
  Halt = 99,
}

export enum Mode {
  Position = 0,
  Immediate = 1,
  Relative = 2,
}

export type Machine = {
  id: string;
  pointer: number;
  relative: number;
  input: Array<number>;
  output: Array<number>;
  memory: Array<number>;
  halted: Deferred<boolean>;
};

// VM instruction execute returns
export const halt = Symbol.for("halt");
export const wait = Symbol.for("wait");
export type Return = number | typeof halt | typeof wait;

/** Create a new intcode virtual machine */
export const newVM = (memory: Array<number> = [], id = "vm"): Machine => ({
  id,
  pointer: 0,
  relative: 0,
  output: [],
  input: [],
  memory: [...memory],
  halted: Promise.withResolvers<boolean>(),
});

/** Link output of vm A to input of vm B */
export const linkVM = (a: Machine, b: Machine) => {
  const proxy = new Proxy<Array<number>>(a.output, {});
  a.output = proxy;
  b.input = proxy;
};

export const execute = (vm: Machine): Return => {
  // Read address
  const at = (position: number) => vm.memory[position] ?? 0;
  // Get instruction opcode and parameter modes
  const digits = String(at(vm.pointer)).padStart(5, "0");
  const opcode = Number(digits.slice(3));
  // Return parameter write address
  const write = (position: number): number => {
    assert(position >= 0, "Write out of bounds!");
    const mode: Mode = Number(digits.at(3 - position));
    const parameter = at(vm.pointer + position);
    switch (mode) {
      case Mode.Position:
        return parameter;
      case Mode.Relative:
        return parameter + vm.relative;
      default:
        assert(false, "Bad write parameter mode!");
    }
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
      case Mode.Relative:
        return at(parameter + vm.relative);
      default:
        assert(false, "Bad read parameter mode!");
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
      if (!vm.input.length) return wait;
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
    case Opcode.Relative:
      vm.relative += read(1);
      return 2;
    case Opcode.Halt:
      return halt;
    default:
      console.log(vm);
      assert(false, "Bad intcode!");
  }
};

/** Execute all instructions */
export const runVM = (vm: Machine): Promise<boolean> => {
  const start = () => {
    let increment: Return;
    while (true) {
      increment = execute(vm);
      // Program ended
      if (increment === halt) {
        vm.halted.resolve(true);
        break;
      }
      // Waiting for input
      if (increment === wait) {
        break;
      }
      vm.pointer += increment;
    }
    // Poll for input
    if (increment === wait) {
      setTimeout(start, 0);
    }
  };
  start();
  return vm.halted.promise;
};
