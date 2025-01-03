#!/usr/bin/env -S deno run --allow-read

const inputText = await Deno.readTextFile(
  new URL("input.txt", import.meta.url),
);

const codes = inputText.trim().split("\n");

const abbaRegex = /(\w)(?!\1)(\w)\2\1/g;
const abaRegex = /(?=(\w)(?!\1)(\w)\1)/g;
const supRegex = /\[[^\]]+?\]/g;

const TLS = (ip: string): boolean => {
  // Match ABBA sequences
  const abba = [...ip.matchAll(abbaRegex).map((m) => m[0])];
  if (abba.length === 0) return false;
  // Check inside square brackets
  for (const square of ip.matchAll(supRegex)) {
    if (abba.some((s) => square[0].includes(s))) return false;
  }
  return true;
};

const SSL = (ip: string): boolean => {
  // Match BAB inside brackets
  const bab = new Set<string>();
  for (const square of ip.matchAll(supRegex)) {
    square[0].matchAll(abaRegex)
      .forEach(([_, b, a]) => bab.add(b + a + b));
  }
  if (!bab.size) return false;
  // Match ABA outside brackets
  ip = ip.replaceAll(supRegex, "--");
  const aba = new Set(ip.matchAll(abaRegex).map(([_, a, b]) => a + b + a));
  // Require corresponding pairs
  for (const [a, b] of aba) if (bab.has(b + a + b)) return true;
  return false;
};

const tls = codes.filter(TLS).length;
console.log(`Answer 1: ${tls}`);

const ssl = codes.filter(SSL).length;
console.log(`Answer 2: ${ssl}`);
