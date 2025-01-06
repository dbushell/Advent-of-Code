#!/usr/bin/env -S deno run --allow-read

const inputText = await Deno.readTextFile(
  new URL("input.txt", import.meta.url),
);

type State = {
  steps: 0;
  dropped: Array<Array<string>>;
  held: Array<string>;
  floor: number;
  total: number;
};

const state: State = {
  steps: 0,
  dropped: [],
  held: [],
  floor: 0,
  total: 0,
};

for (const line of inputText.trim().split("\n")) {
  state.dropped.push(
    [...line.matchAll(/a (.+?)(?: and|[,\.])/g).map((m) => m[1])],
  );
}
state.total = state.dropped.flat().length;

let best = Infinity;
const queue: Array<State> = [state];
const cache = new Map<string, number>();
const initialState = structuredClone(state);

const key = (state: State): string => {
  let key = `${state.floor}:`;
  state.held.sort((a, b) => a.localeCompare(b));
  key += state.held.join(",");
  for (let i = 0; i < state.dropped.length; i++) {
    state.dropped[i].sort((a, b) => a.localeCompare(b));
    key += `|${state.dropped[i].join(",")}`;
  }
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = ((hash << 5) - hash + key.charCodeAt(i)) | 0;
  }
  return (hash >>> 0).toString(36);
};

const validate = (state: State): boolean => {
  if (state.held.length === 0) return false;
  const items = [...state.held, ...state.dropped[state.floor]];
  const chips = items.filter((s) => s.includes("microchip"));
  const generators = items.filter((s) => s.includes("generator"));
  if (generators.length) {
    for (const chip of chips) {
      const gen = chip.replace("-compatible microchip", " generator");
      if (!items.includes(gen)) return false;
    }
  }
  return true;
};

const sort = (a: State, b: State): number => {
  const aw = (a.held.length * a.floor) +
    a.dropped.map((c, i) => c.length * i).reduce((c, v) => c + v, 0);
  const bw = (b.held.length * b.floor) +
    b.dropped.map((c, i) => c.length * i).reduce((c, v) => c + v, 0);
  return aw - bw;
};

const diverge = (state: State): void => {
  if (++state.steps >= best) return;

  const items = [...state.held, ...state.dropped[state.floor]];

  if (state.floor === 3 && items.length === state.total) {
    best = Math.min(best, state.steps);
    return;
  }

  const k = key(state);
  if (cache.has(k) && cache.get(k)! <= state.steps) return;
  cache.set(k, state.steps);

  let moves: Array<State> = [];

  if (state.floor > 0) {
    const next = structuredClone(state);
    next.floor--;
    const items = next.dropped.flatMap((s, i) => (i <= next.floor) ? s : []);
    if (items.length > 0) moves.push(next);
  }

  if (state.floor < 3) {
    const next = structuredClone(state);
    next.floor++;
    moves.push(next);
  }

  const combinations = items.flatMap((item, i) => {
    return [item, ...items.slice(i + 1).map((w) => [item, w])];
  });
  for (const move of [...moves]) {
    for (const combo of combinations) {
      const next = structuredClone(move);
      next.held = [combo].flat();
      next.dropped[state.floor] = items.filter((c) => !combo.includes(c));
      moves.push(next);
    }
  }

  moves = moves.filter(validate);

  const twoUp = (m: State) => m.floor > state.floor && m.held.length === 2;
  if (moves.some(twoUp)) {
    moves = moves.filter((m) => {
      return m.floor > state.floor ? twoUp(m) : true;
    });
  }
  const oneDown = (m: State) => m.floor < state.floor && m.held.length === 1;
  if (moves.some(oneDown)) {
    moves = moves.filter((m) => {
      return m.floor < state.floor ? oneDown(m) : true;
    });
  }
  queue.push(...moves);
};

while (queue.length) {
  queue.sort(sort);
  diverge(queue.pop()!);
}

console.log(`Answer 1: ${best - 1}`);

const newState = structuredClone(initialState);
newState.dropped[0].push(...[
  "elerium generator",
  "elerium-compatible microchip",
  "dilithium generator",
  "dilithium-compatible microchip",
]);
newState.total += 4;

queue.length = 0;
queue.push(newState);
best = Infinity;

while (queue.length) {
  queue.sort(sort);
  diverge(queue.pop()!);
}

console.log(`Answer 2: ${best - 1}`);
