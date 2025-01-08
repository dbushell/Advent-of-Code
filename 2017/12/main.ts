#!/usr/bin/env -S deno run --allow-read

const inputText = await Deno.readTextFile(
  new URL("input.txt", import.meta.url),
);

type Program = {
  id: number;
  link: Set<Program>;
};

const programs = new Map<number, Program>();

// Parse input and link bidirectional
for (const line of inputText.split("\n")) {
  const match = line.match(/^(\d+) <-> (.+?)$/);
  if (!match) continue;
  const conns = match[2].split(", ").map(Number);
  const id1 = Number(match[1]);
  if (!programs.has(id1)) programs.set(id1, { id: id1, link: new Set() });
  for (const id2 of conns) {
    if (!programs.has(id2)) programs.set(id2, { id: id2, link: new Set() });
    programs.get(id2)!.link.add(programs.get(id1)!);
    programs.get(id1)!.link.add(programs.get(id2)!);
  }
}

// Count grouped programs
const group = (p1: Program, seen?: Set<Program>): number => {
  seen ??= new Set([]);
  if (seen.has(p1)) return 0;
  seen.add(p1);
  return Array.from(p1.link).reduce((c, p2): number => c + group(p2, seen), 1);
};

// Count unique groups
const seen = new Set<Program>();
let groups = 0;
while (true) {
  const difference = new Set(programs.values()).difference(seen);
  if (difference.size === 0) break;
  group(difference.values().next().value!, seen);
  groups++;
}

console.log(`Answer 1: ${group(programs.get(0)!)}`);
console.log(`Answer 2: ${groups}`);
