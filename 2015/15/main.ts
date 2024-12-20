#!/usr/bin/env -S deno run --allow-read

import { assert } from "jsr:@std/assert/assert";

const inputText = await Deno.readTextFile(
  new URL("test1.txt", import.meta.url),
);

type Numeric<T> = { [K in keyof T]: T[K] extends number ? K : never }[keyof T];

type Ingredient = {
  name: string;
  capacity: number;
  durability: number;
  flavor: number;
  texture: number;
  calories: number;
};

type Recipe = Array<{
  ingredient: Ingredient;
  teaspoons: number;
}>;

const ingredients = new Map<string, Ingredient>();

const getIngredient = (name: string): Ingredient => {
  const ingredient = ingredients.get(name);
  assert(ingredient, `Unknown ingredient: "${name}"`);
  return ingredient;
};

const scoreRecipe = (recipe: Recipe): number => {
  const props: Array<Numeric<Ingredient>> = [
    "capacity",
    "durability",
    "flavor",
    "texture",
  ];
  const scores: Array<number> = [];
  for (const prop of props) {
    scores.push(
      recipe.map((
        { ingredient, teaspoons },
      ) => (ingredient[prop] * teaspoons))
        .reduce((score, amount) => score + amount, 0),
    );
  }
  return scores.reduce((c, v) => (c * v), 1);
};

for (const line of inputText.split("\n")) {
  const [name, props] = line.split(":", 2);
  if (!props) continue;
  const numbers = props
    .matchAll(/(-?\d+)/g).map((m) => Number.parseInt(m[0]))
    .toArray();
  assert(numbers.length === 5, "Invalid recipe");
  ingredients.set(name, {
    name,
    capacity: numbers[0],
    durability: numbers[1],
    flavor: numbers[2],
    texture: numbers[3],
    calories: numbers[4],
  });
}

const example: Recipe = [{
  ingredient: getIngredient("Butterscotch"),
  teaspoons: 44,
}, {
  ingredient: getIngredient("Cinnamon"),
  teaspoons: 56,
}];

console.log(scoreRecipe(example));
