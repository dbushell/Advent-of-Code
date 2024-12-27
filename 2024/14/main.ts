#!/usr/bin/env -S deno run --allow-read --allow-write

import { assert } from "jsr:@std/assert/assert";

const inputText = await Deno.readTextFile(
  new URL("input.txt", import.meta.url),
);

type XY = { x: number; y: number };
type Robot = { position: XY; velocity: XY };
type Floor = Array<Array<number>>;

const createMap = (width: number, height: number): Floor => {
  return Array.from(
    { length: height },
    () => new Array(width).fill(0),
  );
};

const calcMove = (p: number, v: number, d: number, s: number): number => {
  const end = (p + v * s) % d;
  return end < 0 ? end + d : end;
};

const move = (map: Floor, robot: Robot, seconds: number) => {
  robot.position.x = calcMove(
    robot.position.x,
    robot.velocity.x,
    map[0].length,
    seconds,
  );
  robot.position.y = calcMove(
    robot.position.y,
    robot.velocity.y,
    map.length,
    seconds,
  );
};

const add = (map: Floor, position: XY) => {
  map[position.y][position.x]++;
};

const writeMap = (map: Floor, robots: Array<Robot>, id: string) => {
  map = structuredClone(map);
  robots.forEach((robot) => (add(map, robot.position)));
  const lines = map.map((i) => i.join("").replaceAll("0", "."));
  Deno.writeTextFileSync(
    new URL(`${id}.txt`, import.meta.url),
    lines.join("\n"),
  );
};

const parseRobots = (input: string): Array<Robot> => {
  const robots: Array<Robot> = [];
  for (const line of input.split("\n")) {
    if (!line.length) continue;
    const match = line.match(/^p=(\d+),(\d+)\s+v=(-?\d+),(-?\d+)$/);
    assert(match, "Robot input invalid");
    const [px, py, vx, vy] = match.slice(1, 5).map((n) => Number.parseInt(n));
    robots.push({
      position: { x: px, y: py },
      velocity: { x: vx, y: vy },
    });
  }
  return robots;
};

const countQuadrants = (map: Floor) => {
  const quadrants = [0, 0, 0, 0];
  const mx = map[0].length / 2;
  const my = map.length / 2;
  for (let y = 0; y < map.length; y++) {
    for (let x = 0; x < map[0].length; x++) {
      const c = map[y][x];
      if (x < Math.floor(mx)) {
        if (y < Math.floor(my)) quadrants[0] += c;
        if (y >= Math.ceil(my)) quadrants[2] += c;
      }
      if (x >= Math.ceil(mx)) {
        if (y < Math.floor(my)) quadrants[1] += c;
        if (y >= Math.ceil(my)) quadrants[3] += c;
      }
    }
  }
  return quadrants;
};

let answerOne = 0;
let answerTwo = 0;

{
  const robots = parseRobots(inputText);
  const map = createMap(101, 103);
  for (const robot of robots) {
    for (let i = 0; i < 100; i++) {
      move(map, robot, 1);
    }
    add(map, robot.position);
  }
  answerOne = countQuadrants(map).reduce(
    (factor, count) => factor * count,
    1,
  );
}

{
  const robots = parseRobots(inputText);
  const map = createMap(101, 103);
  // Map starts repeating after 10403 iterations I think
  for (let i = 0; i < 10_403; i++) {
    for (const robot of robots) {
      move(map, robot, 1);
    }
    const map2 = structuredClone(map);
    for (const robot of robots) add(map2, robot.position);
    let found = true;
    mainLoop: for (let y = 0; y < map2.length; y++) {
      for (let x = 0; x < map2[y].length; x++) {
        if (map2[y][x] > 1) {
          found = false;
          break mainLoop;
        }
      }
    }
    if (found) {
      writeMap(map, robots, String(i + 1));
      answerTwo = i + 1;
      break;
    }
  }
}

console.log(`Answer 1: ${answerOne}`);
console.log(`Answer 2: ${answerTwo}`);

// const printMap = (map: Floor, robots: Array<Robot>) => {
//   map = structuredClone(map);
//   robots.forEach((robot) => (add(map, robot.position)));
//   const columns = Array.from({ length: map[0].length }, (_, i) => i).join(" ");
//   const underline = new Array(map[0].length).fill("--").join("");
//   console.log(`%c    ${columns}`, "color:yellow");
//   console.log(`%c  +${underline}-+`, "color:yellow");
//   map.forEach((row, i) => {
//     const num = String(i).padEnd(2, " ");
//     const points = row.join(" ").replaceAll("0", ".");
//     console.log(
//       `%c${num}|%c ${points} %c| ${num}`,
//       "color:yellow",
//       "color:white",
//       "color:yellow",
//     );
//   });
//   console.log(`%c  +${underline}-+`, "color:yellow");
//   console.log(`%c    ${columns}`, "color:yellow");
// };

// {
//   console.log(`\nMovement example\n`);
//   const map = createMap(11, 7);
//   const test: Array<Robot> = [{
//     position: { x: 2, y: 4 },
//     velocity: { x: 2, y: -3 },
//   }];
//   printMap(map, test);
//   for (let i = 0; i < 5; i++) {
//     move(map, test[0], 1);
//     printMap(map, test);
//   }
// }

// {
//   console.log(`\nFull example\n`);
//   const inputText = await Deno.readTextFile(
//     new URL("test1.txt", import.meta.url),
//   );
//   const robots = parseRobots(inputText);
//   const map = createMap(11, 7);

//   console.log(`Start`);
//   printMap(map, robots);
//   for (const robot of robots) {
//     move(map, robot, 100);
//     add(map, robot.position);
//   }
//   console.log(`End`);
//   printMap(map, robots);
//   const quadrants = countQuadrants(map);
//   const factor = quadrants.reduce((factor, count) => factor * count, 1);
//   console.log(`Safety Factor: ${factor}`);
// }
