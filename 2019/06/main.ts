#!/usr/bin/env -S deno run --allow-read

import { assert } from "jsr:@std/assert/assert";

const inputText = await Deno.readTextFile(
  new URL("input.txt", import.meta.url),
);

type Thing = {
  id: string;
  direct?: Thing;
  indirect: Array<Thing>;
};

const thingMap = new Map<string, Thing>();

// Ensure and return thing
const createThing = (id: string): Thing => {
  if (!thingMap.has(id)) thingMap.set(id, { id, indirect: [] });
  return thingMap.get(id)!;
};

// Parse input for direct orbits
for (const line of inputText.trim().split("\n")) {
  const [, id1, id2] = line.match(/^(\w+)\)(\w+)$/)!;
  assert(id1 && id2, "Invalid input");
  const parent = createThing(id1);
  const child = createThing(id2);
  child.direct = parent;
}

// Link indirect orbits
for (const [, thing] of thingMap) {
  let parent = thing.direct;
  while ((parent = parent?.direct)) {
    thing.indirect.push(parent);
  }
}

// Calculate total number of orbits
let answerOne = 0;
for (const thing of thingMap.values()) {
  if (thing.direct) answerOne += 1 + thing.indirect.length;
}
console.log(`Answer 1: ${answerOne}`);

// Calculate orbit transfers
const YOU = thingMap.get("YOU");
const SAN = thingMap.get("SAN");
assert(YOU && SAN, "YOU and SAN not found");
const o1 = [YOU.direct!.id, ...YOU.indirect.map((t) => t.id)];
const o2 = [SAN.direct!.id, ...SAN.indirect.map((t) => t.id)];
const o3 = new Set(o1).intersection(new Set(o2));
const common = Array.from(o3)[0];
assert(common, "No YOU-SAN connection");
const answerTwo = o1.indexOf(common) + o2.indexOf(common);
console.log(`Answer 2: ${answerTwo}`);
