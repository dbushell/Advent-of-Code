#!/usr/bin/env -S deno run --allow-read

import { assert } from "jsr:@std/assert/assert";

const inputText = await Deno.readTextFile(
  new URL("input.txt", import.meta.url),
);

type Route = {
  path: Array<string>;
  distance: number;
};

const locations = new Set<string>();
const distances = new Map<string, number>();

for (const line of inputText.split("\n")) {
  const match = line.match(/^(\w+) to (\w+) = (\d+)$/);
  if (!match) continue;
  const [, a, b, d] = match;
  const distance = Number.parseInt(d);
  locations.add(a);
  locations.add(b);
  distances.set(`${a}-${b}`, distance);
  distances.set(`${b}-${a}`, distance);
}

assert(
  (distances.size) === ((locations.size - 1) * locations.size),
  "Missing location data",
);

const routes = new Map<string, Route>();

const generateRoute = (route: Route) => {
  let endOfLine = true;
  for (const next of locations) {
    if (route.path.includes(next)) continue;
    const previous = route.path.at(-1);
    const distance = distances.get(`${previous}-${next}`);
    if (!distance) continue;
    const newRoute = {
      path: [...route.path, next],
      distance: route.distance + distance,
    };
    generateRoute(newRoute);
    endOfLine = false;
  }
  if (endOfLine) {
    routes.set(route.path.join("-"), route);
  }
};

for (const from of locations) {
  const route: Route = { path: [from], distance: 0 };
  generateRoute(route);
}

const sortedRoutes = routes
  .values()
  .toArray()
  .sort((a, b) => (a.distance - b.distance));

const answerOne = sortedRoutes.at(0)!.distance;
const answerTwo = sortedRoutes.at(-1)!.distance;

console.log(`Answer 1: ${answerOne}`);
console.log(`Answer 2: ${answerTwo}`);
