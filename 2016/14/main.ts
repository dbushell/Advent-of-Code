#!/usr/bin/env -S deno run --allow-read

import { crypto } from "jsr:@std/crypto/crypto";
import { encodeHex } from "jsr:@std/encoding/hex";

const inputText = (await Deno.readTextFile(
  new URL("input.txt", import.meta.url),
)).trim();

const encoder = new TextEncoder();

const md5 = async (input: string): Promise<string> => {
  const hash = encodeHex(
    await crypto.subtle.digest("MD5", encoder.encode(input)),
  );
  return hash;
};

type Hash = {
  hash: string;
  index: number;
  three: RegExpMatchArray | null;
  five: RegExpMatchArray | null;
};

{
  const keys: Array<Hash> = [];
  const hashes: Array<Hash> = [];
  for (let i = 0; keys.length < 64; i++) {
    const hash = await md5(`${inputText}${i}`);
    hashes.push({
      hash,
      index: i,
      three: hash.match(/([\w\d])\1\1/),
      five: hash.match(/([\w\d])\1\1\1\1/),
    });
    if (i > 1000) {
      const maybe = hashes[i - 1001];
      if (!maybe.three) continue;
      for (const { five } of hashes.slice(i - 1000, i)) {
        if (maybe.three[1] === five?.[1]) {
          keys.push(maybe);
          break;
        }
      }
    }
  }
  console.log(`Answer 1: ${keys.at(-1)!.index}`);
}

{
  const keys: Array<Hash> = [];
  const hashes: Array<Hash> = [];

  for (let i = 0; keys.length < 64; i++) {
    let hash = await md5(`${inputText}${i}`);
    for (let h = 0; h < 2016; h++) {
      hash = await md5(hash);
    }
    hashes.push({
      hash,
      index: i,
      three: hash.match(/([\w])\1\1/),
      five: hash.match(/([\w])\1\1\1\1/),
    });
    if (i > 1000) {
      const maybe = hashes[i - 1001];
      if (!maybe.three) continue;
      for (const { five } of hashes.slice(i - 1000, i)) {
        if (maybe.three[1] === five?.[1]) {
          keys.push(maybe);
          break;
        }
      }
    }
  }

  console.log(`Answer 2: ${keys.at(-1)!.index}`);
}
