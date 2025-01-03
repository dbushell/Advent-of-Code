#!/usr/bin/env -S deno run --allow-read

const inputText = await Deno.readTextFile(
  new URL("input.txt", import.meta.url),
);

type Replacement = {
  from: string;
  to: string;
};

const replacements: Array<Replacement> = [];

let targetMolecule = "HOHOHO";

for (const line of inputText.split("\n")) {
  const match = line.match(/^(\w+) => (\w+)$/);
  if (match) {
    replacements.push({
      from: match[1],
      to: match[2],
    });
    continue;
  }
  if (/\w+/.test(line)) {
    targetMolecule = line.trim();
  }
}

const variations = new Set<string>();

for (const re of replacements) {
  for (const match of targetMolecule.matchAll(new RegExp(re.from, "g"))) {
    const i = match.index;
    const prefix = targetMolecule.slice(0, i);
    const suffix = targetMolecule.slice(i + re.from.length);
    const newMolecule = prefix + re.to + suffix;
    variations.add(newMolecule);
  }
}

const answerOne = variations.size;
console.log(`Answer 1: ${answerOne}`);

/*************
 * PART TWO! *
 *************/

type Queued = { molecule: string; steps: number };

const seen = new Set<string>();
const queue: Array<Queued> = [];

const expand = ({ molecule, steps }: Queued) => {
  if (molecule === "e") {
    console.log(`Answer 2: ${steps}`);
    queue.length = 0;
    return;
  }
  for (const re of replacements) {
    for (const match of molecule.matchAll(new RegExp(re.to, "g"))) {
      const i = match.index;
      const prefix = molecule.slice(0, i);
      const suffix = molecule.slice(i + re.to.length);
      const newMolecule = prefix + re.from + suffix;
      if (!seen.has(newMolecule)) {
        seen.add(molecule);
        queue.push({ molecule: newMolecule, steps: steps + 1 });
      }
    }
  }
};

queue.push({
  molecule: targetMolecule,
  steps: 0,
});

while (queue.length) {
  const test = queue.pop()!;
  expand(test);
  queue.sort((a: Queued, b: Queued) => (b.molecule.length - a.molecule.length));
}
