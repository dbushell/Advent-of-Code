#!/usr/bin/env -S deno run --allow-read

const inputText = (await Deno.readTextFile(
  new URL("input.txt", import.meta.url),
)).trim();

const expand = (a: string, length: number): string => {
  let b = "";
  for (let i = a.length - 1; i >= 0; i--) {
    b += a[i] === "0" ? "1" : "0";
  }
  b = a + "0" + b;
  return b.length >= length ? b.slice(0, length) : expand(b, length);
};

const checksum = (a: string): string => {
  let b = "";
  for (let i = 0; i < a.length; i += 2) {
    const c = a[i] + a[i + 1];
    b += c === "00" || c === "11" ? "1" : "0";
  }
  return b.length % 2 === 0 ? checksum(b) : b;
};

console.log(`Answer 1: ${checksum(expand(inputText, 272))}`);
console.log(`Answer 2: ${checksum(expand(inputText, 35651584))}`);
