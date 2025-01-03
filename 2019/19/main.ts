#!/usr/bin/env -S deno run --allow-read

import { type Memory, newVM, outputVM, runVM } from "../intcode.ts";

const inputText = await Deno.readTextFile(
  new URL("input.txt", import.meta.url),
);

const memory: Memory = inputText.trim().split(",").map(Number);

{
  const grid: Array<Array<string>> = [];
  for (let y = 0; y < 50; y++) {
    grid[y] = Array(50);
    for (let x = 0; x < 50; x++) {
      const vm = newVM(memory);
      outputVM(vm, () => (grid[y][x] = vm.output.at(-1) ? "#" : "."));
      vm.input.push(x, y);
      await runVM(vm);
    }
  }
  const answerOne =
    grid.map((layer) => layer.filter((v) => v === "#")).flat().length;
  console.log(`Answer 1: ${answerOne}`);
}

/*************
 * PART TWO! *
 *************/

{
  const square = 100;
  // Horizontal scan size
  const width = square * 1.2;
  const grid: Array<Array<string>> = [];
  let x = 0;
  // Start offset
  let y = square * 3;
  // Last slice of beam
  let x1 = 0;
  let x2 = 0;
  // Scan vertically
  for (; y < y * 2; y++) {
    // Only request top and bottom slice
    for (let iy = y; iy < y + square; iy += square - 1) {
      const gY = iy - y;
      grid[gY] ??= [];
      grid[gY].length = 0;
      for (let ix = x; ix < x + width; ix++) {
        const gX = ix - x;
        const vm = newVM(memory);
        outputVM(vm, () => {
          grid[gY][gX] = vm.output.at(-1) ? "#" : ".";
        });
        vm.input.push(ix, iy);
        await runVM(vm);
        // Skip known beam path
        if (x2 - x1 > 0 && grid[gY][gX] === "#") {
          ix += x2 - x1;
        }
      }
    }

    // Shift focus to place beam in view
    x1 = grid.at(-1)!.findIndex((c) => c === "#");
    x2 = grid.at(-1)!.findLastIndex((c) => c === "#");
    if ((width - x2) < x1 && x1 > 0) x++;

    // Scan for square fit (should be 1?)
    for (let i = 0; i < width - square; i++) {
      if (grid[square - 1][i] !== "#") continue;
      if (grid[square - square][i] !== "#") continue;
      if (grid[square - 1][i + (square - 1)] !== "#") continue;
      if (grid[square - square][i + (square - 1)] !== "#") continue;
      const answerTwo = ((x + i) * 10000) + y;
      console.log(`Answer 2: ${answerTwo} (${x + i},${y})`);
      Deno.exit();
    }
  }
}
