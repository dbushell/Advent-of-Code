#!/usr/bin/env -S deno run --allow-read

const inputText = await Deno.readTextFile(
  new URL("input.txt", import.meta.url),
);

const points: Array<{ px: number; py: number; vx: number; vy: number }> = [];

for (const line of inputText.split("\n")) {
  const match = line.match(
    /position=<\s*(-?\d+),\s*(-?\d+)> velocity=<\s*(-?\d+),\s*(-?\d+)>/,
  );
  if (!match) continue;
  const [px, py, vx, vy] = match.splice(1, 5).map(Number);
  points.push({ px, py, vx, vy });
}

for (let second = 1; second < Infinity; second++) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = 0;
  let maxY = 0;
  for (const p of points) {
    p.px += p.vx;
    p.py += p.vy;
    minX = Math.min(minX, p.px);
    minY = Math.min(minY, p.py);
    maxX = Math.max(maxX, p.px);
    maxY = Math.max(maxY, p.py);
  }
  // Assume the ASCII art is around 10 characters in height?
  if ((maxY - minY) > 10) continue;
  let out = "";
  for (let y = minY; y < maxY + 1; y++) {
    for (let x = minX; x < maxX + 1; x++) {
      const point = points.some(({ px, py }) => (px === x && py === y));
      out += point ? "# " : ". ";
    }
    out += "\n";
  }
  console.log(out);
  console.log(`Answer 1: [read above]`);
  console.log(`Answer 2: ${second}`);
  break;
}
