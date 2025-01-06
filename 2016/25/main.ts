#!/usr/bin/env -S deno run --allow-read

const inputText = await Deno.readTextFile(
  new URL("input.txt", import.meta.url),
);

enum Code {
  CPY = "cpy",
  INC = "inc",
  DEC = "dec",
  JNZ = "jnz",
  TGL = "tgl",
  OUT = "out",
}

type Program = Array<[Code, string | number, string | number]>;

const program = inputText.trim().split("\n").map((line) => {
  return line.match(/^(\w+)\s([-\w\d]+)\s?([-\w\d]+)?$/)!
    .slice(1, 4).map((s) => isNaN(Number(s)) ? s : Number(s));
}) as Program;

const run = (input: number): boolean => {
  let output = "";
  const register: { [key: string]: number } = { a: input, b: 0, c: 0, d: 0 };
  for (let i = 0; i < program.length; i++) {
    const [code, x, y] = program[i];
    switch (code) {
      case Code.OUT: {
        const j = Number.isInteger(x) ? x : register[x];
        output += j;
        if (
          output.length >= 4 &&
          output.length % 2 === 0 &&
          !/(01)\1+$/.test(output)
        ) return false;
        if (output.length > 10) {
          console.log(`Answer 1: ${input}`);
          Deno.exit();
        }
        continue;
      }
      case Code.CPY: {
        if (typeof y !== "string") continue;
        if (Number.isInteger(x)) register[y] = x as number;
        else register[y] = register[x];
        continue;
      }
      case Code.INC: {
        register[x]++;
        continue;
      }
      case Code.DEC: {
        register[x]--;
        continue;
      }
      case Code.JNZ: {
        const j = Number.isInteger(x) ? x : register[x];
        const k = Number.isInteger(y) ? y : register[y];
        if (j !== 0) i += (k as number) - 1;
        continue;
      }
      case Code.TGL: {
        const j = Number.isInteger(x) ? x : register[x];
        const toggle = i + (j as number);
        if (toggle >= program.length) continue;
        switch (program[toggle][0]) {
          case Code.CPY:
            program[toggle][0] = Code.JNZ;
            break;
          case Code.INC:
            program[toggle][0] = Code.DEC;
            break;
          case Code.DEC:
            program[toggle][0] = Code.INC;
            break;
          case Code.JNZ:
            program[toggle][0] = Code.CPY;
            break;
          case Code.TGL:
            program[toggle][0] = Code.INC;
            break;
        }
        continue;
      }
    }
  }
  return true;
};

for (let i = 0; i < Infinity; i++) run(i);
