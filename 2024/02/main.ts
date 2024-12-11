#!/usr/bin/env -S deno run --allow-read
import { assertEquals } from "jsr:@std/assert";

const inputText = await Deno.readTextFile(
  new URL("input.txt", import.meta.url),
);

const reports: Array<Array<number>> = [];

// Parse lines into report data
for (const inputLine of inputText.split("\n")) {
  const levels = inputLine.split(/\s+/).map((n) => Number.parseInt(n.trim()));
  if (levels.length === 0) continue;
  if (levels.includes(NaN)) continue;
  reports.push(levels);
}

assertEquals(reports.length, 1000, "1000 total reports");

const isReportSafe = (report: Array<number>): boolean => {
  let decreasing: boolean | undefined;
  let increasing: boolean | undefined;
  for (let i = 1; i < report.length; i++) {
    const level = report[i];
    const prevLevel = report[i - 1];
    const delta = level - prevLevel;
    // Attempt to find gradient
    if (decreasing === undefined && delta !== 0) {
      decreasing = delta < 0;
      increasing = delta > 0;
    }
    // Any two adjacent levels differ by at least one and at most three.
    if (Math.abs(delta) < 1 || Math.abs(delta) > 3) {
      return false;
    }
    // The levels are either all increasing or all decreasing.
    if ((increasing && delta <= 0) || (decreasing && delta >= 0)) {
      return false;
    }
  }
  return true;
};

let answerOne = 0;
for (const report of reports) {
  if (isReportSafe(report)) answerOne++;
}

console.log(`Answer 1: ${answerOne}`);

let answerTwo = 0;
reportLoop: for (const report of reports) {
  if (isReportSafe(report)) {
    answerTwo++;
    continue;
  }
  // Brute force it lol
  for (let i = 0; i < report.length; i++) {
    if (
      isReportSafe(report.slice(0, i).concat(report.slice(i + 1)))
    ) {
      answerTwo++;
      continue reportLoop;
    }
  }
}

console.log(`Answer 1: ${answerTwo}`);
