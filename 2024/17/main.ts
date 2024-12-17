#!/usr/bin/env -S deno run --allow-read

import { assert } from "jsr:@std/assert/assert";

const inputText = await Deno.readTextFile(
  new URL("input.txt", import.meta.url),
);

enum Opcode {
  ADV = 0,
  BXL = 1,
  BST = 2,
  JNZ = 3,
  BXC = 4,
  OUT = 5,
  BDV = 6,
  CDV = 7,
}

type Instruction = {
  opcode: Opcode;
  operand: number;
};

type Register = {
  key: "A" | "B" | "C";
  value: number;
};

type State = {
  A: Register;
  B: Register;
  C: Register;
  program: Array<Instruction>;
  pointer: number;
  output: Array<number>;
  history: Array<Instruction>;
  controller: AbortController;
  clockRate: number;
  target?: boolean;
};

// Codes to help debug
const codes: Readonly<{ [key in Opcode]: string }> = {
  [Opcode.ADV]: "ADV",
  [Opcode.BXL]: "BXL",
  [Opcode.BST]: "BST",
  [Opcode.JNZ]: "JNZ",
  [Opcode.BXC]: "BXC",
  [Opcode.OUT]: "OUT",
  [Opcode.BDV]: "BDV",
  [Opcode.CDV]: "CDV",
};

// Print helpers
enum Color {
  Black = 30,
  Red = 31,
  Green = 32,
  Yellow = 33,
  Blue = 34,
  Purple = 35,
  Cyan = 36,
  White = 37,
}

const encoder = new TextEncoder();
const write = (text: string) => Deno.stdout.writeSync(encoder.encode(text));
const color = (
  text: unknown,
  color: Color,
  bold?: boolean,
) => (`\x1b[${bold ? "1" : "0"};${color}m${text}\x1b[0m`);

// Parse the puzzle text input
const parse = (input: string, state?: State): State => {
  state ??= {
    A: { key: "A", value: 0 },
    B: { key: "B", value: 0 },
    C: { key: "C", value: 0 },
    program: [],
    pointer: 0,
    output: [],
    history: [],
    controller: new AbortController(),
    clockRate: 0,
  };
  for (const line of input.split("\n")) {
    // Validate registers
    if (line.startsWith("Register")) {
      const match = line.match(/([ABC]): (\d+)$/) as
        | [string, Register["key"], string]
        | null;
      assert(match, "Bad register input");
      assert(!Number.isNaN(match[2]), "Bad register value");
      state[match[1]] = { key: match[1], value: Number.parseInt(match[2]) };
      continue;
    }
    // Validate instructions
    if (line.startsWith("Program")) {
      for (const match of line.matchAll(/(\d+),(\d+)/g)) {
        const instruction: Instruction = {
          opcode: Number.parseInt(match[1]),
          operand: Number.parseInt(match[2]),
        };
        assert(instruction.opcode >= 0, "Opcode below zero");
        assert(instruction.opcode <= 7, "Opcode below eight");
        state.program.push(instruction);
      }
      continue;
    }
  }
  return state;
};

// Return the instruction's operand value
const getOperand = (state: State, instruction: Instruction): number => {
  const { opcode, operand } = instruction;
  switch (opcode) {
    case Opcode.ADV:
    case Opcode.BST:
    case Opcode.OUT:
    case Opcode.BDV:
    case Opcode.CDV:
      if (operand >= 0 && operand <= 3) return operand;
      if (operand === 4) return state.A.value;
      if (operand === 5) return state.B.value;
      if (operand === 6) return state.C.value;
      break;
    case Opcode.BXL:
    case Opcode.JNZ:
    case Opcode.BXC:
      return operand;
  }
  assert(false, "Invalid operand");
};

const execADV = (state: State, instruction: Instruction) => {
  const operand = getOperand(state, instruction);
  const result = state.A.value / Math.pow(2, operand);
  state.A.value = Math.trunc(result);
  state.pointer += 2;
};

const execBDV = (state: State, instruction: Instruction) => {
  const operand = getOperand(state, instruction);
  const result = state.A.value / Math.pow(2, operand);
  state.B.value = Math.trunc(result);
  state.pointer += 2;
};

const execCDV = (state: State, instruction: Instruction) => {
  const operand = getOperand(state, instruction);
  const result = state.A.value / Math.pow(2, operand);
  state.C.value = Math.trunc(result);
  state.pointer += 2;
};

const execBXL = (state: State, instruction: Instruction) => {
  const operand = getOperand(state, instruction);
  // const result = state.B.value ^ operand;
  const result = Number(BigInt(state.B.value) ^ BigInt(operand));
  state.B.value = result;
  state.pointer += 2;
};

const execBST = (state: State, instruction: Instruction) => {
  const operand = getOperand(state, instruction);
  const result = operand % 8;
  state.B.value = result;
  state.pointer += 2;
};

const execJNZ = (state: State, instruction: Instruction) => {
  const operand = getOperand(state, instruction);
  if (state.A.value === 0) {
    state.pointer += 2;
  } else {
    assert(operand !== state.pointer, "JNZ loop");
    state.pointer = operand;
  }
};

