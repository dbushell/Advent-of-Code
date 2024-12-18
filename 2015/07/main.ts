#!/usr/bin/env -S deno run --allow-read

import { assert } from "jsr:@std/assert/assert";

const inputText = await Deno.readTextFile(
  new URL("input.txt", import.meta.url),
);

enum Gate {
  AND = "AND",
  OR = "OR",
  NOT = "NOT",
  LSHIFT = "LSHIFT",
  RSHIFT = "RSHIFT",
}

type Wire = {
  id: string;
  deps: Array<Wire>;
  parts: Array<string | number>;
  value?: number;
};

const map = new Map<string, Wire>();
for (const line of inputText.split("\n")) {
  const match = line.match(/^([\w\s]+)-> ([a-z]+)$/);
  if (!match) continue;
  const parts = match[1].split(" ").filter((s) => s.trim().length);
  assert(parts.length, "Missing input");
  // Ensure output wire
  const out = map.get(match[2]);
  if (out) {
    out.parts = parts;
  } else {
    map.set(match[2], {
      id: match[2],
      deps: [],
      parts,
    });
  }
  // Ensure input wires
  for (const part of parts) {
    if (!/[a-z]+/.test(part)) continue;
    if (map.has(part)) continue;
    map.set(part, {
      id: part,
      deps: [],
      parts: [],
    });
  }
}
map.forEach((wire) => {
  // Link dependencies
  wire.deps = [
    ...map.values().filter((w) => wire.parts.includes(w.id)),
  ];
  // Parse integers
  wire.parts = wire.parts.map((part) => {
    if (typeof part === "string" && /\d+/.test(part)) {
      return Number.parseInt(part);
    }
    return part;
  });
});

// Return numeric value from signal
const getValue = (id: number | string): number => {
  if (typeof id === "number") return id;
  const value = map.get(id)?.value;
  assert(value !== undefined, `Value for "${id}" not calculated`);
  return value;
};

// Get flat list of nested dependencies
const getDependencies = (wire: Wire, dependencies?: Set<Wire>): Set<Wire> => {
  dependencies ??= new Set<Wire>();
  for (const dependency of wire.deps) {
    if (dependencies.has(dependency)) continue;
    dependencies.add(dependency);
    if (!dependency.deps.length) continue;
    for (const d of getDependencies(dependency, dependencies)) {
      dependencies.add(d);
    }
  }
  return dependencies;
};

const sortWires = (a: Wire, b: Wire): number => {
  const ad = getDependencies(a);
  const bd = getDependencies(b);
  assert(!(ad.has(b) && bd.has(a)), "Circular dependency detected!");
  if (ad.size === 0 && bd.size > 0) return -1;
  if (bd.size === 0 && ad.size > 0) return 1;
  if (bd.has(a)) return -1;
  if (ad.has(b)) return 1;
  return ad.size - bd.size;
};

// Order wires by dependency
const wires = [...map.values()];
wires.sort(sortWires);

// Compute values
const computeValues = () => {
  for (const wire of wires) {
    if (wire.parts.length === 1) {
      const value = getValue(wire.parts[0]);
      wire.value = value;
      continue;
    }
    if (wire.parts.length === 2) {
      assert(wire.parts[0] === Gate.NOT, "Expected NOT gate");
      wire.value = ~getValue(wire.parts[1]) & 0xFFFF;
      continue;
    }
    const v1 = getValue(wire.parts[0]);
    const v2 = getValue(wire.parts[2]);
    switch (wire.parts[1] as Gate) {
      case Gate.AND:
        wire.value = v1 & v2;
        continue;
      case Gate.OR:
        wire.value = v1 | v2;
        continue;
      case Gate.LSHIFT:
        wire.value = v1 << v2;
        continue;
      case Gate.RSHIFT:
        wire.value = v1 >> v2;
        continue;
    }
    assert(false, "Unknown instruction");
  }
};

computeValues();
const answerOne = map.get("a")?.value;
assert(typeof answerOne === "number", "Failed part 1!");
console.log(`Answer 1: ${answerOne}`);

/*************
 * PART TWO! *
 *************/

wires.forEach((wire) => {
  wire.value = undefined;
  if (wire.id === "b") wire.parts = [answerOne];
});
wires.sort(sortWires);
computeValues();

for (const wire of wires) {
  assert(wire.value !== undefined, "Missing wire value");
  assert(wire.value >= 0 && wire.value <= 65535, "Invalid wire value");
}

const answerTwo = map.get("a")?.value;
assert(typeof answerTwo === "number", "Failed part 2!");
console.log(`Answer 2: ${answerTwo}`);
