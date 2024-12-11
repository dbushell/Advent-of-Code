#!/usr/bin/env -S deno run --allow-read

const inputText = await Deno.readTextFile(
  new URL("input.txt", import.meta.url),
);

const reverseString = (str: string) => str.split("").reverse().join("");

// Search for all overlapping occurances
const searchString = (haystack: string, needle: string): Array<number> => {
  const count: Array<number> = [];
  for (let i = 0; i < haystack.length; i++) {
    if (haystack.slice(i, i + needle.length) === needle) {
      count.push(i);
    }
  }
  return count;
};

const searchHorizontal = (grid: Array<string>, needle: string): number => {
  let count = 0;
  const eldeen = reverseString(needle);
  for (let i = 0; i < grid.length; i++) {
    count += searchString(grid[i], needle).length;
    count += searchString(grid[i], eldeen).length;
  }
  return count;
};

const searchVertical = (
  grid: Array<string>,
  needle: string,
): number => {
  let count = 0;
  const eldeen = reverseString(needle);
  const getRow = (index: number) =>
    grid.reduce((row, line) => row += line[index], "");
  for (let i = 0; i < grid.length; i++) {
    const haystack = getRow(i);
    count += searchString(haystack, needle).length;
    count += searchString(haystack, eldeen).length;
  }
  return count;
};

const searchDiagonal = (grid: Array<string>, needle: string): number => {
  // Use set to filter unique x/y coordinates
  const countLTR = new Set<string>();
  const countRTL = new Set<string>();
  const eldeen = reverseString(needle);
  // Iterate rows
  for (let rowIndex = 0; rowIndex < grid.length; rowIndex++) {
    // Iterate columns left to right
    for (let colIndex = 0; colIndex < grid[rowIndex].length; colIndex++) {
      let haystack = "";
      let row = rowIndex;
      let col = colIndex;
      while (grid[row]?.[col]) {
        haystack += grid[row++][col++];
      }
      searchString(haystack, needle).forEach((n) => {
        countLTR.add(`${colIndex + n}-${rowIndex + n}`);
      });
      searchString(haystack, eldeen).forEach((n) => {
        countLTR.add(`${colIndex + n}-${rowIndex + n}`);
      });
    }
    // Iterate columns left to right
    for (let colIndex = grid[rowIndex].length - 1; colIndex >= 0; colIndex--) {
      let haystack = "";
      let row = rowIndex;
      let col = colIndex;
      while (col >= 0 && grid[row]?.[col]) {
        haystack += grid[row++][col--];
      }
      searchString(haystack, needle).forEach((n) => {
        countRTL.add(`${colIndex - n}-${rowIndex + n}`);
      });
      searchString(haystack, eldeen).forEach((n) => {
        countRTL.add(`${colIndex - n}-${rowIndex + n}`);
      });
    }
  }
  return countLTR.size + countRTL.size;
};

const needle = "XMAS";
const grid = inputText.trim().split("\n");

const answerOne = searchHorizontal(grid, needle) +
  searchVertical(grid, needle) +
  searchDiagonal(grid, needle);

console.log(`Answer 1: ${answerOne}`);

/*************
 * PART TWO! *
 *************/

// Debug for example input
// console.log(`  0 1 2 3 4 5 6 7 8 9`);
// grid.forEach((line, i) => {
//   console.log([i, ...line].join(" "));
// });

const MAS = ["MAS", "SAM"];

let answerTwo = 0;

// Iterate row index
for (let r = 0; r < grid.length - 2; r++) {
  // Iterate column index
  for (let c = 0; c < grid[r].length - 2; c++) {
    // Check X-MAS in both directions
    const ltr = grid[r + 0][c + 0] + grid[r + 1][c + 1] + grid[r + 2][c + 2];
    const rtl = grid[r + 0][c + 2] + grid[r + 1][c + 1] + grid[r + 2][c + 0];
    if (!MAS.includes(ltr)) continue;
    if (!MAS.includes(rtl)) continue;
    answerTwo++;
  }
}

console.log(`Answer 2: ${answerTwo}`);
