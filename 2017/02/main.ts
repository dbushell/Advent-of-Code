#!/usr/bin/env -S deno run --allow-read

const inputText = await Deno.readTextFile(
  new URL("input.txt", import.meta.url),
);

type Data = Array<Array<number>>;

const spreadsheet: Data = inputText.trim().split("\n").map((
  line,
) => line.split(/\s+/).map(Number));

{
  let sum = 0;
  for (const row of spreadsheet) {
    sum += Math.max(...row) - Math.min(...row);
  }
  console.log(`Answer 1: ${sum}`);
}

{
  let sum = 0;
  for (const row of spreadsheet) {
    ifor: for (let i = 0; i < row.length - 1; i++) {
      for (let j = i + 1; j < row.length; j++) {
        if (i === j) continue;
        const [a, b] = [row[i], row[j]].sort((a, b) => b - a);
        const division = a / b;
        if (Number.isInteger(division)) {
          sum += division;
          break ifor;
        }
      }
    }
  }
  console.log(`Answer 2: ${sum}`);
}
