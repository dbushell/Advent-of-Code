#!/usr/bin/env -S deno run --allow-read

import { assert } from "jsr:@std/assert/assert";

const inputText = await Deno.readTextFile(
  new URL("input.txt", import.meta.url),
);

enum Gate {
  AND = "AND",
  OR = "OR",
  XOR = "XOR",
}

type Output = 1 | 0;

type Deferred<T> = ReturnType<typeof Promise.withResolvers<T>>;

type Wire = {
  id: string;
  inputs: Array<Wire>;
  outputs: Array<Wire>;
  value: Deferred<Output>;
  gate?: Gate;
  depedencies: Set<Wire>;
};

type WireMap = Map<string, Wire>;

/** Get wire or create if it doesn't exist */
const ensureWire = (map: WireMap, id: string): Wire => {
  if (!map.has(id)) {
    map.set(id, {
      id,
      inputs: [],
      outputs: [],
      value: Promise.withResolvers<Output>(),
      depedencies: new Set(),
    });
  }
  return map.get(id)!;
};

/** Sort wires by least dependencies */
const sortWires = (a: Wire, b: Wire): number => {
  const ad = a.depedencies;
  const bd = b.depedencies;
  assert(!(ad.has(b) && bd.has(a)), "Circular dependency?");
  if (ad.size === 0 && bd.size > 0) return -1;
  if (bd.size === 0 && ad.size > 0) return 1;
  const ai = a.inputs;
  const bi = b.inputs;
  if (/^[xy]/.test(ai[0]?.id) && /^[xy]/.test(bi[0]?.id)) {
    return Number(ai[0].id.substring(1)) -
      Number(bi[0].id.substring(1));
  }
  if (bd.has(a)) return -1;
  if (ad.has(b)) return 1;
  return ad.size - bd.size;
};

/** Recursively find wire connections */
const getDependencies = (wire: Wire): Array<Wire> => {
  const depedencies: Array<Wire> = [];
  wire.inputs.forEach((input) => {
    assert(depedencies.includes(wire) === false, "Circular?");
    depedencies.push(input);
    depedencies.push(...getDependencies(input));
  });
  return depedencies;
};

/** Connect all wires by input */
const linkDependencies = (map: WireMap): void => {
  for (const wire of map.values()) {
    wire.depedencies.clear();
    getDependencies(wire).forEach((w) => wire.depedencies.add(w));
    wire.inputs.forEach((input) => {
      if (!input.outputs.includes(wire)) {
        input.outputs.push(wire);
      }
    });
  }
};

/** Connect inputs to resolve output */
const linkPromises = (map: WireMap): void => {
  const wires = map.values().toArray();
  wires.sort(sortWires);
  for (const wire of wires) {
    // Skip seed values
    if (wire.inputs.length === 0) continue;
    // Wait for inputs
    Promise.all([
      wire.inputs[0].value.promise,
      wire.inputs[1].value.promise,
    ]).then(([v1, v2]) => {
      // Apply logic gate
      let output: Output = 0;
      assert(wire.gate, "No gate?");
      switch (wire.gate) {
        case "AND":
          output = (v1 && v2) ? 1 : 0;
          break;
        case "OR":
          output = (v1 || v2) ? 1 : 0;
          break;
        case "XOR":
          output = (v1 !== v2) ? 1 : 0;
          break;
      }
      // Resolve output
      wire.value.resolve(output);
    });
  }
};

/** Parse input and generate new map */
const parseInput = (input = inputText): WireMap => {
  const map: WireMap = new Map<string, Wire>();
  for (const line of input.split("\n")) {
    // Match starting inputs
    const seed = line.match(/^([x|y]\d+): (\d+)$/);
    if (seed) {
      const output = Number.parseInt(seed[2]) as Output;
      assert([1, 0].includes(output), "Bad output value");
      const wire = ensureWire(map, seed[1]);
      wire.value.resolve(output);
      continue;
    }
    // Mach connections
    const conn = line.match(/^(\w+) ([A-Z]+) (\w+) -> (\w+)$/);
    if (conn) {
      const gate = conn[2] as Gate;
      assert(Object.values(Gate).includes(gate));
      const in1 = ensureWire(map, conn[1]);
      const in2 = ensureWire(map, conn[3]);
      const wire = ensureWire(map, conn[4]);
      wire.inputs.push(in1, in2);
      wire.gate = gate;
      continue;
    }
  }
  return map;
};

