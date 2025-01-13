#!/usr/bin/env -S deno run --allow-read

const inputText = await Deno.readTextFile(
  new URL("input.txt", import.meta.url),
);

type Guard = { id: number; total: number; mins: Array<number> };

const guards = new Map<number, Guard>();

// Parse guards and sort by timestamp
const log: Array<[Date, string]> = [];
for (const line of inputText.split("\n")) {
  const date = line.match(/^\[(.+?)\] (.+?)$/);
  if (date) log.push([new Date(date[1]! + ":00 UTC"), date[2]]);
  const guard = line.match(/Guard #(\d+)/);
  if (!guard) continue;
  const id = Number(guard[1]);
  if (guards.has(id) === false) {
    guards.set(id, { id, total: 0, mins: Array(60).fill(0) });
  }
}
log.sort((a, b) => a[0].getTime() - b[0].getTime());

let guard: Guard | undefined;
let sleep: Date | undefined;
for (const [date, action] of log) {
  const id = action.match(/Guard #(\d+)/);
  if (id) {
    guard = guards.get(Number(id[1])!);
    continue;
  }
  if (action.includes("falls asleep")) {
    sleep = date;
    continue;
  }
  if (guard && action.includes("wakes up")) {
    for (let i = sleep!.getUTCMinutes(); i < date.getUTCMinutes(); i++) {
      guard.mins[i]++;
      guard.total++;
    }
  }
}

// Return most frequent sleep minute
const minute = (guard: Guard): number => {
  let min = [0, 0];
  guard.mins.forEach((v, i) => (v > min[1] ? min = [i, v] : undefined));
  return min[0];
};

{
  const sort = Array.from(guards.values()).sort((a, b) => b.total - a.total);
  console.log(`Answer 1: ${(sort[0].id * minute(sort[0]))}`);
}

{
  const sort = Array.from(guards.values()).sort((a, b) =>
    Math.max(...b.mins) - Math.max(...a.mins)
  );
  console.log(`Answer 2: ${(sort[0].id * minute(sort[0]))}`);
}
