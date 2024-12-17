#!/usr/bin/env -S deno run --allow-read

const inputText = await Deno.readTextFile(
  new URL("input.txt", import.meta.url),
);

const isNice1 = (str: string): boolean => {
  if (!/([aeiou].*?){3,}/.test(str)) return false;
  if (!/([a-z])\1/.test(str)) return false;
  if (/ab|cd|pq|xy/.test(str)) return false;
  return true;
};

const isNice2 = (str: string): boolean => {
  if (!/([a-z][a-z]).*?\1/.test(str)) return false;
  if (!/([a-z]).\1/.test(str)) return false;
  return true;
};

{
  let answerOne = 0;
  for (const str of inputText.trim().split("\n")) {
    if (isNice1(str)) answerOne++;
  }
  console.log(`Answer 1: ${answerOne}`);
}
{
  let answerTwo = 0;
  for (const str of inputText.trim().split("\n")) {
    if (isNice2(str)) answerTwo++;
  }
  console.log(`Answer 2: ${answerTwo}`);
}
