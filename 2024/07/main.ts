#!/usr/bin/env -S deno run --allow-read
import { assert, assertEquals } from "jsr:@std/assert";

const inputText = await Deno.readTextFile(
  new URL("input.txt", import.meta.url),
);

const OPERATORS = ["+", "*"] as const;

type Operator = typeof OPERATORS[number];

type Branch = Array<number | Operator>;

type Equation = {
  result: number;
  numbers: Array<number>;
  branches: Array<Branch>;
};

const equations: Array<Equation> = [];

// Parse input
for (const line of inputText.trim().split("\n")) {
  const parts = line.split(":", 2);
  const result = Number.parseInt(parts[0].trim());
  assert(!isNaN(result), "Result must be a number");
  const numbers = parts[1]
    .split(/\s+/)
    .map((n) => Number.parseInt(n.trim()))
    .filter((n) => !isNaN(n));
  assert(numbers.length > 1, "Equation must have numbers");
  equations.push({ result, numbers, branches: [] });
}

// Recursively generate all possible equation combinations
const generateBranches = (
  eq: Equation,
  offset: number = 0,
  branch: Array<number | Operator> = [],
) => {
  // Start with first number
  if (offset === 0 || branch.length === 0) {
    branch = [eq.numbers.at(0)!];
    offset = 1;
  }
  // Add branch if no more numbers
  const nextNumber = eq.numbers.at(offset);
  if (nextNumber === undefined) {
    eq.branches.push(branch);
    return;
  }
  // New branch for each operator
  for (const op of OPERATORS) {
    const newBranch = [...branch, op, nextNumber];
    generateBranches(eq, offset + 1, newBranch);
  }
};

// Returns true if branch result matches expected value
const evaluateBranch = (branch: Branch, expected: number): boolean => {
  let result = branch[0] as number;
  for (let i = 1; i < branch.length; i += 2) {
    if (result > expected) return false;
    if (branch[i] === "+") {
      result += branch[i + 1] as number;
      continue;
    }
    if (branch[i] === "*") {
      result *= branch[i + 1] as number;
      continue;
    }
    assert(false, "Bad branch");
  }
  return result === expected;
};

// Returns true if one branch evaluates true
const evaluateEquation = (eq: Equation): boolean => {
  if (eq.branches.length === 0) {
    generateBranches(eq);
  }
  assertEquals(
    eq.branches.length,
    new Set(eq.branches.map((b) => b.join(" "))).size,
    "Branches must be unique",
  );
  for (const branch of eq.branches) {
    if (evaluateBranch(branch, eq.result)) {
      return true;
    }
  }
  return false;
};

let answerOne = 0;
for (const eq of equations) {
  if (evaluateEquation(eq)) {
    answerOne += eq.result;
  }
}

console.log(`Answer 1: ${answerOne}`);
