#!/usr/bin/env -S deno run --allow-read

import { assert } from "jsr:@std/assert/assert";

const inputText = await Deno.readTextFile(
  new URL("input.txt", import.meta.url),
);

enum Type {
  End = "E",
  Empty = ".",
  Reindeer = "S",
  Wall = "#",
}

enum Move {
  North = "^",
  South = "v",
  East = ">",
  West = "<",
}

type XY = { x: number; y: number };
type Entity<T extends Type = Type> = { position: XY; type: T };
type Maze = Array<Array<Entity>>;

type Reindeer = {
  key: string;
  route: string;
  position: XY;
  direction: Move;
  moves: number;
  turns: number;
  history: Array<XY>;
  finished?: boolean;
  retired?: boolean;
};

type State = {
  maze: Maze;
  deers: Map<string, Reindeer>;
  deerKeys: Set<string>;
  bestScore: number;
  finishedDeers: Array<Reindeer>;
  retiredDeers: number;
  finished: boolean;
  backlog: Array<Reindeer>;
  history: Array<Array<{ [key in Move]: number }>>;
  winning: Reindeer;
};

const getKey = (deer: Reindeer, direction: Move) => {
  return deer.route + direction;
};

const getScore = (deer: Reindeer) => (deer.moves + (deer.turns * 1000));

/** Returns true if entity is specific type */
const is = <T extends Type>(
  entity: Entity<Type> | undefined | null,
  type: T,
): entity is Entity<T> => (entity?.type === type);

const northXY = ({ x, y }: XY) => ({ x, y: y - 1 });
const southXY = ({ x, y }: XY) => ({ x, y: y + 1 });
const eastXY = ({ x, y }: XY) => ({ x: x + 1, y });
const westXY = ({ x, y }: XY) => ({ x: x - 1, y });

const getXY = (position: XY, direction: Move) => {
  switch (direction) {
    case Move.North:
      return northXY(position);
    case Move.South:
      return southXY(position);
    case Move.East:
      return eastXY(position);
    case Move.West:
      return westXY(position);
  }
};

/** Return entities at position */
const at = (maze: Maze, { x, y }: XY): Entity | null => {
  if (x < 0 || y < 0) return null;
  if (y >= maze.length) return null;
  if (x >= maze[0].length) return null;
  return maze[y][x];
};

const atNorth = (maze: Maze, position: XY) => at(maze, northXY(position));
const atSouth = (maze: Maze, position: XY) => at(maze, southXY(position));
const atEast = (maze: Maze, position: XY) => at(maze, eastXY(position));
const atWest = (maze: Maze, position: XY) => at(maze, westXY(position));

/** Return entities up, down, left, and right */
const atAdjacent = (
  maze: Maze,
  position: XY,
): { [key in Move]: Entity | null } => {
  return {
    [Move.North]: atNorth(maze, position),
    [Move.South]: atSouth(maze, position),
    [Move.East]: atEast(maze, position),
    [Move.West]: atWest(maze, position),
  };
};

/** Returns count at position of entity type (or -1 if not) */
const has = (
  maze: Maze,
  space: Entity | XY | null,
  match: Type,
): boolean => {
  if (space === null) return false;
  if (!("type" in space)) {
    space = at(maze, space);
  }
  if (space === null) return false;
  return is(space, match);
};

/** Parse puzzle input */
const parse = (text: string): [Maze, XY] => {
  const maze: Maze = [];
  let start: XY | undefined;
  for (const line of text.split("\n")) {
    // Build map
    if (/^#[\.ES#]+#$/.test(line)) {
      const row: Maze[number] = [];
      line.split("").forEach((char, x) => {
        const entity: Entity = {
          position: { x, y: maze.length },
          type: char as Type,
        };
        if (entity.type === Type.Reindeer) {
          start = { x, y: maze.length };
          entity.type = Type.Empty;
        }
        row.push(entity);
      });
      if (maze.length) {
        assert(row.length === maze[0].length, "Invalid row length");
      }
      maze.push(row);
      continue;
    }
  }
  assert(start, "Reindeer not found");
  return [maze, start];
};

