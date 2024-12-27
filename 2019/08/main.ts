#!/usr/bin/env -S deno run --allow-read

const inputText = await Deno.readTextFile(
  new URL("input.txt", import.meta.url),
);

const digits = inputText.trim().split("").map(Number);

const width = 25;
const height = 6;

const layers: Array<Array<number>> = [];
const pixels = width * height;
for (let i = 0; i < digits.length; i += pixels) {
  layers.push(digits.slice(i, i + pixels));
}
layers.reverse();

const fewestZero = layers.toSorted((a, b) => (
  a.filter((n) => n === 0).length - b.filter((n) => n === 0).length
));

const oneDigits = fewestZero[0].filter((n) => (n === 1));
const twoDigits = fewestZero[0].filter((n) => (n === 2));

const answerOne = oneDigits.length * twoDigits.length;
console.log(`Answer 1: ${answerOne}`);

const image: Array<Array<string>> = Array.from(
  { length: height },
  () => new Array(width).fill(" "),
);

for (let i = 0; i < layers.length; i++) {
  for (let j = 0; j < pixels; j++) {
    const y = Math.floor(j / width);
    const x = j - (y * width);
    const pixel = layers[i][j];
    if (pixel < 2) image[y][x] = pixel ? "#" : " ";
  }
}

console.log(`Answer 2:`);
console.log(image.map((layer) => layer.join(" ")).join("\n"));
