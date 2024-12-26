#!/usr/bin/env -S deno run --allow-read

const inputText = await Deno.readTextFile(
  new URL("input.txt", import.meta.url),
);

type Group = Array<number>;

const packages: Group = inputText.trim().split(/\s+/).map((n) =>
  Number.parseInt(n)
);

/** Return total weight of packages */
const weigh = (packages: Group) => packages.reduce((t, v) => (t + v), 0);

/** Return quantum entanglement value of packages */
const entangle = (packages: Group) => packages.reduce((t, v) => (t * v), 1);

/** Return all variations */
const combinations = (
  packages: Group,
  maxLength = Infinity,
  maxWeight = Infinity,
): Array<Group> => {
  let all: Array<Group> = [[]];
  for (const p of packages) {
    const newGroups: Array<Array<number>> = [];
    for (const group of all) {
      const newGroup = [...group, p];
      if (newGroup.length > maxLength) continue;
      if (weigh(newGroup) > maxWeight) continue;
      newGroups.push(newGroup);
    }
    all = [...all, ...newGroups];
  }
  return all.slice(1);
};

/** Sort by best entanglement */
const sortGroups = (a: Group, b: Group) => {
  if (a.length === b.length) return entangle(a) - entangle(b);
  return a.length - b.length;
};

/** Find best group */
const bestGroup = (
  packages: Group,
  maxGroups: number,
  maxLength: number,
): Group => {
  const groups: Array<Group> = [];
  const maxWeight = weigh(packages) / maxGroups;
  let bestLength = Infinity;
  let bestEntanglement = Infinity;
  for (const g1 of combinations(packages, maxLength, maxWeight)) {
    const entanglement = entangle(g1);
    if (g1.length > bestLength) continue;
    if (g1.length === bestLength && entanglement > bestEntanglement) continue;
    if (weigh(g1) !== maxWeight) continue;
    bestEntanglement = entanglement;
    bestLength = g1.length;
    groups.push(g1);
  }
  groups.sort(sortGroups);
  return groups[0];
};

const answerOne = entangle(bestGroup(packages, 3, 6));
console.log(`Answer 1: ${answerOne}`);

const answerTwo = entangle(bestGroup(packages, 4, 5));
console.log(`Answer 2: ${answerTwo}`);
