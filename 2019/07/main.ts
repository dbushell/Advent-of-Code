#!/usr/bin/env -S deno run --allow-read

import { assert } from "jsr:@std/assert/assert";
import { newVM, runVM } from "../intcode.ts";

const inputText = await Deno.readTextFile(
  new URL("input.txt", import.meta.url),
);

export const ampSequence = async (
  sequence: Array<number>,
  memory: Array<number>,
) => {
  let next = 0;
  for (let i = 0; i < sequence.length; i++) {
    const vm = newVM(memory);
    vm.input = [sequence[i], next];
    await runVM(vm);
    next = vm.output[0];
    assert(Number.isInteger(next), "Bad output");
  }
  return next;
};

export const feedbackSequence = async (
  sequence: Array<number>,
  memory: Array<number>,
) => {
  const vms = [
    newVM(memory, "m1"),
    newVM(memory, "m2"),
    newVM(memory, "m3"),
    newVM(memory, "m4"),
    newVM(memory, "m5"),
  ];
  vms[1].input = vms[0].output;
  vms[2].input = vms[1].output;
  vms[3].input = vms[2].output;
  vms[4].input = vms[3].output;
  vms[0].input = vms[4].output;
  for (let i = 0; i < sequence.length; i++) {
    vms[i].input.push(sequence[i]);
  }
  vms[0].input.push(0);
  runVM(vms[0]);
  runVM(vms[1]);
  runVM(vms[2]);
  runVM(vms[3]);
  await runVM(vms[4]);
  return vms[4].output.at(-1)!;
};

const combinations = (list: Array<number>, start = 0): Array<Array<number>> => {
  const result: Array<Array<number>> = [];
  const generate = (arr: Array<number>, start: number): void => {
    if (start === arr.length) {
      result.push([...arr]);
      return;
    }
    for (let i = start; i < arr.length; i++) {
      [arr[start], arr[i]] = [arr[i], arr[start]];
      generate(arr, start + 1);
      [arr[start], arr[i]] = [arr[i], arr[start]];
    }
  };
  generate(list, start);
  return result;
};

if (import.meta.main) {
  const memory = inputText.trim().split(",").map(Number);
  {
    const sequences = combinations([0, 1, 2, 3, 4]);
    const signals: Array<{ seq: Array<number>; output: number }> = [];
    for (const seq of sequences) {
      signals.push({ seq, output: await ampSequence(seq, memory) });
    }
    signals.sort((a, b) => a.output - b.output);
    const answerOne = signals.at(-1)!.output;
    console.log(`Answer 1: ${answerOne}`);
  }
  {
    const sequences = combinations([5, 6, 7, 8, 9]);
    const signals: Array<{ seq: Array<number>; output: number }> = [];
    for (const seq of sequences) {
      signals.push({ seq, output: await feedbackSequence(seq, memory) });
    }
    signals.sort((a, b) => a.output - b.output);
    const answerTwo = signals.at(-1)!.output;
    console.log(`Answer 2: ${answerTwo}`);
  }
}
