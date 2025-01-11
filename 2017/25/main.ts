#!/usr/bin/env -S deno run --allow-read

const inputText = await Deno.readTextFile(
  new URL("input.txt", import.meta.url),
);

const machine = {
  diagnostic: 0,
  state: "",
  tape: [0],
  cursor: 0,
  states: {} as {
    [key: string]: {
      id: string;
      0: { write: number; move: -1 | 1; next: string };
      1: { write: number; move: -1 | 1; next: string };
    };
  },
};

let id = "";
let value: 0 | 1 = 0;
for (const line of inputText.split("\n")) {
  const begin = line.match(/Begin in state (\w)/);
  if (begin) {
    machine.state = begin[1];
    continue;
  }
  const steps = line.match(/checksum after (\d+) steps/);
  if (steps) {
    machine.diagnostic = Number(steps[1]);
    continue;
  }
  const state = line.match(/In state (\w):/);
  if (state) {
    id = state[1];
    machine.states[id] = {
      id,
      0: { write: 0, move: 1, next: "" },
      1: { write: 0, move: 1, next: "" },
    };
    continue;
  }
  const current = line.match(/current value is (\d)/);
  if (current) {
    value = Number(current[1]) as 0 | 1;
    continue;
  }
  const write = line.match(/- Write.*?(\d+)\.$/);
  if (write) {
    machine.states[id][value].write = Number(write[1]);
    continue;
  }
  const move = line.match(/- Move.*?(left|right)\.$/);
  if (move) {
    machine.states[id][value].move = move[1] === "left" ? -1 : 1;
    continue;
  }
  const next = line.match(/- Continue.*?(\w)\.$/);
  if (next) {
    machine.states[id][value].next = next[1];
    continue;
  }
}

for (let i = 0; i < machine.diagnostic; i++) {
  const state = machine.states[machine.state];
  const value = machine.tape[machine.cursor] as 0 | 1;
  const { write, move, next } = state[value];
  machine.tape[machine.cursor] = write;
  machine.cursor += move;
  machine.state = next;
  if (machine.cursor < 0) {
    machine.tape.unshift(0);
    machine.cursor = 0;
  }
  machine.tape[machine.cursor] ??= 0;
}

const checksum = machine.tape.reduce((c, v) => c += v, 0);
console.log(`Answer 1: ${checksum}`);
