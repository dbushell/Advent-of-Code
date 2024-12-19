#!/usr/bin/env -S deno run --allow-read

const inputText = await Deno.readTextFile(
  new URL("input.txt", import.meta.url),
);

const a2z = "abcdefghijklmnopqrstuvwxyz";

const three: Array<string> = [];
for (let i = 0; i < a2z.length - 2; i++) {
  three.push(a2z.substring(i, i + 3));
}
const threeRegex = new RegExp(`(${three.join("|")})`);

const increment = (str: string) => {
  let out = "";
  let inc = true;
  for (let i = str.length - 1; i > -1; i--) {
    if (!inc) {
      out = str[i] + out;
      continue;
    }
    if (str[i] === "z") {
      out = "a" + out;
      inc = true;
      continue;
    }
    out = a2z[a2z.indexOf(str[i]) + 1] + out;
    inc = false;
  }
  return out;
};

const valid = (str: string) => {
  if (/[iol]/.test(str)) return false;
  if (!threeRegex.test(str)) return false;
  const p1 = str.match(/([a-z])\1/);
  if (!p1) return false;
  const p2 = str.match(new RegExp(`([${a2z.replace(p1[1], "")}])\\1`));
  if (!p2) return false;
  return true;
};

{
  let password = inputText.trim();
  while (!valid(password)) {
    password = increment(password);
  }
  const answerOne = password;
  console.log(`Answer 1: ${answerOne}`);

  password = increment(answerOne);
  while (!valid(password)) {
    password = increment(password);
  }
  const answerTwo = password;
  console.log(`Answer 2: ${answerTwo}`);
}
