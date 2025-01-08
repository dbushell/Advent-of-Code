#!/usr/bin/env -S deno run --allow-read

const inputText = await Deno.readTextFile(
  new URL("input.txt", import.meta.url),
);

type Program = {
  name: string;
  weight: number;
  above: Array<Program>;
  below: Array<Program>;
};

const aboveMap = new Map<Program, Array<string>>();
const towerArray: Array<Program> = [];

for (const line of inputText.split("\n")) {
  const match = line.match(/^(\w+) \((\d+)\)(?: -> (.+?))?$/);
  if (!match) continue;
  const program: Program = {
    name: match[1],
    weight: Number(match[2]),
    above: [],
    below: [],
  };
  aboveMap.set(program, (match[3] ?? "").split(", ").filter(Boolean));
  towerArray.push(program);
}

// Link programs directly above
towerArray.forEach((p1) =>
  p1.above.push(
    ...aboveMap.get(p1)!.map((name) =>
      towerArray.find((p2) => p2.name === name)!
    ),
  )
);

// Link program directly below
towerArray.forEach((p1) => {
  const below = towerArray.find((p2) => p2.above.includes(p1));
  if (below) p1.below.push(below);
});

// Link all other programs below
// towerArray.forEach((p1) => {
//   let parent = p1.below[0];
//   while (parent) {
//     p1.below.push(...parent.below);
//     parent = parent.below[0];
//   }
// });

// Sort bottom of tower first
towerArray.sort((a, b) => {
  if (b.above.includes(a)) return 1;
  if (a.above.includes(b)) return -1;
  return a.below.length - b.below.length;
});

console.log(`Answer 1: ${towerArray[0].name}`);

// Total tower weight
const weigh = (base: Program): number => {
  let sum = base.weight;
  for (const p1 of base.above) sum += weigh(p1);
  return sum;
};

// Find first unbalanced tower
const balance = (base: Program) => {
  if (base.above.length === 0) return;
  const weights: Array<[Program, number]> = [];
  for (const p1 of base.above) {
    weights.push([p1, weigh(p1)]);
    balance(p1);
  }
  const min = Math.min(...weights.map((w) => w[1]));
  const max = Math.max(...weights.map((w) => w[1]));
  if (min !== max) {
    const p1 = weights.find((w) => w[1] === max)![0];
    console.log(`Answer 2: ${p1.weight - (max - min)}`);
    Deno.exit();
  }
};

balance(towerArray[0]);
