#!/usr/bin/env -S deno run --allow-read

import { newVM, runVM } from "../intcode.ts";

const inputText = await Deno.readTextFile(
  new URL("input.txt", import.meta.url),
);

const memory = inputText.trim().split(",").map(Number);

{
  const vm = newVM(memory);
  vm.input = [1];
  await runVM(vm);
  const answerOne = vm.output.at(-1);
  console.log(`Answer 1: ${answerOne}`);
}

{
  const vm = newVM(memory);
  vm.input = [5];
  await runVM(vm);
  const answerTwo = vm.output.at(-1);
  console.log(`Answer 2: ${answerTwo}`);
}
