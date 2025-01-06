#!/usr/bin/env -S deno run --allow-read

import { crypto } from "jsr:@std/crypto/crypto";
import { encodeHex } from "jsr:@std/encoding/hex";

const inputText = (await Deno.readTextFile(
  new URL("input.txt", import.meta.url),
)).trim();

type XY = [number, number];

type State = {
  x: number;
  y: number;
  code: string;
  path: string;
};

const encoder = new TextEncoder();

const md5 = async (input: string): Promise<string> => {
  const hash = encodeHex(
    await crypto.subtle.digest("MD5", encoder.encode(input)),
  );
  return hash;
};

const distance = ([ax, ay]: XY, [bx, by]: XY) =>
  Math.abs(ax - bx) + Math.abs(ay - by);

const sort = (a: State, b: State) => {
  return distance([b.x, b.y], [3, 3]) - distance([a.x, a.y], [3, 3]);
};

const queue: Array<State> = [];
const success: Array<State> = [];

const diverge = async (state: State, shortest = true) => {
  if (shortest) {
    if (state.path.length > (success.at(-1)?.path?.length ?? Infinity)) {
      return;
    }
  }
  if (state.x === 3 && state.y === 3) {
    success.push(state);
    success.sort((a, b) => {
      if (shortest) [a, b] = [b, a];
      return (a.path.length - b.path.length);
    });
    return;
  }
  const hash = (await md5(state.code + state.path)).slice(0, 4);
  const chars = "bcdef";
  const U = state.y > 0 && chars.includes(hash[0]);
  const D = state.y < 3 && chars.includes(hash[1]);
  const L = state.x > 0 && chars.includes(hash[2]);
  const R = state.x < 3 && chars.includes(hash[3]);
  if (U) queue.push({ ...state, y: state.y - 1, path: state.path + "U" });
  if (D) queue.push({ ...state, y: state.y + 1, path: state.path + "D" });
  if (L) queue.push({ ...state, x: state.x - 1, path: state.path + "L" });
  if (R) queue.push({ ...state, x: state.x + 1, path: state.path + "R" });
};

const state: State = {
  x: 0,
  y: 0,
  code: inputText,
  path: "",
};

queue.push(structuredClone(state));
while (queue.length) {
  queue.sort(sort);
  await diverge(queue.pop()!);
}

console.log(`Answer 1: ${success.at(-1)!.path}`);

queue.push(structuredClone(state));
success.length = 0;
while (queue.length) {
  queue.sort(sort);
  await diverge(queue.pop()!, false);
}

console.log(`Answer 2: ${success.at(-1)!.path.length}`);
