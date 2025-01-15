#!/usr/bin/env -S deno run --allow-read

const inputText = await Deno.readTextFile(
  new URL("input.txt", import.meta.url),
);

type Marble = { value: number; prev?: Marble; next?: Marble };

const [max_players, max_marbles] = inputText.match(/^(\d+).+?(\d+)/)!
  .slice(1, 3).map(Number);

const players = Array(max_players).fill(0);

{
  // Initial solution with array
  const circle = [0];
  let current = 1;
  for (
    let marble = 1, player = -1;
    marble < (max_marbles * 1) + 1;
    marble++
  ) {
    if (marble % 23 === 0) {
      player = ++player % max_players;
      players[player] += marble;
      let position = current - 7;
      if (position < 0) position = circle.length + position;
      players[player] += circle.splice(position, 1)[0];
      current = position;
    } else {
      let position = current + 2;
      if (position > circle.length) position = 1;
      circle.splice(position, 0, marble);
      current = position;
    }
  }
  console.log(`Answer 1: ${Math.max(...players)}`);
}

players.fill(0);

{
  // Optimised solution with linked list
  let head: Marble = { value: 0 };
  let tail = head;
  let current = head;
  for (
    let marble = 1, player = -1;
    marble < (max_marbles * 100) + 1;
    marble++
  ) {
    if (marble % 23 === 0) {
      player = ++player % max_players;
      players[player] += marble;
      for (let i = 0; i < 7; i++) current = current.prev ?? tail;
      players[player] += current.value;
      // Unlink current marble from list
      if (current.prev) current.prev.next = current.next;
      if (current.next) current.next.prev = current.prev;
      if (current === head) head = current.next!;
      if (current === tail) tail = current.prev!;
      // Step forward
      current = current.next ?? head;
    } else {
      // Step forward
      current = current.next ?? head;
      // Insert new link
      const m: Marble = { value: marble, prev: current, next: current.next };
      if (current.next) current.next.prev = m;
      current.next = m;
      current = m;
      if (!m.next) tail = m;
      if (!m.prev) head = m;
    }
  }
  console.log(`Answer 2: ${Math.max(...players)}`);
}
