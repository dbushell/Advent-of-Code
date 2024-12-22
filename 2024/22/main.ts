#!/usr/bin/env -S deno run --allow-read

import { assert } from "jsr:@std/assert/assert";

const inputText = await Deno.readTextFile(
  new URL("input.txt", import.meta.url),
);

const MAX_SECRETS = 2001;
const OFFSET = 0;

type Num = number;
const castNum = Number;
// type Num = bigint;
// const castNum = BigInt;

type Sequence = [Num, Num, Num, Num];

type Iteration = {
  i: number;
  start: Num;
  secret: Num;
  price: Num;
  change: Num;
};

const encoder = new TextEncoder();

export const write = (text: string) =>
  Deno.stdout.writeSync(encoder.encode(text));

const mixSecret = (a: Num, b: Num): Num => {
  const result = castNum(BigInt(a) ^ BigInt(b));
  assert(result >= 0, "Bad XOR mix");
  return result;
};

const pruntSecret = (a: Num): Num => {
  const result = a % castNum(16777216);
  return result;
};

const nextSecret = (a: Num): Num => {
  let secret = a;
  const multiply = secret * castNum(64);
  secret = mixSecret(multiply, secret);
  secret = pruntSecret(secret);
  let divide = secret / castNum(32);
  if (typeof divide === "number") {
    // @ts-ignore Not applied to bigint
    divide = Math.floor(divide);
  }
  secret = mixSecret(divide, secret);
  secret = pruntSecret(secret);
  const multiply2 = secret * castNum(2048);
  secret = mixSecret(multiply2, secret);
  const result = pruntSecret(secret);
  return result;
};

const getPrice = (secret: Num): Num => {
  return secret % castNum(10);
  // return Number.parseInt(Number(secret).toString().at(-1)!);
};

const countPrice = (iterations: Array<Iteration | null>): Num => {
  let count = castNum(0);
  for (const iter of iterations) {
    if (!iter) continue;
    count += iter.price;
  }
  return count;
};

const findSequence = (
  sequence: Sequence,
  iterations: Array<Iteration>,
  offset = 0,
): Iteration | null => {
  for (let i = offset; i < iterations.length - 3; i++) {
    if (iterations[i + 0].change !== sequence[0]) continue;
    if (iterations[i + 1].change !== sequence[1]) continue;
    if (iterations[i + 2].change !== sequence[2]) continue;
    if (iterations[i + 3].change !== sequence[3]) continue;
    return iterations[i + 3];
  }
  return null;
};

{
  // Parse initial input
  const buyers: Array<Num> = [];
  inputText.split("\n").forEach((secret) => {
    if (!/^\d+$/.test(secret)) return;
    buyers.push(castNum(secret));
  });
  let answerOne = castNum(0);
  for (let secret of buyers) {
    for (let i = 0; i < MAX_SECRETS - 1; i++) {
      secret = nextSecret(secret);
    }
    answerOne += secret;
  }
  console.log(`Answer 1: ${answerOne}\n`);
}

{
  const buyers: Array<Num> = [];
  inputText.split("\n").forEach((secret) => {
    if (!/^\d+$/.test(secret)) return;
    buyers.push(castNum(secret));
  });

  // Generate all secrets
  const iterations: Array<Array<Iteration>> = [];
  for (let b = 0; b < buyers.length; b++) {
    let secret = buyers[b];
    let lastPrice = getPrice(secret);
    for (let i = 0; i < MAX_SECRETS; i++) {
      secret = nextSecret(secret);
      const price = getPrice(secret);
      const change = price - lastPrice;
      lastPrice = price;
      iterations[b] ??= [];
      iterations[b][i] = {
        i,
        secret,
        price,
        change,
        start: buyers[b],
      };
    }
  }
  // Sanity check
  for (let b = 0; b < buyers.length; b++) {
    assert(iterations[b].length === MAX_SECRETS);
  }

  const sequenceCache = new Set<string>();

  let bestPrice = castNum(0);
  const bestSequences: Array<[number, Sequence, Num]> = [];
  const bestIters: Array<Array<Iteration | null>> = [];
  performance.mark("1");
  const offset = OFFSET;
  for (let b1 = 0; b1 < buyers.length; b1++) {
    performance.mark("b1");
    write(`Buyer: ${String(b1).padStart(4, " ")}`);
    for (let i = offset; i < iterations[b1].length - 3; i++) {
      const iter1 = iterations[b1][i + 0];
      const iter2 = iterations[b1][i + 1];
      const iter3 = iterations[b1][i + 2];
      const iter4 = iterations[b1][i + 3];
      const sequence: Sequence = [
        iter1.change,
        iter2.change,
        iter3.change,
        iter4.change,
      ];

      const key = sequence.join(",");
      if (sequenceCache.has(key)) continue;
      sequenceCache.add(key);

      // Find all other buyers
      const iters: Array<Iteration | null> = [iter4];
      for (let b2 = 0; b2 < buyers.length; b2++) {
        if (b1 === b2) continue;
        iters.push(findSequence(sequence, iterations[b2], offset));
      }
      assert(iters.length === buyers.length);

      const price = countPrice(iters);
      if (price > bestPrice) {
        bestSequences.push([i, sequence, price]);
        bestIters.push(iters);
        bestPrice = price;
      }
    }
    performance.mark("b2");
    const { duration } = performance.measure("b3", "b1", "b2");
    write(`  ${duration.toFixed(2)} ms\n`);
  }
  performance.mark("2");
  const { duration } = performance.measure("3", "1", "2");
  write(`${(duration / 1000).toFixed(2)} secs\n`);

  bestIters.at(-1)!.forEach((iter) => {
    if (!iter) return;
    assert(iter.i > 1, "Skip first iterations?");
    assert(iter.i < 1999, "Skip last iterations?");
  });

  // console.log(bestIters.at(-1)!.map((iter) => iter?.i).join(", "));
  // console.log(bestSequences);
  // console.log(`Cache size: ${sequenceCache.size}`);

  const answerTwo = bestPrice;
  console.log(`Answer 2: ${answerTwo}`);
}
