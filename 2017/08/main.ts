#!/usr/bin/env -S deno run --allow-read

const inputText = await Deno.readTextFile(
  new URL("input.txt", import.meta.url),
);

enum Code {
  INC = "inc",
  DEC = "dec",
}

enum Condition {
  GT = ">",
  LT = "<",
  GTE = ">=",
  LTE = "<=",
  EQ = "==",
  NEQ = "!=",
}

type Instruction = {
  code: Code;
  condition: Condition;
  r1: string;
  r2: string;
  n1: number;
  n2: number;
};

const instructions: Array<Instruction> = [];
const register: { [key: string]: number } = {};
let highest = -Infinity;

// Parse input instructions
for (const line of inputText.split("\n")) {
  const match = line.match(
    /^(\w+) (inc|dec) (-?\d+) if (\w+) ([=!><]+) (-?\d+)$/,
  );
  if (!match) continue;
  const [r1, code, n1, r2, condition, n2] = match.slice(1, 7);
  instructions.push({
    code,
    condition,
    r1,
    r2,
    n1: Number.parseInt(n1),
    n2: Number.parseInt(n2),
  } as Instruction);
}

// Return true if condition matches
const evalulate = ({ condition, r2, n2 }: Instruction) => {
  const value = register[r2] ?? 0;
  switch (condition) {
    case Condition.GT:
      return value > n2;
    case Condition.LT:
      return value < n2;
    case Condition.GTE:
      return value >= n2;
    case Condition.LTE:
      return value <= n2;
    case Condition.EQ:
      return value === n2;
    case Condition.NEQ:
      return value !== n2;
  }
};

for (const instruction of instructions) {
  const { code, r1, r2, n1 } = instruction;
  register[r1] ??= 0;
  register[r2] ??= 0;
  if (!evalulate(instruction)) continue;
  switch (code) {
    case Code.INC:
      register[r1] += n1;
      break;
    case Code.DEC:
      register[r1] -= n1;
      break;
  }
  highest = Math.max(highest, ...Object.values(register));
}

console.log(`Answer 1: ${Math.max(...Object.values(register))}`);
console.log(`Answer 2: ${highest}`);
