#!/usr/bin/env -S deno run --allow-read

import { assert } from "jsr:@std/assert/assert";
import { dim, print, screen, write } from "./debug.ts";
import { adjacentXY, setXY } from "./helpers.ts";
import { isXY } from "./helpers.ts";
import { getXY } from "./helpers.ts";
import { Color, color } from "./debug.ts";
import { Cell, type State, type XY } from "./types.ts";

const inputText = await Deno.readTextFile(
  new URL("input.txt", import.meta.url),
);

const getRouteKey = (route: Array<XY>, position?: XY) => {
  let key = route.map(({ x, y }) => `${x}-${y}`).join(",");
  if (position) key += `,${position.x}-${position.y}`;
  return key;
};

const findRoute = (state: State, start: XY, end: XY): Array<XY> => {
  const length = state.grid.length;
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
      const route: Array<XY> = [end];
      let walk: XY | null = end;
      while (true) {
        walk = visited[walk.y][walk.x];
        assert(walk, "Path failed");
        route.push(walk);
        if (walk.x === start.x && walk.y === start.y) break;
      }
      return route.reverse();
    }
    // Continue search
    for (const { x, y } of adjacentXY(xy)) {
      if (!isXY(state, { x, y })) continue;
      if (getXY(state, xy) === Cell.Wall) continue;
      if (visited[y][x]) continue;
      visited[y][x] = xy;
      queue.push({ x, y });
    }
  }
  return [];
};

const parse = (input: string, state?: State): State => {
  state ??= {
    grid: [],
    start: { x: -1, y: -1 },
    end: { x: -1, y: -1 },
    current: { x: -1, y: -1 },
    routes: new Map(),
    routeKeys: new Set(),
    drawRoute: "",
    bestRoute: "",
    controller: new AbortController(),
    framerate: 0,
  };
  for (const line of input.split("\n")) {
    if (!/^#[\.ES#]+#$/.test(line)) continue;
    const y = state.grid.length;
    const cells = line.split("");
    const row = new Array(cells.length).fill(Cell.Empty);
    state.grid[y] = row;
    cells.forEach((cell, x) => {
      switch (cell as Cell) {
        case Cell.Empty:
          return;
        case Cell.Wall:
          setXY(state, { x, y }, Cell.Wall);
          return;
        case Cell.Start:
          state.start = { x, y };
          state.current = { x, y };
          return;
        case Cell.End:
          state.end = { x, y };
          return;
      }
    });
    if (state.grid.length > 1) {
      assert(
        state.grid.at(-1)?.length === state.grid.at(-2)?.length,
        "Bad grid row length",
      );
    }
  }
  assert(isXY(state, state.start), "Start not found");
  assert(isXY(state, state.end), "End not found");
  const route = findRoute(state, state.start, state.end);
  assert(route.length, "Initial route not found");
  state.routes.set(getRouteKey(route), route);
  return state;
};

{
  const state = parse(inputText);
  const shutdown = () => {
    state.controller.abort();
    screen.showCursor();
  };
  Deno.addSignalListener("SIGTERM", shutdown);
  Deno.addSignalListener("SIGINT", shutdown);

  const initialRoute = state.routes.values().toArray().at(0)!;
  const initialRouteKey = getRouteKey(initialRoute);
  state.routeKeys.add(initialRouteKey);
  state.drawRoute = initialRouteKey;
  state.bestRoute = initialRouteKey;

  state.framerate = initialRoute.length > 100 ? 1 : 1000 / 120;

  // Print initial state
  screen.hideCursor();
  screen.clear();
  if (state.framerate > 1) {
    write(print(state));
    await new Promise((resolve) => setTimeout(resolve, state.framerate));
  }

  for (let ps = 0; ps < initialRoute.length; ps++) {
    if (state.controller.signal.aborted) break;
    performance.mark("start");
    let out = "";

    state.drawRoute = initialRouteKey;

    // Position now
    state.current = initialRoute[ps];
    assert(isXY(state, state.current));

    const adjacent = adjacentXY(state.current);
    for (const xy of adjacent) {
      if (!isXY(state, xy)) continue;
      if (getXY(state, xy) !== Cell.Wall) continue;
      setXY(state, xy, Cell.Cheat);

      // Look for cheating route
      let route = findRoute(state, state.current, state.end);
      assert(route.length, "Dead end? How!");
      const prefix = initialRoute.slice(0, ps);
      route = [...prefix, ...route];

      if (route.length < initialRoute.length) {
        const routeKey = getRouteKey(route);
        state.drawRoute = routeKey;
        if (!state.routeKeys.has(routeKey)) {
          state.routeKeys.add(routeKey);
          state.routes.set(routeKey, route);
        }
        if (route.length < state.routes.get(state.bestRoute)!.length) {
          state.bestRoute = routeKey;
        }
      }
      setXY(state, xy, Cell.Wall);
    }

    if (state.framerate > 1) {
      out += print(state);
    }

    performance.mark("end");
    const { duration } = performance.measure("frame", "start", "end");
    const bestRoute = state.routes.get(state.bestRoute)!;
    out += color(`Pico:\t${ps}ps\n`, Color.Yellow);
    out += color(`Routes:\t${state.routes.size}\n`, Color.Blue);
    out += color(`Max:\t${initialRoute.length}\n`, Color.Red);
    out += color(`Min:\t${bestRoute.length}\n`, Color.Cyan);
    out += dim(`Frame:\t${duration.toFixed(2)}ms\n`);

    screen.clear();
    write(out);

    await new Promise((resolve) =>
      setTimeout(resolve, Math.max(0, state.framerate - duration))
    );
  }

  let answerOne = 0;

  const buckets: Array<number> = new Array(initialRoute.length).fill(0);
  for (const [, route] of state.routes) {
    if (route === initialRoute) continue;
    buckets[route.length]++;
  }
  write(`\n`);
  write(`Routes  Length  Saving\n`);
  for (let i = 0; i < buckets.length; i++) {
    if (buckets[i] === 0) continue;
    write(`${String(buckets[i]).padStart(6, " ")}`);
    write(`${String(i).padStart(8, " ")}`);
    write(`${String(initialRoute.length - i).padStart(8, " ")}\n`);
    if ((initialRoute.length - i) >= 100) {
      answerOne += buckets[i];
    }
  }

  write(`\n`);
  write(`Total: ${state.routes.size - 1}\n`);

  write(`\n`);
  write(`Answer 1: ${answerOne}\n`);

  shutdown();
}
