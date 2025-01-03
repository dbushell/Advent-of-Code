#!/usr/bin/env -S deno run --allow-read

import { assert } from "jsr:@std/assert/assert";

import { type Memory, newVM, outputVM, runVM } from "../intcode.ts";
import { Color, color, screen, write } from "../debug.ts";
import { adjacentXY, keyXY } from "../helpers.ts";

const inputText = await Deno.readTextFile(
  new URL("input.txt", import.meta.url),
);

enum Code {
  Newline = 10,
  Scaffold = 35,
  Comma = 44,
  Empty = 46,
  Zero = 48,
  One = 49,
  Two = 50,
  Three = 51,
  Four = 52,
  Five = 53,
  Six = 54,
  Seven = 55,
  Eight = 56,
  Nine = 57,
  Left = 60,
  Right = 62,
  A = 65,
  B = 66,
  C = 67,
  L = 76,
  R = 82,
  Up = 94,
  n = 110,
  Down = 118,
  y = 121,
}

enum State {
  Initial = "Initial",
  Routine = "Routine",
  FnA = "Function A",
  FnB = "Function B",
  FnC = "Function C",
  Feed = "Feed",
  Live = "Live",
  Wait = "Wait",
}

type Face = Code.Up | Code.Down | Code.Left | Code.Right;

type XY = { x: number; y: number };

type Grid = Array<Array<number>>;

type Robot = { xy: XY; face: Face };

const arrows = new Map<Face, string>([
  [Code.Up, "⇧"],
  [Code.Down, "⇩"],
  [Code.Left, "⇦"],
  [Code.Right, "⇨"],
]);

const memory: Memory = inputText.trim().split(",").map(Number);
const vm = newVM(memory);
vm.memory[0] = 2;

const robot: Robot = { xy: { x: 0, y: 0 }, face: Code.Up };
const scaffold = new Map<string, XY>();
const intersections: Array<XY> = [];
const routine: Array<string> = [];

const grid: Grid = [];
const layer: Array<number> = [];
const dimensions: XY = { x: 0, y: 0 };

let state = State.Initial;
let outputText = "";
let logText = "";

// Get forward position by direction
const faceXY = ({ x, y }: XY, face: Face) => {
  switch (face) {
    case Code.Up:
      return { x, y: y - 1 };
    case Code.Down:
      return { x, y: y + 1 };
    case Code.Left:
      return { x: x - 1, y };
    case Code.Right:
      return { x: x + 1, y };
  }
};

// Convert string instructions
const toASCII = (input: string): Array<Code> => {
  return input.trim().split(/\s/).map((p) =>
    p.split("").map((c) => c.codePointAt(0)!)
  ).flatMap((c) => c.concat(Code.Comma)).slice(0, -1).concat(Code.Newline);
};

const frame = () => {
  if (grid.length === 0) return;
  const xaxis = Array.from({ length: grid[0].length }, (_, i) => `${(i % 10)}`);
  let out = `  ${color(xaxis.join(" "), Color.Dim)}\n`;
  for (let y = 0; y < grid.length; y++) {
    out += `${color(String(y % 10), Color.Dim)} `;
    for (let x = 0; x < grid[y].length; x++) {
      if (x === robot.xy.x && y === robot.xy.y) {
        out += color(`${arrows.get(robot.face)} `, Color.Blue);
        continue;
      }
      switch (grid[y][x]) {
        case Code.Scaffold:
          out += color("▤ ", Color.Blue);
          continue;
        default:
          out += color(". ", Color.Dim);
      }
    }
    out += `${color(String(y % 10), Color.Dim)}\n`;
  }
  out += `  ${color(xaxis.join(" "), Color.Dim)}\n`;
  screen.hideCursor();
  screen.clear();
  write(`${out}\n`);
  write(`${logText}\n`);
  screen.showCursor();
};

// Count cross points for answer one
const getIntersections = (): number => {
  let alignment = 0;
  for (const [, xy] of scaffold) {
    const adjacent = adjacentXY(xy);
    if (adjacent.every((xy) => scaffold.has(keyXY(xy)))) {
      intersections.push(xy);
      alignment += xy.x * xy.y;
    }
  }
  return alignment;
};

const videoState = (code: Code) => {
  const x = layer.length;
  const y = grid.length;
  if (state === State.Live) {
    if (code !== Code.Newline) {
      if (grid.length === dimensions.y) {
        grid.length = 0;
        layer.length = 0;
      }
    }
  }
  // End of row
  if (code === Code.Newline) {
    if (layer.length) {
      grid.push([...layer]);
      layer.length = 0;
      if (state === State.Initial) {
        dimensions.y++;
        dimensions.x = grid[0].length;
      }
      frame();
    } else {
      if (state === State.Initial) {
        if (intersections.length === 0) {
          const answerOne = getIntersections();
          logText += `Answer 1: ${answerOne}\n`;
        }
        state = State.Routine;
      }
    }
  }
  // Found robot
  const isRobot = arrows.has(code as Face);
  if (isRobot) {
    robot.face = code as Face;
    robot.xy = { x, y };
  }
  // Found scaffold
  if (isRobot || code === Code.Scaffold) {
    scaffold.set(keyXY({ x, y }), { x, y });
    layer.push(Code.Scaffold);
  }
  // Found space
  if (code === Code.Empty) {
    layer.push(code);
  }
};

