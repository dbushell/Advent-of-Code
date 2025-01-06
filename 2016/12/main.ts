#!/usr/bin/env -S deno run --allow-read

const inputText = await Deno.readTextFile(
  new URL("input.txt", import.meta.url),
);

enum Code {
  CPY = "cpy",
  INC = "inc",
  DEC = "dec",
  JNZ = "jnz",
}

type Program = Array<[Code, string | number, string | number]>;

const program = inputText.trim().split("\n").map((line) => {
  return line.match(/^(\w+)\s([-\w\d]+)\s?([-\w\d]+)?$/)!
    .slice(1, 4).map((s) => Number(s) || s);
}) as Program;

const register: { [key: string]: number } = { a: 0, b: 0, c: 0, d: 0 };

const run = () => {
  for (let i = 0; i < program.length; i++) {
    const [code, x, y] = program[i];
    switch (code) {
      case Code.CPY: {
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
        if (j !== 0) i += (y as number) - 1;
        continue;
      }
    }
  }
};

run();
console.log(`Answer 1: ${register.a}`);

register.a = register.b = register.d = 0;
register.c = 1;

run();
console.log(`Answer 2: ${register.a}`);
