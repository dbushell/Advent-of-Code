#!/usr/bin/env -S deno run --allow-read

import { assert } from "jsr:@std/assert/assert";

const inputText = await Deno.readTextFile(
  new URL("input.txt", import.meta.url),
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

const scoreRecipe = (recipe: Recipe): [number, number] => {
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
  const total = scores.reduce((c, v) => Math.max(0, c * v), 1);

  const calories = recipe.map((
    { ingredient, teaspoons },
  ) => (ingredient["calories"] * teaspoons))
    .reduce((score, amount) => score + amount, 0);

  return [total, calories];
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

const names = ingredients.keys().toArray();

let answerOne = 0;
let answerTwo = 0;

for (let a = 96; a >= 1; a--) {
  for (let b = 1; b <= 100 - a - 2; b++) {
    for (let c = 1; c <= 100 - a - b - 1; c++) {
      const d = 100 - a - b - c;
      const recipe: Recipe = [{
        ingredient: getIngredient(names[0]),
        teaspoons: a,
      }];
      recipe.push({
        ingredient: getIngredient(names[1]),
        teaspoons: b,
      });
      recipe.push({
        ingredient: getIngredient(names[2]),
        teaspoons: c,
      });
      recipe.push({
        ingredient: getIngredient(names[3]),
        teaspoons: d,
      });
      const [score, calories] = scoreRecipe(recipe);
      if (score > answerOne) {
        answerOne = score;
      }
      if (calories === 500 && score > answerTwo) {
        answerTwo = score;
      }
    }
  }
}

console.log(`Answer 1: ${answerOne}`);
console.log(`Answer 2: ${answerTwo}`);
