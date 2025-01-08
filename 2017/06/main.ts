#!/usr/bin/env -S deno run --allow-read

const inputText = await Deno.readTextFile(
  new URL("input.txt", import.meta.url),
);

const banks = inputText.trim().split(/\s+/).map(Number);

const seen = new Map<string, number>([[banks.join(""), 0]]);

const cycle = (ci: number): number => {
  // Find memory bank with most blocks
  let index = 0;
  for (let i = 0; i < banks.length; i++) {
    if (banks[i] > banks[index]) index = i;
  }
  // Remove blocks
  let blocks = banks[index];
  banks[index] = 0;
  // Redistribute blocks in cycle
  while (blocks--) {
    if (++index >= banks.length) index %= banks.length;
    banks[index]++;
  }
  // Check infinite loop
  const key = banks.join("");
  if (seen.has(key)) return ci - seen.get(key)!;
  seen.set(key, ci);
  return -1;
};

for (let i = 1; true; i++) {
  const ci = cycle(i);
  if (ci > -1) {
    console.log(`Answer 1: ${i}`);
    console.log(`Answer 2: ${ci}`);
    break;
  }
}
