#!/usr/bin/env -S deno run --allow-read

const inputText = await Deno.readTextFile(
  new URL("input.txt", import.meta.url),
);

enum P {
  Empty = ".",
  Plant = "#",
}

type Pot = { index: number; left?: Pot; right?: Pot; plant: P };

// Placeholders
let head = {} as Pot;
let tail = {} as Pot;

// Parse input patterns and state
const patternMap = new Map<string, P>();
for (const line of inputText.split("\n")) {
  if (line.startsWith("initial state:")) {
    const pots = line.slice(15).split("") as P[];
    let now: Pot | undefined = undefined;
    for (let i = 0; i < pots.length; i++) {
      const p: Pot = { index: i, plant: pots[i], left: now };
      if (now) now.right = p;
      else head = p;
      now = p;
      tail = p;
    }
  }
  const match = line.match(/^([#\.]{5}) => ([#\.])$/);
  if (!match) continue;
  patternMap.set(match[1], match[2] as P);
}

// Count number of pots linked
const count = (): number => {
  let n = 0;
  let now: Pot | undefined = head;
  while (now) {
    if (now.plant === P.Plant) n += now.index;
    now = now.right;
  }
  return n;
};

// Pattern to match around pot
const state = (p: Pot) => {
  let state = "";
  state += p.left?.left?.plant ?? P.Empty;
  state += p.left?.plant ?? P.Empty;
  state += p.plant;
  state += p.right?.plant ?? P.Empty;
  state += p.right?.right?.plant ?? P.Empty;
  return state;
};

const next: Array<P> = [];

const generation = () => {
  let now: Pot | undefined = head;

  // Remove over two empty pots to the left
  while (now) {
    if (now.left?.left?.left?.plant === P.Empty) {
      const newHead = now.left.left;
      newHead.right = now.left;
      newHead.left = undefined;
      head = newHead;
    }
    if (now.plant === P.Plant) break;
    now = now.right;
  }

  // Ensure two empty pots at either side
  while (head.plant !== P.Empty || head.right?.plant !== P.Empty) {
    head.left = { index: head.index - 1, plant: P.Empty, right: head };
    head = head.left;
  }

  while (tail.plant !== P.Empty || tail.left?.plant !== P.Empty) {
    tail.right = { index: tail.index + 1, plant: P.Empty, left: tail };
    tail = tail.right;
  }

  // Get next state
  let n = 0;
  now = head;
  while (now) {
    next[n++] = patternMap.get(state(now)) ?? P.Empty;
    now = now.right;
  }

  // Set net state
  n = 0;
  now = head;
  while (now) {
    now.plant = next[n++];
    now = now.right;
  }
};

// First twenty generations
for (let i = 0; i < 20; i++) generation();

console.log(`Answer 1: ${count()}`);

let prev_count = 0;
let diff_count = 0;
let total_count = 0;
for (let i = 20; i < 50_000_000_000; i++) {
  // A constant pattern stabilizes well before 500 generations
  // After that it only shifts a fixed index to the right
  if (i === 500) {
    total_count = count() + ((50_000_000_000 - i) * diff_count);
    break;
  }
  generation();
  const new_count = count();
  diff_count = new_count - prev_count;
  prev_count = new_count;
}

console.log(`Answer 2: ${total_count}`);
