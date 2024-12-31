#!/usr/bin/env -S deno run --allow-read
/// <reference lib="webworker" />

import { assert } from "jsr:@std/assert/assert";

import { screen } from "../debug.ts";
import { adjacentXY, getXY, isXY, keyXY, sameXY } from "../helpers.ts";

const inputText = await Deno.readTextFile(
  new URL("input.txt", import.meta.url),
);

type XY = { x: number; y: number };

type Grid = Array<Array<string>>;

type Route = { key: string; path: Array<XY> };

type Deferred<T> = ReturnType<typeof Promise.withResolvers<T>>;

type State = {
  grid: Grid;
  locked: Map<string, string>;
  doors: Map<string, XY>;
  keys: Map<string, XY>;
  steps: number;
  history: string;
  me: Array<XY>;
};

let seed = "";
let divergence = 0;
let shortest = Infinity;
const queue: Array<{ state: State; route: Route }> = [];

const parse = (): State => {
  const state: State = {
    grid: [],
    locked: new Map(),
    doors: new Map(),
    keys: new Map(),
    history: "",
    steps: 0,
    me: [],
  };
  for (const line of inputText.trim().split("\n")) {
    state.grid.push(line.split(""));
  }
  for (let y = 0; y < state.grid.length; y++) {
    for (let x = 0; x < state.grid[y].length; x++) {
      const char = getXY(state.grid, { x, y }) as string;
      if (char === "@") state.me.push({ x, y });
      if (/[a-z]/.test(char)) state.keys.set(char, { x, y });
      if (/[A-Z]/.test(char)) {
        state.doors.set(char, { x, y });
        state.locked.set(keyXY({ x, y }), char);
      }
    }
  }
  assert(state.me.length, "Robot(s) not found");
  return state;
};

/** Route path around walls and locked doors */
const findXY = (state: State, start: XY, end: XY): Array<XY> => {
  const visited = new Map<string, XY | null>();
  const queue: Array<XY> = [start];
  visited.set(keyXY(start), null);
  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current.x === end.x && current.y === end.y) {
      const route: Array<XY> = [];
      let step: XY | null = current;
      while (step) {
        route.push(step);
        step = visited.get(keyXY(step)) || null;
      }
      return route.reverse();
    }
    for (const { x, y } of adjacentXY(current)) {
      const neighbor = { x, y };
      if (!isXY(state.grid, neighbor)) continue;
      if (getXY(state.grid, neighbor) === "#") continue;
      const key = keyXY(neighbor);
      if (state.locked.has(key)) continue;
      if (visited.has(key)) continue;
      visited.set(key, current);
      queue.push(neighbor);
    }
  }
  return [];
};

/** All available keys sorted longest route first */
const findKeys = (state: State) => {
  const routes: Array<Route> = [];
  for (const me of state.me) {
    for (const [key, xy] of state.keys) {
      const path = findXY(state, me, xy);
      if (path.length) routes.push({ key, path });
    }
  }
  routes.sort((a, b) => b.path.length - a.path.length);
  return routes;
};

const update = () => {
  self.postMessage({
    type: "status",
    seed,
    shortest,
    divergence,
    queue: queue.length,
  });
};

const diverge = (state: State, route: Route) => {
  divergence++;
  state = structuredClone(state);
  // Collect key
  state.steps += route.path.length - 1;
  state.history += route.key;
  // Give up
  if (state.steps >= shortest) {
    update();
    return;
  }
  const index = state.me.findIndex((xy) => sameXY(xy, route.path[0]));

  assert(index >= 0, "Me not found!");
  state.me[index] = route.path.at(-1)!;
  state.keys.delete(route.key);
  // Unlock door
  const door = state.doors.get(route.key.toUpperCase());
  if (door) {
    state.locked.delete(keyXY(door));
  }
  // Multiverse
  const nextRoutes = findKeys(state);
  for (const route of nextRoutes) {
    queue.push({ state, route });
  }
  if (nextRoutes.length === 0) {
    shortest = Math.min(state.steps, shortest);
  }
  update();
};

/*************
 *  WORKER!  *
 *************/

if (import.meta.url.endsWith("?worker")) {
  const state = parse();

  self.addEventListener("message", ({ data }: MessageEvent) => {
    switch (data.type) {
      case "seed": {
        seed = String(data.seed);
        const key = state.keys.get(seed);
        assert(key, "Bad key seed");
        let path: Array<XY> = [];
        for (const me of state.me) {
          path = findXY(state, me, key);
          if (path.length) break;
        }
        assert(path.length, "Bad key path");
        diverge(state, { path, key: seed });
        setInterval(() => {
          const next = queue.pop()!;
          if (!next) return;
          if (next.state.steps >= shortest) {
            divergence--;
          } else {
            diverge(next.state, next.route);
          }
        }, 0);
        break;
      }
      case "shortest": {
        const value = Number(data.shortest);
        assert(Number.isInteger(value), "Bad shortest update");
        shortest = Math.min(shortest, value);
        break;
      }
    }
  });
  self.postMessage({ type: "ready" });
} //

/*************
 *   MAIN!   *
 *************/
else {
  const workers: Array<
    {
      worker: Worker;
      ready: Deferred<boolean>;
      seed: string;
      shortest: number;
      divergence: number;
      queue: number;
    }
  > = [];

  const state = parse();
  const routes = findKeys(state);

  assert(
    routes.length < navigator.hardwareConcurrency,
    `${routes.length} threads required`,
  );

  for (let i = 0; i < routes.length; i++) {
    const worker = new Worker(import.meta.resolve("./main.ts?worker"), {
      type: "module",
    });
    const ready = Promise.withResolvers<boolean>();
    const spawn: typeof workers[number] = {
      worker,
      ready,
      seed: routes[i].key,
      shortest: 0,
      divergence: 0,
      queue: 0,
    };
    worker.addEventListener("message", ({ data }: MessageEvent) => {
      switch (data.type) {
        case "ready": {
          ready.resolve(true);
          worker.postMessage({ type: "seed", seed: routes[i].key });
          break;
        }
        case "status": {
          spawn.shortest = data.shortest as number;
          spawn.divergence = data.divergence as number;
          spawn.queue = data.queue as number;
          if (spawn.shortest < shortest) {
            shortest = spawn.shortest;
            workers.forEach(({ worker }) => {
              if (worker === spawn.worker) return;
              worker.postMessage({ type: "shortest", shortest });
            });
          }
          break;
        }
      }
    });
    workers.push(spawn);
  }

  await Promise.all(workers.map((w) => w.ready.promise));

  const refresh = () => {
    screen.clear();
    workers.forEach((worker) => {
      console.log(
        `${worker.seed.toUpperCase()}: ${worker.shortest}  divergence: ${worker.divergence}   queue: ${worker.queue}`,
      );
    });
    console.log(`Shortest: ${shortest}`);
    setTimeout(refresh, 1000 / 60);
  };

  refresh();
}
