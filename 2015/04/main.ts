#!/usr/bin/env -S deno run --allow-read

import { crypto } from "jsr:@std/crypto/crypto";
import { encodeHex } from "jsr:@std/encoding/hex";

const inputText = (await Deno.readTextFile(
  new URL("input.txt", import.meta.url),
)).trim();

const encoder = new TextEncoder();

{
  for (let i = 0; i < 1e6; i++) {
    const hash = encodeHex(
      await crypto.subtle.digest("MD5", encoder.encode(`${inputText}${i}`)),
    );
    if (hash.startsWith("00000")) {
      console.log(`Answer 1: ${i}`);
      break;
    }
  }
}

{
  for (let i = 0; i < 1e7; i++) {
    const hash = encodeHex(
      await crypto.subtle.digest("MD5", encoder.encode(`${inputText}${i}`)),
    );
    if (hash.startsWith("000000")) {
      console.log(`Answer 2: ${i}`);
      break;
    }
  }
}
