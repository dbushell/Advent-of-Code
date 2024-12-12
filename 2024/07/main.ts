#!/usr/bin/env -S deno run --allow-read
import { assert } from "jsr:@std/assert/assert";

const inputText = await Deno.readTextFile(
  new URL("input.txt", import.meta.url),
);

const OPERATORS = ["+", "*", "||"] as const;

type Deferred<T> = ReturnType<typeof Promise.withResolvers<T>>;

type Operator = typeof OPERATORS[number];

type Branch = Array<number | Operator>;

type Equation = {
  result: number;
  numbers: Array<number>;
  deferred: Deferred<boolean> | null;
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
  equations.push({ result, numbers, deferred: null });
}

// Recursively test all possible equation combinations
const generateBranches = (
  eq: Equation,
  operators: Array<Operator>,
  offset: number = 0,
  branch: Array<number | Operator> = [],
) => {
  // Escape if solution found
  if (eq.deferred === null) return;
  // Start with first number
  if (offset === 0 || branch.length === 0) {
    branch = [eq.numbers.at(0)!];
    offset = 1;
  }
  // Evaluate branch if no more numbers
  const nextNumber = eq.numbers.at(offset);
  if (nextNumber === undefined) {
    if (evaluateBranch(branch, eq.result)) {
      // End branch generation
      eq.deferred.resolve(true);
      eq.deferred = null;
    }
    return;
  }
  // New branch for each operator
  for (const op of operators) {
    // Escape if solution found
    if (eq.deferred === null) return;
    const newBranch = [...branch, op, nextNumber];
    generateBranches(eq, operators, offset + 1, newBranch);
  }
  // Failed to find solution
  if (offset === 1 && eq.deferred) {
    eq.deferred.resolve(false);
  }
};

// Returns true if branch result matches expected value
const evaluateBranch = (branch: Branch, expected: number): boolean => {
  let result = branch[0] as number;
  for (let i = 1; i < branch.length; i += 2) {
    if (result > expected) return false;
    const nextNumber = branch[i + 1] as number;
    if (branch[i] === "+") {
      result += nextNumber;
      continue;
    }
    if (branch[i] === "*") {
      result *= nextNumber;
      continue;
    }
    if (branch[i] === "||") {
      result = Number.parseInt(`${result}${nextNumber}`);
      continue;
    }
    assert(false, "Bad branch");
  }
  return result === expected;
};

// Returns true if one branch evaluates true
const evaluateEquation = (
  eq: Equation,
  operator: Array<Operator>,
): Promise<boolean> => {
  const deferred = Promise.withResolvers<boolean>();
  eq.deferred = deferred;
  generateBranches(eq, operator);
  return deferred.promise;
};

let answerOne = 0;
for (const eq of equations) {
  if (await evaluateEquation(eq, ["+", "*"])) {
    answerOne += eq.result;
  }
}

let answerTwo = 0;
for (const eq of equations) {
  if (await evaluateEquation(eq, ["+", "*", "||"])) {
    answerTwo += eq.result;
  }
}

console.log(`Answer 1: ${answerOne}`);
console.log(`Answer 2: ${answerTwo}`);
