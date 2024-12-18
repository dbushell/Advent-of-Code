#!/usr/bin/env -S deno run --allow-read

import { assert } from "jsr:@std/assert/assert";
import { Color, color, dim, print, screen, write } from "./debug.ts";

const inputText = await Deno.readTextFile(
  new URL("input.txt", import.meta.url),
);

type XY = {
  x: number;
  y: number;
};

export enum Byte {
  Empty = 0,
  Corrupted = 1,
  Santa = 2,
}

type Memory = Array<Array<Byte>>;

export type State = {
  memory: Memory;
  bytes: Array<XY>;
  bytesFallen: Array<XY>;
  routes: Map<string, Array<XY>>;
  routeKeys: Set<string>;
  maxBytes: number;
  controller: AbortController;
  framerate: number;
};

const getKey = (route: Array<XY>, position?: XY) => {
  let key = route.map(({ x, y }) => `${x}-${y}`).join(",");
  if (position) key += `,${position.x}-${position.y}`;
  return key;
};

const upXY = ({ x, y }: XY) => ({ x, y: y - 1 });
const downXY = ({ x, y }: XY) => ({ x, y: y + 1 });
const leftXY = ({ x, y }: XY) => ({ x: x - 1, y });
const rightXY = ({ x, y }: XY) => ({ x: x + 1, y });
const adjacentXY = (xy: XY) => [upXY(xy), downXY(xy), leftXY(xy), rightXY(xy)];

const hasXY = (history: Array<XY>, position: XY): number => {
  return history.findIndex((
    { x, y },
  ) => (x === position.x && y === position.y));
};

const isValid = (state: State, { x, y }: XY): boolean => {
  if (x < 0 || y < 0) return false;
  if (y >= state.memory.length) return false;
  if (x >= state.memory[y].length) return false;
  return true;
};

const getByte = (state: State, { x, y }: XY): Byte => {
  assert(isValid(state, { x, y }), "getByte out of bounds");
  return state.memory[y][x];
};

const setByte = (state: State, { x, y }: XY, value: Byte) => {
  assert(isValid(state, { x, y }), "setByte out of bounds");
  assert(
    value === Byte.Corrupted || state.memory[y][x] !== Byte.Corrupted,
    `Memory already corrupted: ${x}-${y}`,
  );
  state.memory[y][x] = value;
};

const parse = (input: string, state?: State): State => {
  // Size memory for test and real input
  const isTest = input.length < 1000;
  const length = isTest ? 7 : 71;
  const maxBytes = isTest ? 12 : Infinity;
  state ??= {
    memory: Array.from(
      { length },
      () => new Array(length).fill(0),
    ),
    bytes: [],
    bytesFallen: [],
    maxBytes,
    routes: new Map(),
    routeKeys: new Set(),
    controller: new AbortController(),
    framerate: 0,
  };
  for (const line of input.split("\n")) {
    const match = line.match(/^(\d+),(\d+)$/);
    if (!match) continue;
    const [x, y] = match.slice(1, 3).map((n) => Number.parseInt(n));
    assert(Number.isInteger(x), "X bad input");
    assert(Number.isInteger(y), "Y bad input");
    state.bytes.push({ x, y });
  }
  return state;
};

const findRoute = (state: State, start: XY, end: XY): Array<XY> => {
  const length = state.memory.length;

  const visited: Array<Array<XY | null>> = Array.from(
    { length },
    () => Array(length).fill(null),
  );
  const queue: Array<XY> = [start];
  visited[start.y][start.x] = start;
  while (queue.length) {
    const xy = queue.shift()!;
    // Path found
    if (xy.x === end.x && xy.y === end.y) {
      const route: Array<XY> = [];
      let walk: XY | null = end;
      while (true) {
        walk = visited[walk.y][walk.x];
        assert(walk, "Path failed");
        if (walk.x === start.x && walk.y === start.y) break;
        route.push(walk);
      }
      return route.reverse();
    }
    // Continue search
    for (const { x, y } of adjacentXY(xy)) {
      if (!isValid(state, { x, y })) continue;
      if (getByte(state, xy) === Byte.Corrupted) continue;
      if (visited[y][x]) continue;
      visited[y][x] = xy;
      queue.push({ x, y });
    }
  }
  return [];
};