const getRoutine = () => {
  const now = structuredClone<Robot>(robot);
  const route: Array<string> = [];
  let count = 0;
  const walk = () => {
    if (count === 0) return;
    route.push(String(count));
    count = 0;
  };
  while (true) {
    const forward = faceXY(now.xy, now.face);
    if (scaffold.has(keyXY(forward))) {
      now.xy = forward;
      count++;
      continue;
    }
    walk();
    const adjacent = adjacentXY(now.xy);
    let left: XY;
    let right: XY;
    let leftCode: Code;
    let rightCode: Code;
    switch (now.face) {
      case Code.Left:
        left = adjacent[1];
        right = adjacent[0];
        leftCode = Code.Down;
        rightCode = Code.Up;
        break;
      case Code.Right:
        left = adjacent[0];
        right = adjacent[1];
        leftCode = Code.Up;
        rightCode = Code.Down;
        break;
      case Code.Up:
        left = adjacent[2];
        right = adjacent[3];
        leftCode = Code.Left;
        rightCode = Code.Right;
        break;
      case Code.Down:
        left = adjacent[3];
        right = adjacent[2];
        leftCode = Code.Right;
        rightCode = Code.Left;
    }
    // Turn left?
    if (scaffold.has(keyXY(left))) {
      route.push("L");
      now.face = leftCode;
      continue;
    }
    // Turn right?
    if (scaffold.has(keyXY(right))) {
      route.push("R");
      now.face = rightCode;
      continue;
    }
    // Reached the end.
    walk();
    break;
  }

  let routine = "";
  let A: Array<string> = [];
  let B: Array<string> = [];
  let C: Array<string> = [];

  mainLoop: for (let a = 4; a < 11; a++) {
    let AR = [...route];
    A = AR.splice(0, a);
    AR = AR.join(",").replaceAll(A.join(","), "").split(",");
    for (let b = 4; b < 11; b++) {
      let BR = [...AR];
      B = BR.splice(0, b);
      BR = BR.join(",").replaceAll(B.join(","), "").split(",");
      for (let c = 4; c < 11; c++) {
        let CR = [...BR];
        C = CR.splice(0, c);
        CR = CR.join(",").replaceAll(C.join(","), "").split(",");
        if (CR.join("").trim() === "") {
          routine = route.join("")
            .replaceAll(A.join(""), "A ")
            .replaceAll(B.join(""), "B ")
            .replaceAll(C.join(""), "C ");
          break mainLoop;
        }
      }
    }
  }
  assert(routine.length, "Failed to get routine");
  return [
    routine.trim(),
    A.join(" ").trim(),
    B.join(" ").trim(),
    C.join(" ").trim(),
  ];
};

outputVM(vm, () => {
  const code = vm.output.at(-1)!;
  if (code > 255) {
    logText += `Answer 2: ${code}\n`;
    // frame();
    return;
  }
  switch (state) {
    case State.Live:
    case State.Initial:
      videoState(code);
      break;
    case State.Routine:
      outputText += String.fromCodePoint(code);
      if (outputText.endsWith(":\n")) {
        routine.push(...getRoutine());
        assert(routine.length === 4, "Failed to get routine");
        outputText += `${routine[0]}\n`;
        vm.input.push(...toASCII(routine[0]));
        state = State.FnA;
      }
      break;
    case State.FnA:
      outputText += String.fromCodePoint(code);
      if (outputText.endsWith(":\n")) {
        outputText += `${routine[1]}\n`;
        vm.input.push(...toASCII(routine[1]));
        state = State.FnB;
      }
      break;
    case State.FnB:
      outputText += String.fromCodePoint(code);
      if (outputText.endsWith(":\n")) {
        outputText += `${routine[2]}\n`;
        vm.input.push(...toASCII(routine[2]));
        state = State.FnC;
      }
      break;
    case State.FnC:
      outputText += String.fromCodePoint(code);
      if (outputText.endsWith(":\n")) {
        outputText += `${routine[3]}\n`;
        vm.input.push(...toASCII(routine[3]));
        state = State.Feed;
      }
      break;
    case State.Feed:
      outputText += String.fromCodePoint(code);
      if (outputText.endsWith("feed?\n")) {
        // state = State.Live;
        state = State.Wait;
        vm.input.push(Code.n, Code.Newline);
      }
      break;
  }
});

await runVM(vm);

console.log(outputText);
console.log(logText);
