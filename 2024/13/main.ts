#!/usr/bin/env -S deno run --allow-read

import { assert } from "jsr:@std/assert/assert";

const inputText = await Deno.readTextFile(
  new URL("input.txt", import.meta.url),
);

type Button = { label: "A" | "B"; x: number; y: number };
type Prize = { x: number; y: number };
type Machine = { A: Button; B: Button; prize: Prize };

// Returns true if machine has correct properties
const validateMachine = (m: Partial<Machine>): m is Machine => {
  if (!Number.isInteger(m.prize?.x)) return false;
  if (!Number.isInteger(m.prize?.y)) return false;
  if (!Number.isInteger(m.A?.x)) return false;
  if (!Number.isInteger(m.A?.y)) return false;
  return true;
};

const calcTokens = (m: Machine): number => {
  let bTokens = 0;
  let aTokens = 0;
  for (let b = 1; b < 101; b++) {
    for (let a = 1; a < 101; a++) {
      const xV = (b * m.B.x) + (a * m.A.x);
      const yV = (b * m.B.y) + (a * m.A.y);
      if (xV > m.prize.x) break;
      if (yV > m.prize.y) break;
      if (xV === m.prize.x && yV === m.prize.y) {
        const tokens = b + (a * 3);
        if (bTokens === 0 || tokens < bTokens) {
          bTokens = tokens;
        }
      }
    }
  }
  for (let a = 1; a < 101; a++) {
    for (let b = 1; b < 101; b++) {
      const xV = (b * m.B.x) + (a * m.A.x);
      const yV = (b * m.B.y) + (a * m.A.y);
      if (xV > m.prize.x) break;
      if (yV > m.prize.y) break;
      if (xV === m.prize.x && yV === m.prize.y) {
        const tokens = b + (a * 3);
        if (aTokens === 0 || tokens < aTokens) {
          aTokens = tokens;
        }
      }
    }
  }
  if (aTokens && bTokens) {
    return Math.min(aTokens, bTokens);
  }
  return aTokens ? aTokens : bTokens;
};

// All parsed input
const allMachines: Array<Machine> = [];

{
  // Parse input with forced types and validate later
  type ButtonRegex = [unknown, "A" | "B", string, string];
  type PrizeRegex = [unknown, string, string];
  const buttonRegex = /^Button ([A|B]): X([\+-]\d+), Y([\+-]\d+)$/;
  const prizeRegex = /^Prize: X=(\d+), Y=(\d+)$/;
  let machine = {} as Machine;
  for (const line of inputText.split("\n")) {
    if (line.startsWith("Button")) {
      const [, label, x, y] = line.match(buttonRegex)! as ButtonRegex;
      machine[label] = { label, x: Number.parseInt(x), y: Number.parseInt(y) };
    }
    if (line.startsWith("Prize")) {
      const [, x, y] = line.match(prizeRegex)! as PrizeRegex;
      machine.prize = { x: Number.parseInt(x), y: Number.parseInt(y) };
      assert(validateMachine(machine), "Invalid machine");
      allMachines.push(machine);
      machine = {} as Machine;
    }
  }
}

let answerOne = 0;
for (const machine of allMachines) {
  answerOne += calcTokens(machine);
}

console.log(`Answer 1: ${answerOne}`);