const tick = (state: State) => {
  const { maze, deers, deerKeys } = state;

  // Actions after deer loop
  const moveMap = new Map<Reindeer, Move>();
  const cloneSet = new Set<
    { deer: Reindeer; direction: Move; turns: number }
  >();

  // Iterate over deers (do not modify deers inside loop!)
  for (const [, deer] of deers) {
    const score = getScore(deer);

    // Update counts
    if (deer.finished) {
      if (score < state.bestScore) {
        state.bestScore = score;
        state.winning = deer;
      }
      state.finishedDeers.push(deer);
      deers.delete(deer.key);
      continue;
    }
    if (deer.retired) {
      state.retiredDeers++;
      deers.delete(deer.key);
      continue;
    }

    if (!state.winning.finished) {
      if (state.winning.retired) {
        state.winning = deer;
      }
      if (deer.history.length > state.winning.history.length) {
        state.winning = deer;
      }
    }

    // Check score for x/y/direction
    const ref = state.history[deer.position.y][deer.position.x];
    // Save best score
    if (score < ref[deer.direction]) {
      ref[deer.direction] = score;
    }
    if (score > ref[deer.direction]) {
      deer.retired = true;
      continue;
    }
    // Check score against finished score
    if (score >= state.bestScore) {
      deer.retired = true;
      continue;
    }

    // Detect backtrack - never the shortest?
    if (deer.history.length > 3) {
      const { x, y } = deer.history.at(-1)!;
      // for (let i = 0; i < deer.history.length - 1; i++) {
      for (let i = deer.history.length - 2; i >= 0; i--) {
        if (deer.history[i].x === x && deer.history[i].y === y) {
          deer.retired = true;
          continue;
        }
      }
    }

    const { direction, position } = deer;
    const adjacent = atAdjacent(maze, position);
    const forward = adjacent[direction];
    assert(forward, "Out of bounds");

    // Move deer to end
    if (has(maze, forward, Type.End)) {
      deer.position = getXY(position, direction);
      deer.history.push(deer.position);
      deer.route += direction;
      deer.finished = true;
      deer.moves++;
      continue;
    }

    // Branch left and right
    if ([Move.North, Move.South].includes(direction)) {
      if (is(adjacent[Move.East], Type.Empty)) {
        cloneSet.add({ deer, direction: Move.East, turns: 1 });
      }
      if (is(adjacent[Move.West], Type.Empty)) {
        cloneSet.add({ deer, direction: Move.West, turns: 1 });
      }
    }

    // Branch up and down
    if ([Move.East, Move.West].includes(direction)) {
      if (is(adjacent[Move.North], Type.Empty)) {
        cloneSet.add({ deer, direction: Move.North, turns: 1 });
      }
      if (is(adjacent[Move.South], Type.Empty)) {
        cloneSet.add({ deer, direction: Move.South, turns: 1 });
      }
    }

    // Move deer into empty space
    if (has(maze, forward, Type.Empty)) {
      moveMap.set(deer, direction);
      continue;
    }

    deer.retired = true;
    continue;
  }

  for (const clone of cloneSet) {
    cloneSet.delete(clone);
    const newKey = getKey(clone.deer, clone.direction);
    if (deerKeys.has(newKey)) continue;
    const newDeer = structuredClone<Reindeer>(clone.deer);
    newDeer.retired = false;
    newDeer.finished = false;
    newDeer.direction = clone.direction;
    newDeer.turns += clone.turns;
    newDeer.key = newKey;
    deerKeys.add(newKey);
    state.backlog.push(newDeer);
  }

  while (state.backlog.length) {
    const newDeer = state.backlog.pop();
    assert(newDeer);
    deers.set(newDeer.key, newDeer);
  }

  // Move deers
  for (const [deer, direction] of moveMap) {
    deer.position = getXY(deer.position, direction);
    deer.history.push(deer.position);
    deer.route += direction;
    deer.moves++;
  }

  if (deers.size === 0 && state.backlog.length === 0) {
    state.finished = true;
  }
};

const encoder = new TextEncoder();
const write = (text: string) => Deno.stdout.writeSync(encoder.encode(text));

