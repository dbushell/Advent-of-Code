#!/usr/bin/env -S deno run --allow-read

import { assert } from "jsr:@std/assert/assert";
import { type Machine, newVM, outputVM, runVM } from "../intcode.ts";

const inputText = await Deno.readTextFile(
  new URL("input.txt", import.meta.url),
);

enum Dir {
  Up = "^",
  Down = "v",
  Left = "<",
  Right = ">",
}

type XY = { x: number; y: number };
type Step = { xy: XY; color: number; dir: Dir };
type Path = Array<Step>;

const keyXY = ({ x, y }: XY) => (`${x}-${y}`);

const nextStep = (prev: Step, turn: Dir): Step => {
  assert([Dir.Left, Dir.Right].includes(turn), "Invalid turn");
  const next = structuredClone<Step>(prev);
  if (turn === Dir.Left) {
    if (prev.dir === Dir.Up) next.dir = Dir.Left;
    else if (prev.dir === Dir.Down) next.dir = Dir.Right;
    else if (prev.dir === Dir.Left) next.dir = Dir.Down;
    else if (prev.dir === Dir.Right) next.dir = Dir.Up;
  }
  if (turn === Dir.Right) {
    if (prev.dir === Dir.Up) next.dir = Dir.Right;
    else if (prev.dir === Dir.Down) next.dir = Dir.Left;
    else if (prev.dir === Dir.Left) next.dir = Dir.Up;
    else if (prev.dir === Dir.Right) next.dir = Dir.Down;
  }
  if (next.dir === Dir.Up) next.xy.y--;
  else if (next.dir === Dir.Down) next.xy.y++;
  else if (next.dir === Dir.Left) next.xy.x--;
  else if (next.dir === Dir.Right) next.xy.x++;
  return next;
};

const onOutput = (vm: Machine, path: Path, colors: Map<string, number>) => {
  assert(vm.output.length % 2 == 0);
  const turn = vm.output.at(-1)!;
  const color = vm.output.at(-2)!;
  assert([0, 1].includes(turn), "Bad turn output");
  assert([0, 1].includes(color), "Bad color output");
  const previous = path.at(-1)!;
  previous.color = color;
  const next = nextStep(previous, turn ? Dir.Right : Dir.Left);
  const input = colors.get(keyXY(next.xy)) ?? 0;
  colors.set(keyXY(previous.xy), color);
  colors.set(keyXY(next.xy), color);
  path.push(next);
  vm.input.push(input);
};

{
  const memory = inputText.trim().split(",").map(Number);
  const vm = newVM(memory);

  const colors = new Map<string, number>();

  const path: Path = [{
    xy: { x: 0, y: 0 },
    color: 0,
    dir: Dir.Up,
  }];

  outputVM(vm, () => {
    if (vm.output.length % 2 === 0) onOutput(vm, path, colors);
  });

  vm.input.push(0);
  await runVM(vm);

  const answerOne = colors.size;
  console.log(`Answer 1: ${answerOne}`);
}

/*************
 * PART TWO! *
 *************/

{
  const memory = inputText.trim().split(",").map(Number);
  const vm = newVM(memory);

  const colors = new Map<string, number>();

  const path: Path = [{
    xy: { x: 0, y: 0 },
    color: 0,
    dir: Dir.Up,
  }];

  vm.output = new Proxy<Array<number>>(vm.output, {
    set(target, prop, value, receiver) {
      const set = Reflect.set(target, prop, value, receiver);
      if (Number.isInteger(Number(prop))) {
        if (vm.output.length % 2 === 0) onOutput(vm, path, colors);
      }
      return set;
    },
  });
  vm.input.push(1);
  await runVM(vm);

  const width = 1 + Math.max(...path.map(({ xy }) => xy.x));
  const height = 1 + Math.max(...path.map(({ xy }) => xy.y));

  const image: Array<Array<string>> = Array.from(
    { length: height },
    () => new Array(width).fill(" "),
  );

  path.forEach(({ xy, color }) => (image[xy.y][xy.x] = color ? "#" : " "));

  console.log(`Answer 2:`);
  console.log(image.map((layer) => layer.join(" ")).join("\n"));
}
