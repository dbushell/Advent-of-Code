#!/usr/bin/env -S deno run --allow-read

import { newVM, runVM } from "../intcode.ts";

const inputText = await Deno.readTextFile(
  new URL("input.txt", import.meta.url),
);

const inputProgram = inputText.trim().split(",").map(Number);

{
  const vm = newVM(inputProgram);
  vm.memory[1] = 12;
  vm.memory[2] = 2;
  await runVM(vm);
  const answerOne = vm.memory[0];
  console.log(`Answer 1: ${answerOne}`);
}

{
  let noun = 0;
  let verb = 0;
  loop: for (noun = 0; noun < 100; noun++) {
    for (verb = 0; verb < 100; verb++) {
      const vm = newVM(inputProgram);
      vm.memory[1] = noun;
      vm.memory[2] = verb;
      await runVM(vm);
      if (vm.memory[0] === 19690720) {
        break loop;
      }
    }
  }
  const answerTwo = 100 * noun + verb;
  console.log(`Answer 2: ${answerTwo}`);
}
