#!/usr/bin/env -S deno run --allow-read

import { assert } from "jsr:@std/assert/assert";

const inputText = await Deno.readTextFile(
  new URL("input.txt", import.meta.url),
);

type Person = {
  name: string;
  happiness: Map<Person, number>;
  left: Person;
  right: Person;
};

const people = new Map<string, Person>();

const getPerson = (name: string): Person => {
  if (!people.has(name)) {
    const person = { name, happiness: new Map() };
    people.set(name, person as Person);
  }
  return people.get(name)!;
};

const getHappiness = (list: Array<Person>) => {
  let happiness = 0;
  for (const person of list) {
    const left = person.happiness.get(person.left);
    const right = person.happiness.get(person.right);
    assert(left !== undefined, "Missing left happiness");
    assert(right !== undefined, "Missing right happiness");
    // console.log(
    //   `${person.left.name} <- ${left} ${person.name} ${right} -> ${person.right.name}`,
    // );
    happiness += left + right;
  }
  return happiness;
};

const getArrangement = (names: Array<string>): Array<Person> => {
  const list = names.map((name) => getPerson(name)!);
  for (let i = 0; i < list.length; i++) {
    list[i].left = list.at(i - 1)!;
    list[i].right = list.at(i + 1) ?? list.at(0)!;
  }
  return list;
};

const getCombinations = (arr: Array<string>): Array<Array<string>> => {
  const result: Array<Array<string>> = [];
  const generate = (arr: Array<string>, start: number) => {
    if (start === arr.length - 1) {
      result.push([...arr]);
      return;
    }
    for (let i = start + 1; i < arr.length; i++) {
      [arr[start + 1], arr[i]] = [arr[i], arr[start + 1]];
      generate(arr, start + 1);
      [arr[start + 1], arr[i]] = [arr[i], arr[start + 1]];
    }
  };
  generate(arr, 0);
  return result;
};

for (const line of inputText.split("\n")) {
  const match = line.match(/^(\w+) would (gain|lose) (\d+).+?(\w+).$/);
  if (!match) continue;
  const p1 = getPerson(match[1]);
  const p2 = getPerson(match[4]);
  const value = ((match[2] === "lose") ? -1 : 1) * Number.parseInt(match[3]);
  p1.happiness.set(p2, value);
}

let answerOne = 0;
let answerTwo = 0;

let bestList: Array<Person> | undefined;

{
  const arrangements = getCombinations(people.keys().toArray());
  let bestHappiness = 0;
  for (const names of arrangements) {
    const list = getArrangement(names);
    const happiness = getHappiness(list);
    if (happiness > bestHappiness) {
      bestHappiness = happiness;
      bestList = list;
    }
  }
  answerOne = bestHappiness;
}

const self = getPerson("Self");
for (const person of people.values()) {
  self.happiness.set(person, 0);
  person.happiness.set(self, 0);
}

// Non brute force part 2
{
  assert(bestList);
  const names: Array<string> = [];
  let worstIndex = 0;
  let worstHappiness = Infinity;
  for (let i = 0; i < bestList.length; i++) {
    const p = bestList[i];
    names.push(p.name);
    const happiness = p.happiness.get(p.right)! + p.right.happiness.get(p)!;
    if (happiness < worstHappiness) {
      worstHappiness = happiness;
      worstIndex = i;
    }
  }
  names.splice(worstIndex, 0, "Self");
  const list = getArrangement(names);
  answerTwo = getHappiness(list);
}

// Bruce force part 2
// {
//   const arrangements = getCombinations(people.keys().toArray());
//   let bestHappiness = 0;
//   for (const names of arrangements) {
//     const list = getArrangement(names);
//     const happiness = getHappiness(list);
//     console.log(`${happiness}`);
//     if (happiness > bestHappiness) {
//       bestHappiness = happiness;
//     }
//   }
//   answerTwo = bestHappiness;
// }

console.log(`Answer 1: ${answerOne}`);
console.log(`Answer 2: ${answerTwo}`);
