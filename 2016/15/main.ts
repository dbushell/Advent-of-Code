#!/usr/bin/env -S deno run --allow-read

const inputText = await Deno.readTextFile(
  new URL("input.txt", import.meta.url),
);

type Disk = {
  index: number;
  positions: number;
  start: number;
  now: number;
};

const disks = inputText.trim().split("\n").map((line) => {
  const match = line.match(/#(\d+).+?(\d+).+?(\d+)\.$/)!;
  const [index, positions, start] = match.slice(1, 4).map(Number);
  return { index, positions, start, now: 0 };
}) as Array<Disk>;

const reset = () => disks.forEach((disk) => disk.now = disk.start);

const rotate = (time: number = 1) => {
  disks.forEach((disk) => {
    disk.now += disk.index + time;
    if (disk.now >= disk.positions) disk.now = disk.now % disk.positions;
  });
};

const play = () => {
  for (let i = 1; i++;) {
    reset();
    rotate(i);
    const zero = disks.map((d) => d.now).reduce((c, v) => (c + v), 0);
    if (zero === 0) return i;
  }
};

console.log(`Answer 1: ${play()}`);

disks.push({
  index: disks.length + 1,
  positions: 11,
  start: 0,
  now: 0,
});

console.log(`Answer 2: ${play()}`);
