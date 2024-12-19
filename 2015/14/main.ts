#!/usr/bin/env -S deno run --allow-read

const inputText = await Deno.readTextFile(
  new URL("input.txt", import.meta.url),
);

type Reindeer = {
  name: string;
  kms: number;
  fly: number;
  rest: number;
  score: number;
  distance: number;
  inFlight: number;
  atRest: number;
  next: "fly" | "rest";
};

const reindeer = new Map<string, Reindeer>();

for (const line of inputText.split("\n")) {
  const match = line.match(/^(\w+).+?(\d+).+?(\d+).+?(\d+).+?$/);
  if (!match) continue;
  const [name, ...values] = match.slice(1, 5);
  const [kms, fly, rest] = values.map((n) => Number.parseInt(n));
  reindeer.set(name, { name, kms, fly, rest } as Reindeer);
}

// Create new race
const start = (): Array<Reindeer> => {
  const race = reindeer.values().toArray();
  for (const deer of race) {
    deer.inFlight = deer.fly;
    deer.atRest = 0;
    deer.score = 0;
    deer.distance = 0;
    deer.next = "rest";
  }
  return race;
};

// Move forward one second
const tick = (race: Array<Reindeer>) => {
  for (const deer of race) {
    if (deer.inFlight) {
      deer.inFlight--;
      deer.distance += deer.kms;
    }
    if (deer.atRest) {
      deer.atRest--;
    }
    if (deer.atRest === 0 && deer.next === "fly") {
      deer.inFlight = deer.fly;
      deer.next = "rest";
    }
    if (deer.inFlight === 0 && deer.next === "rest") {
      deer.atRest = deer.rest;
      deer.next = "fly";
    }
  }
};

// Part 1
{
  const race = start();
  for (let i = 0; i < 2502; i++) {
    tick(race);
  }
  race.sort((a, b) => (b.distance - a.distance));
  const answerOne = race[0].distance;
  console.log(`Answer 1: ${answerOne}`);
}

// Part 2
{
  const race = start();
  for (let i = 0; i < 2502; i++) {
    tick(race);
    race.sort((a, b) => (b.distance - a.distance));
    const best = race[0].distance;
    for (const deer of race) {
      if (deer.distance === best) deer.score++;
    }
  }
  race.sort((a, b) => (b.score - a.score));
  const answerTwo = race[0].score;
  console.log(`Answer 2: ${answerTwo}`);
}