/** Calculate output for wire group */
const xyzNumber = async (
  map: WireMap,
  char: "x" | "y" | "z",
): Promise<number> => {
  const regexp = new RegExp(`^${char}\\d+$`);
  let num = 0n;
  for (const wire of map.values()) {
    if (!regexp.test(wire.id)) continue;
    num |= BigInt(await wire.value.promise) <<
      BigInt(Number.parseInt(wire.id.substring(1)));
  }
  return Number(num);
};

/*************
 * PART ONE! *
 *************/

{
  const wireMap = parseInput();
  linkPromises(wireMap);
  const answerOne = await xyzNumber(wireMap, "z");
  console.log(`Answer 1: ${answerOne}\n`);
}

/*************
 * PART TWO! *
 *************/

/** Test addition */
const testNumber = async (
  map: WireMap,
): Promise<[boolean, number, number, number]> => {
  const x = await xyzNumber(map, "x");
  const y = await xyzNumber(map, "y");
  const z = await xyzNumber(map, "z");
  return [x + y === z, x, y, z];
};

/** Swap wire inputs by pair */
const swapInput = (a: Wire, b: Wire) => {
  [a.inputs, b.inputs] = [b.inputs, a.inputs];
  const gate = a.gate;
  a.gate = b.gate;
  b.gate = gate;
};

/** Reset the resolved values */
const resetOutput = (map: WireMap): void => {
  map.forEach((wire) => {
    if (wire.inputs.length === 0) return;
    wire.value = Promise.withResolvers<Output>();
  });
  // This is only useful for testing
  linkDependencies(map);
  linkPromises(map);
};

{
  const wireMap = parseInput();
  linkPromises(wireMap);
  linkDependencies(wireMap);
  const wires = wireMap.values().toArray();
  wires.sort(sortWires);

  const badWires = new Set<Wire>();
  wires.find((wire) => {
    if (wire.gate !== "XOR") return false;
    if (/^[xyz]/.test(wire.id)) return false;
    if (wire.outputs.length === 0) return false;
    if (wire.outputs[0].gate === "XOR") return false;
    if (wire.outputs[0].gate === "AND") return false;
    badWires.add(wire);
    return true;
  });
  for (const wire of wires) {
    if (wire.id === "z45") continue;
    if (wire.id.startsWith("z") && wire.gate !== "XOR") {
      badWires.add(wire);
    }
    if (wire.gate === "AND" && wire.outputs[0]?.gate !== "OR") {
      if (!wire.inputs[0].id.endsWith("00")) {
        badWires.add(wire);
      }
    }
    if (wire.gate === "XOR" && !/^[xyz]/.test(wire.id)) {
      const a = /^[xyz]/.test(wire.inputs[0].id);
      const b = /^[xyz]/.test(wire.inputs[1].id);
      if (!(a || b)) badWires.add(wire);
    }
  }

  console.log(
    `Answer 2: ${
      Array.from(badWires)
        .map((w) => w.id)
        .sort((a, b) => a.localeCompare(b))
        .join(",")
    }`,
  );

  console.log(`\nFinding pairs...`);

  const badIds = [...badWires].map((w) => w.id);
  const pairSet: Set<string> = new Set();
  for (let i = 0; i < badIds.length; i++) {
    for (let j = i + 1; j < badIds.length; j++) {
      pairSet.add(
        [badIds[i], badIds[j]]
          .sort((a, b) => a.localeCompare(b))
          .join(","),
      );
    }
  }
  const pairs = Array.from(pairSet).map((p) => p.split(","));
  for (const p1 of pairs) {
    for (const p2 of pairs) {
      if (new Set([p1, p2].flat()).size !== 4) continue;
      for (const p3 of pairs) {
        if (new Set([p1, p2, p3].flat()).size !== 6) continue;
        for (const p4 of pairs) {
          if (new Set([p1, p2, p3, p4].flat()).size !== 8) continue;
          try {
            swapInput(wireMap.get(p1[0])!, wireMap.get(p1[1])!);
            swapInput(wireMap.get(p2[0])!, wireMap.get(p2[1])!);
            swapInput(wireMap.get(p3[0])!, wireMap.get(p3[1])!);
            swapInput(wireMap.get(p4[0])!, wireMap.get(p4[1])!);
            resetOutput(wireMap);
            const [match, x, y, z] = await testNumber(wireMap);
            if (!match) continue;
            console.log(p1, p2, p3, p4);
            console.log(`x:${x} + y:${y} = z:${z} ? ${match}`);
            Deno.exit();
          } catch { /* Bad swap */ }
        }
      }
    }
  }
}