const tick = (state: State) => {
  if (state.controller.signal.aborted) return;
  if (state.bytes.length === 0) return;
  if (state.bytesFallen.length >= state.maxBytes) return;
  // New byte falls
  const byte = state.bytes.shift()!;
  setByte(state, byte, Byte.Corrupted);
  state.bytesFallen.push(byte);

  // Check if routes are broken
  for (const [key, route] of [...state.routes]) {
    if (!hasXY(route, byte)) continue;
    state.routes.delete(key);
    const size = state.memory.length - 1;
    const midRoute = findRoute(state, { x: 0, y: 0 }, { x: size, y: size });
    if (midRoute.length === 0) continue;
    const newRoute = [{ x: 0, y: 0 }, ...midRoute, { x: size, y: size }];
    const newKey = getKey(newRoute);
    // assert(state.routeKeys.has(newKey), "Path already explored");
    state.routeKeys.add(newKey);
    state.routes.set(newKey, newRoute);
  }
};

{
  const state = parse(inputText);
  const shutdown = () => {
    state.controller.abort();
    screen.showCursor();
  };
  state.framerate = 1000 / 120;
  state.framerate = 1;
  Deno.addSignalListener("SIGTERM", shutdown);
  Deno.addSignalListener("SIGINT", shutdown);

  // Print initial state
  screen.hideCursor();
  screen.clear();
  write(print(state));
  await new Promise((resolve) => setTimeout(resolve, state.framerate));

  {
    const size = state.memory.length - 1;
    const midRoute = findRoute(state, { x: 0, y: 0 }, { x: size, y: size });
    const route = [{ x: 0, y: 0 }, ...midRoute, { x: size, y: size }];
    const key = getKey(route);
    state.routeKeys.add(key);
    state.routes.set(key, route);
  }

  let answerOne = 0;
  let answerTwo = "";

  // Game loop
  while (state.bytes.length > 0) {
    if (state.controller.signal.aborted) break;

    if (state.bytesFallen.length === state.maxBytes) {
      break;
    }

    performance.mark("start");
    tick(state);

    // Sort shortest routes
    const routes = [...state.routes.values()].sort((
      a,
      b,
    ) => (b.length - a.length));
    assert(routes, "No routes");

    if (state.bytesFallen.length === 1024) {
      answerOne = (routes.at(-1)?.length ?? 0) - 1;
    }
    if (routes.length === 0) {
      answerTwo = `${state.bytesFallen.at(-1)!.x},${
        state.bytesFallen.at(-1)!.y
      }`;
      break;
    }

    // Clear old painted routes
    for (let y = 0; y < state.memory.length; y++) {
      for (let x = 0; x < state.memory[y].length; x++) {
        if (getByte(state, { x, y }) !== Byte.Corrupted) {
          setByte(state, { x, y }, Byte.Empty);
        }
      }
    }

    // Paint new routes
    for (const route of routes) {
      route.forEach((xy) => {
        setByte(state, xy, Byte.Santa);
      });
    }

    screen.clear();
    write(print(state));
    performance.mark("end");
    const { duration } = performance.measure("frame", "start", "end");
    write(
      color(
        `Bytes:\t${state.bytesFallen.length}/${
          state.bytes.length + state.bytesFallen.length
        }\n`,
        Color.Red,
      ),
    );
    write(`Routes:\t${routes.length}\n`);
    write(`Best:\t${routes.at(-1)!.length}\n`);
    write(dim(`Frame:\t${duration.toFixed(2)}ms\n`));

    await new Promise((resolve) =>
      setTimeout(resolve, Math.max(0, state.framerate - duration))
    );
  }

  write(`Answer 1: ${answerOne}\n`);
  write(`Answer 2: ${answerTwo}\n`);

  shutdown();
}
