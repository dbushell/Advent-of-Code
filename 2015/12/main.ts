#!/usr/bin/env -S deno run --allow-read

const inputText = await Deno.readTextFile(
  new URL("input.txt", import.meta.url),
);

type JSONValue =
  | boolean
  | number
  | null
  | string
  | JSONArray
  | JSONObject;

type JSONArray = Array<JSONValue>;

interface JSONObject {
  [key: string]: JSONValue;
}

const count = (value: JSONValue, ignore?: Set<string>): number => {
  if (typeof value === "number") return value;
  if (typeof value === "boolean") return 0;
  if (typeof value === "string") return 0;
  if (value === null) return 0;
  if (Array.isArray(value)) {
    return value.reduce<number>((c, v) => (c + count(v, ignore)), 0);
  }
  let c = 0;
  for (const v of Object.values(value)) {
    if (typeof v === "string" && ignore?.has(v)) return 0;
    c += count(v, ignore);
  }
  return c;
};

{
  const parse = JSON.parse(inputText) as JSONValue;
  const answerOne = count(parse);
  console.log(`Answer 1: ${answerOne}`);

  const answerTwo = count(parse, new Set(["red"]));
  console.log(`Answer 2: ${answerTwo}`);
}