const execBXC = (state: State, instruction: Instruction) => {
  const _operand = getOperand(state, instruction);
  // const result = state.B.value ^ state.C.value;
  const result = Number(BigInt(state.B.value) ^ BigInt(state.C.value));
  state.B.value = result;
  state.pointer += 2;
};

const execOUT = (state: State, instruction: Instruction) => {
  const operand = getOperand(state, instruction);
  const result = operand % 8;
  state.output.push(result);
  state.pointer += 2;
};

// Run next instruction
const exec = (state: State) => {
  const index = state.pointer / 2;
  const instruction = state.program[index];
  const { opcode, operand } = instruction;
  state.history.push({ opcode, operand });
  if (state.clockRate) {
    write("\x1b[2J\x1b[H\n");
    write(color(`A: ${state.A.value}\n`, Color.Yellow));
    write(color(`B: ${state.B.value}\n`, Color.Green));
    write(color(`C: ${state.C.value}\n`, Color.Cyan));
    {
      const { opcode, operand } = state.history.at(-2) ?? {};
      const code = `${opcode ?? -1}${opcode ? ` ${codes[opcode]}` : ``}`;
      write(color(`Prev: [${code}, ${operand ?? -1}]\n`, Color.Blue));
    }
    const code = `${opcode} ${codes[opcode]}`;
    write(color(`Next: [${code}, ${operand}]\n`, Color.Purple, true));
    write("\n");
  }
  switch (opcode) {
    case Opcode.ADV:
      execADV(state, instruction);
      break;
    case Opcode.BXL:
      execBXL(state, instruction);
      break;
    case Opcode.BST:
      execBST(state, instruction);
      break;
    case Opcode.JNZ:
      execJNZ(state, instruction);
      break;
    case Opcode.BXC:
      execBXC(state, instruction);
      break;
    case Opcode.OUT:
      execOUT(state, instruction);
      break;
    case Opcode.BDV:
      execBDV(state, instruction);
      break;
    case Opcode.CDV:
      execCDV(state, instruction);
      break;
  }
};

// Execute all instructions
const run = async (state: State): Promise<State["output"]> => {
  while ((state.pointer / 2) < state.program.length) {
    if (state.controller.signal.aborted) break;
    assert(state.pointer % 2 === 0, "Pointer uneven");
    if (state.clockRate) {
      await new Promise((resolve) => setTimeout(resolve, state.clockRate));
    }
    exec(state);
    if (state.target) {
      if (state.output.length > (state.program.length * 2)) {
        return [];
      }
      if (state.output.length && (state.output.length % 2) === 0) {
        const [opcode, operand] = state.output.slice(-2);
        const instruction = state.program.at((state.output.length / 2) - 1);
        if (opcode !== instruction?.opcode) return [];
        if (operand !== instruction?.operand) return [];
      }
    }
  }
  return state.output;
};

{
  const state: State = parse(inputText);
  state.clockRate = 1000 / 120;
  const shutdown = () => {
    state.controller.abort();
    // Show the cursor
    write("\x1b[?25h");
  };
  Deno.addSignalListener("SIGTERM", shutdown);
  Deno.addSignalListener("SIGINT", shutdown);
  // Hide cursor
  write("\x1b[?25l");
  write("\x1b[2J\x1b[H");
  const output = await run(state).catch((err) => {
    console.log(err);
    state.controller.abort();
    return [];
  });
  shutdown();
  write(color(`Answer 1: ${output.join(",")}\n`, Color.Green, true));
}

{
  const state: State = parse(inputText);
  const target = state.program.map(({ opcode, operand }) => [opcode, operand])
    .flat().join(",");

  // Correct answers found via pattern
  // 164541026365117
  // 164541017976765
  // 164541017976509
  let answerTwo = 0;
  for (let i = 164541026365117; i > 0; i -= 256) {
    const state: State = parse(inputText);
    state.target = true;
    state.A.value = i;
    await run(state);
    const output = state.output.join(",");
    if (output === target) {
      if ((answerTwo - i) == 256) {
        answerTwo = i;
        break;
      }
      answerTwo = i;
    }
  }

  write(
    color(
      `\nAnswer 2: ${answerTwo}\n`,
      answerTwo > 0 ? Color.Green : Color.Red,
      true,
    ),
  );
}

// Find pattern for answer two
// {
// let i = 23948989;
// let i = 164541026365117;
// let j = 0;
// while (i) {
//   i -= (j++ % 2 === 0) ? 8388352 : 256;
//   const state: State = parse(inputText);
//   state.target = true;
//   state.A.value = i;
//   await run(state);
//   const output = state.output.join(",");
//   if (output === target) {
//     answerTwo = i;
//     console.log(i, `\t${output}`);
//   }
// }
// for (let i = 10000000; i < 10000000000; i++) {
//   const state: State = parse(inputText);
//   state.target = true;
//   state.A.value = i;
//   await run(state);
//   const output = state.output.join(",");
//   if (output.length >= 16) {
//     console.log(i, `\t${output}`);
//   }
//   if (output === target) {
//     break;
//   }
// }
// }
