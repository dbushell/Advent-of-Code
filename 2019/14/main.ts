#!/usr/bin/env -S deno run --allow-read

import { assert } from "jsr:@std/assert/assert";

const inputText = await Deno.readTextFile(
  new URL("input.txt", import.meta.url),
);

type Amount = { chemical: Chemical; quantity: number };

type Reaction = { input: Array<Amount>; output: Amount };

type Chemical = { id: string; reaction: Reaction };

type Smelt = {
  made: Array<Amount>;
  waste: Array<Amount>;
  usedOre: number;
  salvagedOre: number;
};

const chemicalMap = new Map<string, Chemical>();
const chemicalArray: Array<Chemical> = [];
const reactions: Array<Reaction> = [];

for (const line of inputText.split("\n")) {
  const parts = line.match(/^(.+) => (.+)$/);
  if (!parts) continue;
  const [, quantity, id] = parts[2].match(/^(\d+) (\w+)$/)!;
  if (!chemicalMap.has(id)) {
    chemicalMap.set(id, { id } as Chemical);
  }
  const reaction: Reaction = {
    input: [],
    output: {
      chemical: chemicalMap.get(id)!,
      quantity: Number.parseInt(quantity),
    },
  };
  assert(
    Number.isInteger(reaction.output.quantity),
    "Invalid quantity",
  );
  for (const input of parts[1].split(", ")) {
    const [, quantity, id] = input.match(/^(\d+) (\w+)$/)!;
    if (!chemicalMap.has(id)) {
      chemicalMap.set(id, { id } as Chemical);
    }
    reaction.input.push({
      chemical: chemicalMap.get(id)!,
      quantity: Number.parseInt(quantity),
    });
    assert(
      Number.isInteger(reaction.input.at(-1)!.quantity),
      "Invalid quantity",
    );
  }
  reactions.push(reaction);
}

chemicalMap.forEach((chemical) => {
  chemical.reaction = reactions.find((r) => r.output.chemical === chemical)!;
  if (chemical.id !== "ORE") assert(chemical.reaction, "Reaction not found!");
  chemicalArray.push(chemical);
});

const ORE = chemicalMap.get("ORE");
const FUEL = chemicalMap.get("FUEL");
assert(ORE, "ORE not found!");
assert(FUEL, "FUEL not found!");

const find = (arr: Array<Amount>, chemical: Chemical): Amount => {
  let amount = arr.find((q) => q.chemical === chemical);
  if (amount === undefined) {
    amount = { chemical, quantity: 0 };
    arr.push(amount);
  }
  return amount;
};

const smelt = (reaction: Reaction, needed = 1): Smelt => {
  const out: Smelt = { made: [], waste: [], salvagedOre: 0, usedOre: 0 };
  const target = reaction.output.chemical;
  while (find(out.made, target).quantity < needed) {
    for (const input of reaction.input) {
      if (input.chemical === ORE) {
        out.usedOre += input.quantity;
        continue;
      }
      if (input.chemical.reaction) {
        const { usedOre, made, waste } = smelt(
          input.chemical.reaction,
          input.quantity,
        );
        out.usedOre += usedOre;
        made.forEach((q) => {
          find(out.made, q.chemical).quantity += q.quantity;
        });
        waste.forEach((q) => {
          find(out.waste, q.chemical).quantity += q.quantity;
        });
        continue;
      }
    }
    find(out.made, target).quantity += reaction.output.quantity;
  }
  const smelted = find(out.made, target).quantity;
  find(out.waste, target).quantity += smelted - needed;
  return out;
};

const salvage = (amount: Amount): Array<Amount> => {
  if (amount.chemical === ORE) return [];
  if (amount.quantity === 0) return [];
  const { chemical, quantity } = amount;
  const save = Math.floor(quantity / chemical.reaction.output.quantity);
  if (save === 0) return [];
  amount.quantity -= save * chemical.reaction.output.quantity;
  const out: Array<Amount> = [];
  for (const input of chemical.reaction.input) {
    out.push({ chemical: input.chemical, quantity: input.quantity * save });
  }
  return out;
};

const oneFuel = (): Smelt => {
  const smelted = smelt(FUEL.reaction!);
  for (const amount of smelted.waste.toReversed()) {
    for (const recycle of salvage(amount)) {
      const existing = smelted.waste.find(({ chemical }) =>
        chemical === recycle.chemical
      );
      if (existing) existing.quantity += recycle.quantity;
      else smelted.waste.push(recycle);
    }
  }
  smelted.salvagedOre =
    smelted.waste.find((a) => a.chemical === ORE)?.quantity ?? 0;
  return smelted;
};

{
  const fuel = oneFuel();
  const answerOne = fuel.usedOre - fuel.salvagedOre;
  console.log(`Answer 1: ${answerOne}`);
}

/*************
 * PART TWO! *
 *************/

{
  const fuel = oneFuel();

  const orePerFuel = fuel.usedOre - fuel.salvagedOre;
  const wastePerFuel: { [key: string]: number } = {};
  fuel.waste.forEach((a) => (wastePerFuel[a.chemical.id] = a.quantity));

  const wasteMap = new Map<Chemical, Amount>();
  fuel.waste.forEach((a) => wasteMap.set(a.chemical, a));
  const oreWaste = wasteMap.get(ORE)!;

  let totalFuel = 0;
  let ore = 1_000_000_000_000;
  while (ore >= orePerFuel) {
    totalFuel++;
    ore -= orePerFuel;
    fuel.waste.forEach((amount) =>
      amount.quantity = Math.floor(
        amount.quantity += wastePerFuel[amount.chemical.id],
      )
    );
    oreWaste.quantity = 0;
    for (const amount of fuel.waste.toReversed()) {
      for (const recycle of salvage(amount)) {
        wasteMap.get(recycle.chemical)!.quantity += recycle.quantity;
      }
    }
    ore += oreWaste.quantity;
  }

  const answerTwo = totalFuel;
  console.log(`Answer 2: ${answerTwo}`);
}
