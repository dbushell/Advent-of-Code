#!/usr/bin/env -S deno run --allow-read

import { assert } from "jsr:@std/assert/assert";

const inputText = await Deno.readTextFile(
  new URL("input.txt", import.meta.url),
);

enum EntityType {
  Box = "O",
  Empty = ".",
  Robot = "@",
  Wall = "#",
}

enum MoveType {
  Up = "^",
  Down = "v",
  Left = "<",
  Right = ">",
}

type XY = { x: number; y: number };
type Entity<T extends EntityType = EntityType> = { position: XY; type: T };
type Warehouse = Array<Array<Entity>>;
type Moveset = Array<MoveType>;

/** Returns true if entity is specific type */
const is = <T extends EntityType>(
  type: T,
  entity?: Entity<EntityType>,
): entity is Entity<T> => (entity?.type === type);

/** Change places! */
const swap = (warehouse: Warehouse, a: Entity, b: Entity) => {
  const { x: ax, y: ay } = a.position;
  const { x: bx, y: by } = b.position;
  a.position = { x: bx, y: by };
  b.position = { x: ax, y: ay };
  warehouse[ay][ax] = b;
  warehouse[by][bx] = a;
};

/** Return entities at position */
const at = (warehouse: Warehouse, { x, y }: XY): Entity | null => {
  if (x < 0 || y < 0) return null;
  if (y >= warehouse.length) return null;
  if (x >= warehouse[0].length) return null;
  return warehouse[y][x];
};

/** Return entities up, down, left, and right */
const adjacent = (
  warehouse: Warehouse,
  { x, y }: XY,
): { [key in MoveType]: Entity | null } => {
  return {
    [MoveType.Up]: at(warehouse, { x, y: y - 1 }),
    [MoveType.Down]: at(warehouse, { x, y: y + 1 }),
    [MoveType.Left]: at(warehouse, { x: x - 1, y }),
    [MoveType.Right]: at(warehouse, { x: x + 1, y }),
  };
};

/** Find the robot entity in the warehouse */
const getRobot = (warehouse: Warehouse): Entity<EntityType.Robot> => {
  const robot = warehouse.flat().find((entity) =>
    entity.type === EntityType.Robot
  );
  assert(is(EntityType.Robot, robot), "Robot AWOL");
  return robot;
};

/** Update the warehouse map based on the moveset */
const nextMove = (
  warehouse: Warehouse,
  robot: Entity<EntityType.Robot>,
  move: MoveType,
) => {
  write(`Step: ${move} `);
  // Get entity in target position
  const neighbour = adjacent(warehouse, robot.position)[move];
  // Validate
  if (neighbour === null) {
    assert(false, `Out of bounds`);
  }
  // Something has gone wrong...
  if (is(EntityType.Robot, neighbour)) {
    assert(false, `There are two robots?!`);
  }
  // Cannot move robot
  if (is(EntityType.Wall, neighbour)) {
    write(`Move blocked\n`);
    return;
  }
  // Move robot
  if (is(EntityType.Empty, neighbour)) {
    swap(warehouse, robot, neighbour);
    write(`Robot moved\n`);
    return;
  }
  // Push boxes
  if (is(EntityType.Box, neighbour)) {
    const boxes: Array<Entity<EntityType.Box>> = [];
    let n1 = neighbour;
    while (is(EntityType.Box, n1)) {
      boxes.push(n1);
      const n2 = adjacent(warehouse, n1.position)[move];
      assert(n2, "Out of bounds");
      // Cannot push
      if (is(EntityType.Wall, n2)) {
        write(`Push blocked\n`);
        return;
      }
      // Multiple boxes to push
      if (is(EntityType.Box, n2)) {
        n1 = n2;
        continue;
      }
      // Move all boxes and robot
      if (is(EntityType.Empty, n2)) {
        while (boxes.length) swap(warehouse, boxes.pop()!, n2);
        swap(warehouse, robot, n2);
        write(`Pushed boxes\n`);
        return;
      }
    }
    assert(false, `Push went wrong`);
  }
  assert(false, `Move went wrong`);
};

