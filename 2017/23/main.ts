#!/usr/bin/env -S deno run --allow-read

const inputText = await Deno.readTextFile(
  new URL("input.txt", import.meta.url),
);

enum Code {
  SET = "set",
  SUB = "sub",
  MUL = "mul",
  JNZ = "jnz",
}

type Instructions = Array<[Code, string | number, string | number]>;

const instructions = inputText.trim().split("\n").map((line) => {
  return line.match(/^(\w+)\s([-\w\d]+)\s?([-\w\d]+)?$/)!
    .slice(1, 4).map((s) => isNaN(Number(s)) ? s : Number(s));
}) as Instructions;

type Program = {
  register: { [key: string]: number };
  pointer: number;
  invoked: { [key: string]: number };
};

const tick = (program: Program): void => {
  const [code, x, y] = instructions[program.pointer];
  const { register } = program;
  const xv = typeof x === "string" ? (register[x] ?? 0) : x as number;
  const yv = typeof y === "string" ? (register[y] ?? 0) : y as number;
  program.invoked[code] ??= 0;
  program.invoked[code]++;
  switch (code) {
    case Code.SET: {
      register[x] = yv;
      break;
    }
    case Code.SUB: {
      register[x] -= yv;
      break;
    }
    case Code.MUL: {
      register[x] *= yv;
      break;
    }
    case Code.JNZ: {
      if (xv === 0) break;
      program.pointer += yv;
      return;
    }
  }
  program.pointer++;
};

{
  const program: Program = { pointer: 0, register: {}, invoked: {} };
  while (program.pointer >= 0 && program.pointer < instructions.length) {
    tick(program);
  }
  console.log(`Answer 1: ${program.invoked[Code.MUL]}`);
}

{
  const program: Program = {
    pointer: 0,
    register: { a: 1, b: 0, c: 0, d: 0, e: 0, f: 0, g: 0, h: 0 },
    invoked: {},
  };
  while (program.pointer !== 10) tick(program);
  let { b, c, d, h } = program.register;
  while (b !== c) {
    d = 2;
    while (d !== b) {
      if (b % d === 0) {
        h++;
        break;
      }
      d++;
    }
    b += 17;
  }
  console.log(`Answer 2: ${h + 1}`);
}
