#!/usr/bin/env -S deno run --allow-read

const inputText = await Deno.readTextFile(
  new URL("input.txt", import.meta.url),
);

enum Code {
  SND = "snd",
  SET = "set",
  ADD = "add",
  MUL = "mul",
  MOD = "mod",
  RCV = "rcv",
  JGZ = "jgz",
}

type Instructions = Array<[Code, string | number, string | number]>;

const instructions = inputText.trim().split("\n").map((line) => {
  return line.match(/^(\w+)\s([-\w\d]+)\s?([-\w\d]+)?$/)!
    .slice(1, 4).map((s) => isNaN(Number(s)) ? s : Number(s));
}) as Instructions;

type Program = {
  register: { [key: string]: number };
  pointer: number;
  queue: Array<number>;
  send?: Program;
};

const tick = (program: Program): void | number => {
  const [code, x, y] = instructions[program.pointer];
  const { register } = program;
  const xv = typeof x === "string" ? (register[x] ?? 0) : x as number;
  const yv = typeof y === "string" ? (register[y] ?? 0) : y as number;
  switch (code) {
    case Code.SET: {
      register[x] = yv;
      break;
    }
    case Code.ADD: {
      register[x] += yv;
      break;
    }
    case Code.MUL: {
      register[x] *= yv;
      break;
    }
    case Code.MOD: {
      register[x] %= yv;
      break;
    }
    case Code.SND: {
      if (program.send) {
        // Answer 2
        program.send.queue.push(xv);
        program.register["answer"]++;
      } else {
        // Answer 1
        program.register["answer"] = xv;
      }
      break;
    }
    case Code.RCV: {
      if (program.send) {
        // Answer 2
        if (program.queue.length === 0) return -1;
        register[x] = program.queue.shift()!;
      } else {
        // Answer 1
        if (xv !== 0) {
          program.pointer = -1;
          return;
        }
      }
      break;
    }
    case Code.JGZ: {
      if (xv > 0) {
        program.pointer += yv;
        return;
      }
    }
  }
  program.pointer++;
};

{
  const program: Program = { pointer: 0, register: { answer: 0 }, queue: [] };
  while (program.pointer >= 0 && program.pointer < instructions.length) {
    tick(program);
  }
  console.log(`Answer 1: ${program.register["answer"]}`);
}

{
  const p1: Program = { pointer: 0, register: { p: 0, answer: 0 }, queue: [] };
  const p2: Program = structuredClone(p1);
  p2.register["p"] = 1;
  p1.send = p2;
  p2.send = p1;
  const run = async (p: Program) => {
    while (p.pointer >= 0 && p.pointer < instructions.length) {
      if (tick(p) === -1) {
        await new Promise((resolve) => setTimeout(resolve, 1));
        if (!p.queue.length) throw new Error();
      }
    }
  };
  await Promise.allSettled([run(p1), run(p2)]);
  console.log(`Answer 2: ${p2.register["answer"]}`);
}