// Colour terminal output
const print = ({ maze, deers, winning }: State) => {
  const ENTITIES: { [key in Type]: string } = {
    [Type.End]: "\x1b[36mE\x1b[0m",
    [Type.Empty]: "\x1b[2m.\x1b[0m",
    [Type.Reindeer]: "\x1b[33mS\x1b[0m",
    [Type.Wall]: "\x1b[31m#\x1b[0m",
  };
  const XAXIS = () => {
    let out = " ";
    for (let x = 0; x < maze[0].length; x++) {
      out += ` \x1b[34m${String(x).at(-1)!}\x1b[0m`;
    }
    return `${out}\n`;
  };
  let out = XAXIS();
  const xyMap = new Map<string, number>();
  for (const deer of deers.values()) {
    if (deer.retired) continue;
    const key = `${deer.position.x}-${deer.position.y}`;
    let count = xyMap.get(key) ?? 0;
    xyMap.set(key, ++count);
  }
  for (let y = 0; y < maze.length; y++) {
    const Y = `\x1b[34m${String(y).at(-1)!}\x1b[0m`;
    out += `\x1b[34m${Y}\x1b[0m`;
    for (let x = 0; x < maze[y].length; x++) {
      const entity = at(maze, { x, y })!;
      out += " ";
      const xy = `${x}-${y}`;
      if (winning.history.some((xy) => xy.x === x && xy.y === y)) {
        out += "\x1b[32m*\x1b[0m";
      } else if (xyMap.has(xy)) {
        out += `\x1b[33m${String(xyMap.get(xy)).at(-1)!}\x1b[0m`;
      } else {
        out += ENTITIES[entity.type];
      }
    }
    out += ` ${Y}\n`;
  }
  out += XAXIS();
  write(out + `\n`);
};

{
  const [maze, start] = parse(inputText);

  // Setup list with starting deer
  const deers = new Map<string, Reindeer>();
  const deer: Reindeer = {
    key: "+",
    route: "+",
    position: start,
    moves: 0,
    turns: 0,
    direction: Move.East,
    history: [start],
  };
  deers.set(deer.key, deer);

  const state: State = {
    maze,
    deers,
    deerKeys: new Set([deer.key]),
    bestScore: Infinity,
    finishedDeers: [],
    retiredDeers: 0,
    finished: false,
    backlog: [],
    history: [],
    winning: deer,
  };

  for (let y = 0; y < maze.length; y++) {
    state.history[y] = [];
    for (let x = 0; x < maze[y].length; x++) {
      state.history[y][x] = {
        [Move.North]: Infinity,
        [Move.South]: Infinity,
        [Move.East]: Infinity,
        [Move.West]: Infinity,
      };
    }
  }

  const FRAMERATE = 1000 / 120;

  // Hide cursor
  write("\x1b[?25l");
  // Clear screen
  write("\x1b[2J\x1b[H");

  const working = Promise.withResolvers();
  const shutdown = () => {
    working.reject();
    // Show the cursor before closing
    write("\x1b[?25h");
    Deno.exit();
  };
  Deno.addSignalListener("SIGTERM", shutdown);
  Deno.addSignalListener("SIGINT", shutdown);

  const frame = () => {
    if (state.finished) {
      working.resolve(true);
      return;
    }
    performance.mark("start");
    tick(state);
    performance.mark("end");
    const { duration } = performance.measure("frame", "start", "end");
    write("\x1b[2J\x1b[H");
    print(state);
    write(`${duration.toFixed(3)}ms\n`);
    write(`Active: ${deers.size}\n`);
    write(`Backlog: ${state.backlog.length}\n`);
    write(`Retired: ${state.retiredDeers}\n`);
    write(`Finished: ${state.finishedDeers.length}\n`);
    write(`Total: ${state.deerKeys.size}\n`);
    write(`Best score: ${state.bestScore}\n`);
    setTimeout(frame, Math.max(0, FRAMERATE - duration));
  };
  frame();
  await working.promise;

  // Temporary binary map to merge best routes
  const best: Array<Array<number>> = [];
  for (let y = 0; y < maze.length; y++) {
    best[y] = [];
    for (let x = 0; x < maze[y].length; x++) {
      best[y][x] = 0;
    }
  }
  // Plot best routes on temporary map
  state.finishedDeers.forEach((deer) => {
    if (getScore(deer) !== state.bestScore) return;
    for (const { x, y } of deer.history) best[y][x] = 1;
  });
  // Count unique points
  const answerTwo = best.flat().reduce((a, v) => (a + v), 0);

  write("\n");
  write(`Answer 1: ${state.bestScore}\n`);
  write(`Answer 2: ${answerTwo}\n`);
}
