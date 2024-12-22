#!/usr/bin/env -S deno run --allow-read

import { assert } from "jsr:@std/assert/assert";

const inputText = await Deno.readTextFile(
  new URL("input.txt", import.meta.url),
);

const mixSecret = (a: bigint, b: bigint): bigint => {
  const result = a ^ b;
  assert(result >= 0, "Bad XOR mix");
  return result;
};

const pruntSecret = (a: bigint): bigint => {
  const result = a % BigInt(16777216);
  return result;
};

const nextSecret = (a: bigint): bigint => {
  let secret = a;
  const multiply = secret * BigInt(64);
  secret = mixSecret(multiply, secret);
  secret = pruntSecret(secret);
  const divide = secret / BigInt(32);
  secret = mixSecret(divide, secret);
  secret = pruntSecret(secret);
  const multiply2 = secret * BigInt(2048);
  secret = mixSecret(multiply2, secret);
  const result = pruntSecret(secret);
  return result;
};

{
  console.log(`Example: 123`);
  let secret = BigInt(123);
  for (let i = 0; i < 10; i++) {
    secret = nextSecret(secret);
    console.log(secret);
  }
  console.log("\n");
}

{
  // Parse initial input
  const buyers: Array<bigint> = [];
  inputText.split("\n").forEach((secret) => {
    if (!/^\d+$/.test(secret)) return;
    buyers.push(BigInt(secret));
  });
  console.log(buyers);

  let answerOne = BigInt(0);

  for (let secret of buyers) {
    for (let i = 0; i < 2000; i++) {
      secret = nextSecret(secret);
    }
    answerOne += secret;
  }

  console.log(`Answer 1: ${answerOne}`);
}