// Parse puzzle input
const parse = (text: string): [Warehouse, Moveset] => {
  const warehouse: Warehouse = [];
  const moves: Moveset = [];
  for (const line of text.split("\n")) {
    // Build map
    if (/^#[\.#O@]+#$/.test(line)) {
      const row: Warehouse[number] = [
        ...line.split("").map((char, x) => ({
          position: { x, y: warehouse.length },
          type: char as EntityType,
        })),
      ];
      if (warehouse.length) {
        assert(row.length === warehouse[0].length, "Invalid row length");
      }
      warehouse.push(row);

      continue;
    }
    if (/^[v^<>]+$/.test(line)) {
      // @ts-ignore Validated by regex
      moves.push(...line.split(""));
    }
  }
  return [warehouse, moves];
};

const encoder = new TextEncoder();
const write = (text: string) => Deno.stdout.writeSync(encoder.encode(text));

// Colour terminal output
const print = (warehouse: Warehouse) => {
  const ENTITIES: { [key in EntityType]: string } = {
    [EntityType.Box]: "\x1b[36mO\x1b[0m",
    [EntityType.Empty]: "\x1b[2m.\x1b[0m",
    [EntityType.Robot]: "\x1b[33m@\x1b[0m",
    [EntityType.Wall]: "\x1b[31m#\x1b[0m",
  };
  const XAXIS = () => {
    let out = " ";
    for (let x = 0; x < warehouse[0].length; x++) {
      out += ` \x1b[34m${String(x).at(-1)!}\x1b[0m`;
    }
    return `${out}\n`;
  };
  let out = XAXIS();
  for (let y = 0; y < warehouse.length; y++) {
    const Y = `\x1b[34m${String(y).at(-1)!}\x1b[0m`;
    out += `\x1b[34m${Y}\x1b[0m`;
    for (let x = 0; x < warehouse[y].length; x++) {
      const entity = at(warehouse, { x, y });
      out += " " + ENTITIES[entity!.type];
    }
    out += ` ${Y}\n`;
  }
  out += XAXIS();
  write(out + `\n`);
};

// Show the cursor before closing
const shutdown = () => {
  write("\x1b[?25h");
  Deno.exit();
};
Deno.addSignalListener("SIGTERM", shutdown);
Deno.addSignalListener("SIGINT", shutdown);

const sumGPS = (warehouse: Warehouse): number => {
  let sum = 0;
  const boxes = warehouse.flat().filter((entity) =>
    entity.type === EntityType.Box
  );
  boxes.forEach((box) => {
    sum += (100 * box.position.y) + box.position.x;
  });
  return sum;
};

{
  const [warehouse, moves] = parse(inputText);
  const robot = getRobot(warehouse);
  const FRAMERATE = 1000 / 120;

  // Hide cursor
  write("\x1b[?25l");
  // Clear screen
  write("\x1b[2J\x1b[H");
  print(warehouse);

  await new Promise((resolve) => setTimeout(resolve, FRAMERATE));

  let count = 1;
  const total = moves.length;
  while (moves.length) {
    performance.mark("start");
    write("\x1b[2J\x1b[H");
    nextMove(warehouse, robot, moves.shift()!);
    write("\n");
    print(warehouse);
    performance.mark("end");
    const { duration } = performance.measure("frame", "start", "end");
    const wait = Math.max(0, FRAMERATE - duration);
    const move = String(count).padStart(String(total).length, "0");
    write(moves.slice(0, 20).join(" ") + "\n\n");
    write(`move: ${move}/${total}\n`);
    write(`prev: ${duration.toFixed(3)}ms\n`);
    write(`next: ${wait.toFixed(3)}ms\n`);

    await new Promise((resolve) => setTimeout(resolve, wait));
    count++;
  }

  const answerOne = sumGPS(warehouse);
  console.log(`Answer 1: ${answerOne}`);
}

shutdown();
