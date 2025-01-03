#!/usr/bin/env -S deno run --allow-read

import { crypto } from "jsr:@std/crypto/crypto";
import { encodeHex } from "jsr:@std/encoding/hex";

const inputText = (await Deno.readTextFile(
  new URL("input.txt", import.meta.url),
)).trim();

const encoder = new TextEncoder();

const hash = async (text: string) =>
  encodeHex(await crypto.subtle.digest("MD5", encoder.encode(text)));

let answerOne = "";
const answerTwo: Array<string> = [];
for (let i = 0; i < Infinity; i++) {
  const hex = await hash(inputText + i);
  if (!hex.startsWith("00000")) continue;
  if (answerOne.length < 8) answerOne += hex[5];
  const position = Number.parseInt(hex[5]);
  if (position < 8) answerTwo[position] ??= hex[6];
  if (answerOne.length + answerTwo.join("").length === 16) break;
}

console.log(`Answer 1: ${answerOne}`);
console.log(`Answer 2: ${answerTwo.join("")}`);
