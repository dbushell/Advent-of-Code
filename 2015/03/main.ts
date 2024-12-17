#!/usr/bin/env -S deno run --allow-read

const inputText = await Deno.readTextFile(
  new URL("input.txt", import.meta.url),
);

let map = new Map<string, number>();

const key = ([x, y]: [number, number]) => (`${x}-${y}`);

const count = (location: [number, number]) => {
  map.set(key(location), (map.get(key(location)) ?? 0) + 1);
};

{
  let santa: [number, number] = [0, 0];
  count(santa);
  for (const char of inputText) {
    const [x, y] = santa;
    switch (char) {
      case "^":
        santa = [x, y - 1];
        break;
      case "v":
        santa = [x, y + 1];
        break;
      case "<":
        santa = [x - 1, y];
        break;
      case ">":
        santa = [x + 1, y];
        break;
      default:
        continue;
    }
    count(santa);
  }
  const answerOne = map.size;
  console.log(`Answer 1: ${answerOne}`);
}

{
  map = new Map<string, number>();
  const santa: [number, number] = [0, 0];
  const robot: [number, number] = [0, 0];
  count(santa);
  count(robot);
  const location = { santa, robot };
  let who: keyof typeof location = "santa";
  for (const char of inputText) {
    const [x, y] = location[who];
    switch (char) {
      case "^":
        location[who] = [x, y - 1];
        break;
      case "v":
        location[who] = [x, y + 1];
        break;
      case "<":
        location[who] = [x - 1, y];
        break;
      case ">":
        location[who] = [x + 1, y];
        break;
      default:
        continue;
    }
    count(location[who]);
    who = who === "santa" ? "robot" : "santa";
  }
  const answerTwo = map.size;
  console.log(`Answer 2: ${answerTwo}`);
}
