#!/usr/bin/env -S deno run --allow-read

const inputText = await Deno.readTextFile(
  new URL("input.txt", import.meta.url),
);

type Room = { id: number; parts: Array<string>; checksum: string };

const rooms: Array<Room> = [];

for (const line of inputText.trim().split("\n")) {
  const parts = line.split("-");
  const [, id, checksum] = parts.pop()!.match(/^(\d+)\[(\w+)\]$/)!;
  rooms.push({ id: Number.parseInt(id), parts: parts, checksum });
}

const validate = (room: Room): boolean => {
  // Count letter frequency
  const letters = new Map<string, number>();
  for (const char of room.parts.join("")) {
    const n = letters.get(char) ?? 0;
    letters.set(char, n + 1);
  }
  // Sort by frequency then alphabetical
  const common = Array.from(letters).sort((a, b) => {
    if (a[1] !== b[1]) return b[1] - a[1];
    return a[0].localeCompare(b[0]);
  });
  // Match checksum
  const checksum = common.slice(0, 5).map(([c]) => c).join("");
  return room.checksum === checksum;
};

const validRooms = rooms.filter(validate);

// Sum of valid room IDs
const answerOne = validRooms.reduce((s, { id }) => s + id, 0);
console.log(`Answer 1: ${answerOne}`);

// Shift cipher through alphabet
const decrypt = (text: string, times: number): string => {
  const codes = text.split("").map((c) => c.codePointAt(0));
  while (times--) codes.forEach((c, i) => codes[i] = c === 122 ? 97 : ++c!);
  return codes.map((n) => String.fromCodePoint(n!)).join("");
};

const room = validRooms.find((room) => {
  return decrypt(room.parts.join(""), room.id) === "northpoleobjectstorage";
});

console.log(`Answer 2: ${room?.id}`);
