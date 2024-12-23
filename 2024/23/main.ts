#!/usr/bin/env -S deno run --allow-read

import { assert } from "jsr:@std/assert/assert";

const inputText = await Deno.readTextFile(
  new URL("input.txt", import.meta.url),
);

type PC = {
  name: string;
  links: Array<PC>;
};

const pcMap = new Map<string, PC>();
const pcArray = [];

const sortAbc = (a: PC, b: PC) => a.name.localeCompare(b.name);

const linkPCs = (n1: string, n2: string) => {
  const p1 = pcMap.get(n1);
  const p2 = pcMap.get(n2);
  assert(p1, "PC1 missing");
  assert(p2, "PC2 missing");
  p1.links.push(p2);
  p2.links.push(p1);
  p1.links.sort(sortAbc);
  p2.links.sort(sortAbc);
};

const createPC = (name: string) => ({ name, links: [], direct: [] });

// Add all PCs to map and link them
for (const line of inputText.trim().split("\n")) {
  const [, n1, n2] = line.match(/^(\w\w)-(\w\w)$/)!;
  if (!pcMap.has(n1)) pcMap.set(n1, createPC(n1));
  if (!pcMap.has(n2)) pcMap.set(n2, createPC(n2));
  linkPCs(n1, n2);
}

// Create array from map
pcArray.push(...pcMap.values());
assert(pcMap.size === pcArray.length, "PC length mismatch");

// Find direct sets of three
const threes = new Set<string>();
pcArray.sort(sortAbc);
for (const p1 of pcArray) {
  for (const p2 of p1.links) {
    for (const p3 of p1.links) {
      if (p3 === p2) continue;
      if (!p2.links.includes(p3)) continue;
      const set = [p1, p2, p3];
      set.sort(sortAbc);
      const setKey = [...set].map((p) => p.name).join(",");
      threes.add(setKey);
    }
  }
}
// Count names starting with "t"
const answerOne = [...threes.keys()]
  .filter((key) => (/t[a-z]/.test(key)))
  .length;
console.log(`Answer 1: ${answerOne}`);

/*************
 * PART TWO! *
 *************/

const getConns = (p1: PC, conns: Array<PC> = []): Array<PC> => {
  if (conns.includes(p1)) return [];
  conns.push(...p1.links);
  p1.links.forEach((p2) => {
    if (conns.includes(p2)) return;
    conns.push(...getConns(p2));
  });
  return conns;
};

const connArrayKeys = new Set<string>();
const connArrayList: Array<Array<PC>> = [];

for (const pc of pcArray) {
  const conns = [pc].concat(getConns(pc));
  const connected = new Set<PC>();
  mainLoop: for (const p1 of conns) {
    for (const p2 of conns) {
      if (p1 === p2) continue;
      for (const p3 of conns) {
        if (p3 === p1 || p3 === p2) continue;
        if (p2.links.includes(p3) === false) continue mainLoop;
      }
      connected.add(p2);
    }
  }
  const connArray = connected.values().toArray();
  connArray.sort(sortAbc);
  const key = connArray.map((p) => p.name).join(",");
  if (connArrayKeys.has(key)) continue;
  connArrayKeys.add(key);
  connArrayList.push(connArray);
}

// Sort password alphabetically
connArrayList.sort((a, b) => (a.length - b.length));

const answerTwo = connArrayList.at(-1)!.map((p) => p.name);
console.log(`Answer 2: ${answerTwo}`);
