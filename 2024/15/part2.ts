#!/usr/bin/env -S deno run --allow-read

import { assert } from "jsr:@std/assert/assert";

const inputText = await Deno.readTextFile(
  new URL("input.txt", import.meta.url),
);

enum EntityType {
  BoxL = "[",
  BoxR = "]",
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

type BoxType = EntityType.BoxL | EntityType.BoxR;

type XY = { x: number; y: number };
type Entity<T extends EntityType = EntityType> = { position: XY; type: T };
type Warehouse = Array<Array<Entity>>;
type Moveset = Array<MoveType>;

/** Returns true if entity is specific type */
const is = <T extends EntityType>(
  type: T,
  entity: Entity<EntityType> | undefined | null,
): entity is Entity<T> => (entity?.type === type);

/** Returns true if entity of start or end of box */
const isBox = (
  entity: Entity | undefined | null,
): entity is Entity<BoxType> => {
  return is(EntityType.BoxL, entity) || is(EntityType.BoxR, entity);
};

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
  // Push boxes left or right
  if (isBox(neighbour) && [MoveType.Left, MoveType.Right].includes(move)) {
    const boxes: Array<Entity<BoxType>> = [];
    let n1 = neighbour;
    while (isBox(n1)) {
      boxes.push(n1);
      const n2 = adjacent(warehouse, n1.position)[move];
      assert(n2, "Out of bounds");
      // Cannot push
      if (is(EntityType.Wall, n2)) {
        write(`Horizontal push blocked\n`);
        return;
      }
      // Multiple boxes to push
      if (isBox(n2)) {
        n1 = n2;
        continue;
      }
      // Move all boxes and robot
      if (is(EntityType.Empty, n2)) {
        while (boxes.length) swap(warehouse, boxes.pop()!, n2);
        swap(warehouse, robot, n2);
        write(`Horizontal push\n`);
        return;
      }
    }
    assert(false, `Push went wrong`);
  }
  // Push boxes up or down
  if (isBox(neighbour) && [MoveType.Up, MoveType.Down].includes(move)) {
    let blocked = false;
    const boxSet = new Set<Entity<BoxType>>();
    // Follow movement direction to find more boxes
    const findBox = (e1: Entity<BoxType>) => {
      const e2 = adjacent(warehouse, e1.position)[move];
      if (isBox(e2)) addBox(e2);
      if (is(EntityType.Wall, e2)) {
        blocked = true;
      }
    };
    // Add both box parts and continue search
    const addBox = (e1: Entity<BoxType>) => {
      let e2: Entity<BoxType>;
      const tmp = adjacent(warehouse, e1.position);
      if (e1.type === EntityType.BoxL) {
        e2 = tmp[MoveType.Right] as typeof e2;
        assert(is(EntityType.BoxR, e2), "Missing right side");
      }
      if (e1.type === EntityType.BoxR) {
        e2 = tmp[MoveType.Left] as typeof e2;
        assert(is(EntityType.BoxL, e2), "Missing left side");
      }
      assert(isBox(e2!), "Missing box side");
      boxSet.add(e1);
      boxSet.add(e2);
      findBox(e1);
      findBox(e2);
    };
    addBox(neighbour);
    if (blocked) {
      write(`Vertical push blocked\n`);
      return;
    }
    assert(boxSet.size % 2 === 0, "Uneven box parts");
    // Move boxes one by one
    const boxList = [...boxSet];
    boxList.sort((
      { position: { y: ay } },
      { position: { y: by } },
    ) => (move === MoveType.Up ? by - ay : ay - by));
    while (boxList.length) {
      const box = boxList.pop()!;
      const tmp = adjacent(warehouse, box.position);
      swap(warehouse, box, tmp[move]!);
    }
    // Finally move robot
    const tmp = adjacent(warehouse, robot.position);
    swap(warehouse, robot, tmp[move]!);
    write(`Vertical push\n`);
    return;
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
      const row: Warehouse[number] = [];
      line.split("").map((char, x) => {
        const e1: Entity = {
          position: { x: x * 2, y: warehouse.length },
          type: char as EntityType,
        };
        const e2: Entity = {
          position: { x: (x * 2) + 1, y: warehouse.length },
          type: char as EntityType,
        };
        if (char === "O") {
          e1.type = EntityType.BoxL;
          e2.type = EntityType.BoxR;
        }
        if (char === "@") {
          e2.type = EntityType.Empty;
        }
        row.push(e1, e2);
      });
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
    [EntityType.BoxL]: "\x1b[36m[\x1b[0m",
    [EntityType.BoxR]: "\x1b[36m]\x1b[0m",
    [EntityType.Empty]: "\x1b[2m.\x1b[0m",
    [EntityType.Robot]: "\x1b[33m@\x1b[0m",
    [EntityType.Wall]: "\x1b[31m#\x1b[0m",
  };
  const XAXIS = () => {
    let out = " ";
    for (let x = 0; x < warehouse[0].length; x++) {
      out += ` \x1b[34m${String(x).at(-1)!}\x1b[0m`;
    }
    return ` ${out}\n`;
  };
  let out = XAXIS();
  for (let y = 0; y < warehouse.length; y++) {
    const Y = `\x1b[34m${String(y).at(-1)!}\x1b[0m`;
    out += `\x1b[34m${Y}\x1b[0m `;
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
    entity.type === EntityType.BoxL
  );
  boxes.forEach((box) => {
    sum += (100 * box.position.y) + box.position.x;
  });
  return sum;
};

{
  const [warehouse, moves] = parse(inputText);
  const robot = getRobot(warehouse);
  const FRAMERATE = 1000 / 480;

  // Hide cursor
  write("\x1b[?25l");
  // Clear screen
  write("\x1b[2J\x1b[H");
  write("Start...\n\n");
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

  const answerTwo = sumGPS(warehouse);
  console.log(`Answer 2: ${answerTwo}`);
}

shutdown();
