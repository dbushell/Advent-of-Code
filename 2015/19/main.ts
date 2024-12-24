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
  // for (let i = 0; i < molecule.length; i++) {
  //   if (molecule.substring(i, i + re.from.length) !== re.from) continue;
  //   const prefix = molecule.substring(0, i);
  //   const suffix = molecule.substring(i + re.from.length);
  //   const newMolecule = prefix + re.to + suffix;
  //   variations.add(newMolecule);
  // }
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

// const cache = new Map<string, number>();
const seen = new Set<string>();

type Queued = { molecule: string; steps: number };

let i = 0;

const queue: Array<Queued> = [];

const expand = ({ molecule, steps }: Queued) => {
  if (molecule === "e") {
    console.log(`\nAnswer 2: ${steps}`);
    queue.length = 0;
    return;
  }
  // console.log(
  //   String(steps).padStart(4, " "),
  //   String(molecule.length).padStart(4, " "),
  //   molecule,
  // );
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
